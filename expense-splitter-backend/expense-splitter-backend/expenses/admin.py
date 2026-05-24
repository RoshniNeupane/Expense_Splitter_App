from django.contrib import admin
from .models import Group, GroupMembership, Expense, ExpenseSplit, Settlement, Activity

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'created_by', 'created_at']
    list_filter = ['category', 'is_active']
    search_fields = ['name']

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['description', 'amount', 'currency', 'paid_by', 'group', 'date']
    list_filter = ['category', 'split_type', 'currency']
    search_fields = ['description']

@admin.register(Settlement)
class SettlementAdmin(admin.ModelAdmin):
    list_display = ['from_user', 'to_user', 'amount', 'status', 'created_at']
    list_filter = ['status']

admin.site.register(GroupMembership)
admin.site.register(ExpenseSplit)
admin.site.register(Activity)
