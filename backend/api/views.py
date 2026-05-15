from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User
from .serializers import RegisterSerializer, UserSerializer

from rest_framework import viewsets
from django.db.models import Sum
from datetime import datetime
from .models import Category, Transaction
from .serializers import CategorySerializer, TransactionSerializer
from .models import Budget, InvestmentAsset, InvestmentTransaction, MonthlyReport
from .serializers import (
    BudgetSerializer, InvestmentAssetSerializer, 
    InvestmentTransactionSerializer, MonthlyReportSerializer
)

# 1. Sign Up API
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,) # Anyone can access this endpoint
    serializer_class = RegisterSerializer

# 2. Get Current User API (Requires Login)
class UserProfileView(APIView):
    permission_classes = (IsAuthenticated,) # Only users with a valid JWT can access this

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

# --- 1. Category CRUD API ---
class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    # Security: Users can ONLY see their own categories
    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    # Security: When creating a category, automatically assign the logged-in user
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# --- 2. Transaction CRUD API ---
class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    # Security: Users can ONLY see their own transactions
    def get_queryset(self):
        # We can also add a feature here to filter by month via the URL query params later
        return Transaction.objects.filter(user=self.request.user).order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# --- 3. Dashboard Summary API ---
class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        current_month = datetime.now().month
        current_year = datetime.now().year

        # Get all transactions for this user for the current month
        monthly_txns = Transaction.objects.filter(
            user=user, 
            date__month=current_month, 
            date__year=current_year
        )

        # Sum the income
        income = monthly_txns.filter(category__type='INCOME').aggregate(total=Sum('amount'))['total'] or 0

        # Sum the expenses
        expenses = monthly_txns.filter(category__type='EXPENSE').aggregate(total=Sum('amount'))['total'] or 0

        return Response({
            "month": current_month,
            "year": current_year,
            "total_income": float(income),
            "total_expenses": float(expenses),
            "net_balance": float(income - expenses)
        })

# --- 4. Budget API ---
class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# --- 5. Investment Asset API ---
class InvestmentAssetViewSet(viewsets.ModelViewSet):
    serializer_class = InvestmentAssetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InvestmentAsset.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# --- 6. Investment Transaction API ---
class InvestmentTransactionViewSet(viewsets.ModelViewSet):
    serializer_class = InvestmentTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InvestmentTransaction.objects.filter(asset__user=self.request.user)

    def perform_create(self, serializer):
        # Logic to update the Asset totals when a transaction occurs
        transaction = serializer.save()
        asset = transaction.asset
        if transaction.transaction_type == 'BUY':
            asset.total_shares += transaction.shares
        elif transaction.transaction_type == 'SELL':
            asset.total_shares -= transaction.shares
        asset.save()

# --- 7. Monthly Reports API (Read Only) ---
class MonthlyReportViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MonthlyReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MonthlyReport.objects.filter(user=self.request.user).order_by('-year', '-month')