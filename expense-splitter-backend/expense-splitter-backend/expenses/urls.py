from django.urls import path, include
from rest_framework_nested import routers
from .views import GroupViewSet, ExpenseViewSet, SettlementViewSet, ActivityListView, DashboardView

try:
    from rest_framework_nested import routers as nested_routers
    router = nested_routers.DefaultRouter()
    router.register(r'groups', GroupViewSet, basename='group')
    groups_router = nested_routers.NestedDefaultRouter(router, r'groups', lookup='group')
    groups_router.register(r'expenses', ExpenseViewSet, basename='group-expenses')
    groups_router.register(r'settlements', SettlementViewSet, basename='group-settlements')
    urlpatterns = [
        path('', include(router.urls)),
        path('', include(groups_router.urls)),
        path('groups/<int:group_pk>/activities/', ActivityListView.as_view(), name='group-activities'),
        path('dashboard/', DashboardView.as_view(), name='dashboard'),
    ]
except ImportError:
    from rest_framework.routers import DefaultRouter
    router = DefaultRouter()
    router.register(r'groups', GroupViewSet, basename='group')
    urlpatterns = [
        path('', include(router.urls)),
        path('dashboard/', DashboardView.as_view(), name='dashboard'),
    ]
