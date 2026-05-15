# --- IMPORTS ---
from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum
from datetime import datetime

# Import Models
from .models import (
    User, Category, Transaction, Budget, 
    InvestmentAsset, InvestmentTransaction, MonthlyReport
)

# Import Serializers
from .serializers import (
    RegisterSerializer, UserSerializer, CategorySerializer, 
    TransactionSerializer, BudgetSerializer, InvestmentAssetSerializer, 
    InvestmentTransactionSerializer, MonthlyReportSerializer
)

# --- 1. Auth APIs ---
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,) 
    serializer_class = RegisterSerializer

class UserProfileView(APIView):
    permission_classes = (IsAuthenticated,) 

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# --- 2. Category CRUD API ---
class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# --- 3. Transaction CRUD API ---
class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-date')

    def perform_create(self, serializer):
        # --- HACKATHON MAGIC: Auto-Create Categories ---
        # Grab the strings sent from Next.js (defaults to Misc/EXPENSE if missing)
        cat_name = self.request.data.get('category_name', 'Misc').capitalize()
        cat_type = self.request.data.get('type', 'EXPENSE')
        
        # Automatically find the category, or create it if it doesn't exist!
        category, created = Category.objects.get_or_create(
            user=self.request.user,
            name=cat_name,
            defaults={'type': cat_type}
        )
        
        # Save the transaction and link it to our newly found/created category
        serializer.save(user=self.request.user, category=category)


# --- 4. Dashboard Summary API ---
class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        current_month = datetime.now().month
        current_year = datetime.now().year

        monthly_txns = Transaction.objects.filter(
            user=user, 
            date__month=current_month, 
            date__year=current_year
        )

        income = monthly_txns.filter(category__type='INCOME').aggregate(total=Sum('amount'))['total'] or 0
        expenses = monthly_txns.filter(category__type='EXPENSE').aggregate(total=Sum('amount'))['total'] or 0

        return Response({
            "month": current_month,
            "year": current_year,
            "total_income": float(income),
            "total_expenses": float(expenses),
            "net_balance": float(income - expenses)
        })


# --- 5. Budget API ---
class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Auto-find or create the category based on the frontend input
        cat_name = self.request.data.get('category_name', 'Misc').capitalize()
        category, created = Category.objects.get_or_create(
            user=self.request.user,
            name=cat_name,
            defaults={'type': 'EXPENSE'}
        )
        serializer.save(user=self.request.user, category=category)


# --- 6. Investment Asset API ---
class InvestmentAssetViewSet(viewsets.ModelViewSet):
    serializer_class = InvestmentAssetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InvestmentAsset.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# --- 7. Investment Transaction API ---
class InvestmentTransactionViewSet(viewsets.ModelViewSet):
    serializer_class = InvestmentTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InvestmentTransaction.objects.filter(asset__user=self.request.user)

    def perform_create(self, serializer):
        transaction = serializer.save()
        asset = transaction.asset
        if transaction.transaction_type == 'BUY':
            asset.total_shares += transaction.shares
        elif transaction.transaction_type == 'SELL':
            asset.total_shares -= transaction.shares
        asset.save()


# --- 8. Monthly Reports API (Read Only) ---
class MonthlyReportViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MonthlyReportSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MonthlyReport.objects.filter(user=self.request.user).order_by('-year', '-month')