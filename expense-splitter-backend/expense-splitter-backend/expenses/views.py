from rest_framework import generics, status, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Sum, Q
from django.utils import timezone
from decimal import Decimal
from .models import Group, GroupMembership, Expense, ExpenseSplit, Settlement, Activity
from .serializers import (
    GroupSerializer, GroupCreateSerializer, ExpenseSerializer,
    ExpenseCreateSerializer, SettlementSerializer, ActivitySerializer
)

User = get_user_model()

def log_activity(group, user, action, description, expense=None, settlement=None):
    Activity.objects.create(
        group=group, user=user, action=action,
        description=description, expense=expense, settlement=settlement
    )

class GroupViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return GroupCreateSerializer
        return GroupSerializer

    def get_queryset(self):
        return Group.objects.filter(expense_groups__user=self.request.user, is_active=True).distinct()

    def perform_create(self, serializer):
        group = serializer.save(created_by=self.request.user)
        GroupMembership.objects.create(user=self.request.user, group=group, role='admin')
        log_activity(group, self.request.user, 'group_created', f"Created group '{group.name}'")

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        group = self.get_object()
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            membership, created = GroupMembership.objects.get_or_create(user=user, group=group)
            if created:
                log_activity(group, request.user, 'member_added', f"Added {user.full_name} to group")
                return Response({'message': f'{user.full_name} added to group'})
            return Response({'message': 'User already in group'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        group = self.get_object()
        user_id = request.data.get('user_id')
        try:
            membership = GroupMembership.objects.get(user_id=user_id, group=group)
            user = membership.user
            membership.delete()
            log_activity(group, request.user, 'member_removed', f"Removed {user.full_name} from group")
            return Response({'message': f'{user.full_name} removed from group'})
        except GroupMembership.DoesNotExist:
            return Response({'error': 'Membership not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def balances(self, request, pk=None):
        group = self.get_object()
        balances = {}
        members = group.members.all()
        for member in members:
            balances[member.id] = {
                'user': {'id': member.id, 'name': member.full_name, 'email': member.email},
                'paid': Decimal('0'),
                'owed': Decimal('0'),
                'net': Decimal('0')
            }

        for expense in group.expenses.all():
            payer_id = expense.paid_by_id
            if payer_id in balances:
                balances[payer_id]['paid'] += expense.amount
            for split in expense.splits.filter(is_settled=False):
                uid = split.user_id
                if uid in balances:
                    balances[uid]['owed'] += split.amount

        for uid in balances:
            balances[uid]['net'] = balances[uid]['paid'] - balances[uid]['owed']

        return Response(list(balances.values()))

    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        group = self.get_object()
        total = group.expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        member_count = group.members.count()
        expense_count = group.expenses.count()
        pending_settlements = group.settlements.filter(status='pending').count()
        return Response({
            'total_expenses': total,
            'member_count': member_count,
            'expense_count': expense_count,
            'pending_settlements': pending_settlements
        })

class ExpenseViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return ExpenseCreateSerializer
        return ExpenseSerializer

    def get_queryset(self):
        group_id = self.kwargs.get('group_pk')
        if group_id:
            return Expense.objects.filter(group_id=group_id, group__expense_groups=self.request.user)
        return Expense.objects.filter(group__expense_groups=self.request.user)

    def perform_create(self, serializer):
        group_id = self.kwargs.get('group_pk')
        group = Group.objects.get(pk=group_id)
        expense = serializer.save(group=group, created_by=self.request.user)

        # Auto equal split if no splits provided
        if expense.split_type == 'equal' and not expense.splits.exists():
            members = group.members.all()
            split_amount = expense.amount / len(members)
            for member in members:
                ExpenseSplit.objects.create(expense=expense, user=member, amount=round(split_amount, 2))

        log_activity(group, self.request.user, 'expense_added',
                     f"Added expense '{expense.description}' for {expense.amount} {expense.currency}",
                     expense=expense)

    def perform_update(self, serializer):
        expense = serializer.save()
        log_activity(expense.group, self.request.user, 'expense_edited',
                     f"Updated expense '{expense.description}'", expense=expense)

    def perform_destroy(self, instance):
        log_activity(instance.group, self.request.user, 'expense_deleted',
                     f"Deleted expense '{instance.description}'")
        instance.delete()

class SettlementViewSet(viewsets.ModelViewSet):
    serializer_class = SettlementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        group_id = self.kwargs.get('group_pk')
        if group_id:
            return Settlement.objects.filter(group_id=group_id)
        return Settlement.objects.filter(
            Q(from_user=self.request.user) | Q(to_user=self.request.user)
        )

    def perform_create(self, serializer):
        group_id = self.kwargs.get('group_pk')
        group = Group.objects.get(pk=group_id)
        settlement = serializer.save(group=group)
        log_activity(group, self.request.user, 'settlement_created',
                     f"Settlement of {settlement.amount} from {settlement.from_user.full_name} to {settlement.to_user.full_name}",
                     settlement=settlement)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None, group_pk=None):
        settlement = self.get_object()
        settlement.status = 'completed'
        settlement.settled_at = timezone.now()
        settlement.save()
        ExpenseSplit.objects.filter(
            expense__group=settlement.group,
            user=settlement.from_user,
            is_settled=False
        ).update(is_settled=True)
        log_activity(settlement.group, request.user, 'settlement_completed',
                     f"Settlement of {settlement.amount} marked as completed",
                     settlement=settlement)
        return Response({'message': 'Settlement completed'})

class ActivityListView(generics.ListAPIView):
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        group_id = self.kwargs.get('group_pk')
        if group_id:
            return Activity.objects.filter(group_id=group_id)
        return Activity.objects.filter(group__expense_groups=self.request.user)

class DashboardView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        groups = Group.objects.filter(expense_groups=user, is_active=True).distinct()
        total_paid = Expense.objects.filter(paid_by=user).aggregate(t=Sum('amount'))['t'] or 0
        total_owed = ExpenseSplit.objects.filter(user=user, is_settled=False).aggregate(t=Sum('amount'))['t'] or 0
        pending_settlements = Settlement.objects.filter(
            Q(from_user=user) | Q(to_user=user), status='pending'
        ).count()
        recent_activities = Activity.objects.filter(
            group__in=groups
        )[:10]
        return Response({
            'group_count': groups.count(),
            'total_paid': total_paid,
            'total_owed': total_owed,
            'pending_settlements': pending_settlements,
            'recent_activities': ActivitySerializer(recent_activities, many=True).data
        })
