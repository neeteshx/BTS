from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView, 
    UserProfileView, 
    CategoryViewSet, 
    TransactionViewSet, 
    DashboardSummaryView,
    BudgetViewSet, 
    InvestmentAssetViewSet, 
    InvestmentTransactionViewSet, 
    MonthlyReportViewSet,
    GenerateReportView
)

# 1. Initialize the Router
router = DefaultRouter()

# 2. Register your ViewSets
# (Cleaned up the duplicates you had here)
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'budgets', BudgetViewSet, basename='budget')
router.register(r'investments', InvestmentAssetViewSet, basename='investment')
router.register(r'investment-transactions', InvestmentTransactionViewSet, basename='investment-transaction')
router.register(r'reports', MonthlyReportViewSet, basename='report')

# 3. Define the URL patterns
urlpatterns = [
    # Auth Endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('auth/me/', UserProfileView.as_view(), name='me'),

    # Custom API Endpoints
    path('dashboard/', DashboardSummaryView.as_view(), name='dashboard'),
    path('reports/generate/', GenerateReportView.as_view(), name='generate-report'),

    # Router Endpoints
    path('', include(router.urls)), 
]