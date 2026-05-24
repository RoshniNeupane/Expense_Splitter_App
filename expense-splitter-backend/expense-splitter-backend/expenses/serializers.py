from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Group, GroupMembership, Expense, ExpenseSplit, Settlement, Activity

User = get_user_model()

class UserMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'avatar']

class GroupMembershipSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    class Meta:
        model = GroupMembership
        fields = ['id', 'user', 'role', 'joined_at']

class GroupSerializer(serializers.ModelSerializer):
    members = UserMiniSerializer(many=True, read_only=True)
    memberships = GroupMembershipSerializer(source='groupmembership_set', many=True, read_only=True)
    created_by = UserMiniSerializer(read_only=True)
    total_expenses = serializers.ReadOnlyField()
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'category', 'image', 'created_by',
                  'members', 'memberships', 'total_expenses', 'member_count', 'created_at', 'is_active']
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_member_count(self, obj):
        return obj.members.count()

class GroupCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['name', 'description', 'category', 'image']

class ExpenseSplitSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, source='user')

    class Meta:
        model = ExpenseSplit
        fields = ['id', 'user', 'user_id', 'amount', 'percentage', 'is_settled']

class ExpenseSerializer(serializers.ModelSerializer):
    paid_by = UserMiniSerializer(read_only=True)
    paid_by_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, source='paid_by')
    splits = ExpenseSplitSerializer(many=True, read_only=True)
    created_by = UserMiniSerializer(read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'group', 'description', 'amount', 'currency', 'paid_by', 'paid_by_id',
                  'split_type', 'category', 'date', 'notes', 'receipt', 'splits', 'created_by', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']

class ExpenseCreateSerializer(serializers.ModelSerializer):
    paid_by_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='paid_by')
    splits_data = serializers.ListField(child=serializers.DictField(), write_only=True, required=False)

    class Meta:
        model = Expense
        fields = ['description', 'amount', 'currency', 'paid_by_id', 'split_type',
                  'category', 'date', 'notes', 'receipt', 'splits_data']

    def create(self, validated_data):
        splits_data = validated_data.pop('splits_data', [])
        expense = Expense.objects.create(**validated_data)
        for split in splits_data:
            ExpenseSplit.objects.create(
                expense=expense,
                user_id=split['user_id'],
                amount=split['amount'],
                percentage=split.get('percentage')
            )
        return expense

class SettlementSerializer(serializers.ModelSerializer):
    from_user = UserMiniSerializer(read_only=True)
    to_user = UserMiniSerializer(read_only=True)
    from_user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, source='from_user')
    to_user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, source='to_user')

    class Meta:
        model = Settlement
        fields = ['id', 'group', 'from_user', 'to_user', 'from_user_id', 'to_user_id',
                  'amount', 'currency', 'status', 'notes', 'payment_method', 'created_at', 'settled_at']
        read_only_fields = ['id', 'created_at', 'settled_at']

class ActivitySerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model = Activity
        fields = ['id', 'group', 'user', 'action', 'description', 'expense', 'settlement', 'created_at']
