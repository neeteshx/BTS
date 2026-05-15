# --- IMPORTS ---
from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum
from datetime import datetime
from .emails import send_transaction_alert
from rest_framework.decorators import api_view, permission_classes
# Import Models
from .models import (
    User, Category, Transaction, Budget, 
    InvestmentAsset, InvestmentTransaction, MonthlyReport,
    Goal
)

# Import Serializers
from .serializers import (
    RegisterSerializer, UserSerializer, CategorySerializer, 
    TransactionSerializer, BudgetSerializer, InvestmentAssetSerializer, 
    InvestmentTransactionSerializer, MonthlyReportSerializer, GoalSerializer
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
        # 1. Handle category logic (Find or Create)
        cat_name = self.request.data.get('category_name', 'Misc').capitalize()
        cat_type = self.request.data.get('type', 'EXPENSE')
        category, created = Category.objects.get_or_create(
            user=self.request.user,
            name=cat_name,
            defaults={'type': cat_type}
        )

        # 2. Save the transaction
        transaction = serializer.save(user=self.request.user, category=category)

        # 3. FIRE THE EMAIL 📧
        # We wrap this in a try/except so if Resend fails, the transaction still saves!
        send_transaction_alert(
            user_email=self.request.user.email,
            user_name=self.request.user.username,
            transaction=transaction
        )


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
        # 1. Save the new investment to the portfolio
        asset = serializer.save(user=self.request.user)

        # 2. Calculate the total cost of the investment
        total_cost = asset.total_shares * asset.average_buy_price

        # 3. Auto-Create an "Investments" expense category in the ledger
        category, created = Category.objects.get_or_create(
            user=self.request.user,
            name="Investments",
            defaults={'type': 'EXPENSE'}
        )

        # 4. Automatically deduct the cash from the user's ledger!
        Transaction.objects.create(
            user=self.request.user,
            category=category,
            amount=total_cost,
            description=f"Bought {asset.symbol_or_name} Shares",
            date=datetime.now().date()
        )

    def perform_destroy(self, instance):
        # 1. Calculate how much money to "refund" based on buy price
        total_value = instance.total_shares * instance.average_buy_price

        # 2. Auto-Create an "Investments Sold" income category
        category, created = Category.objects.get_or_create(
            user=self.request.user,
            name="Investments Sold",
            defaults={'type': 'INCOME'}
        )

        # 3. Add the cash back into the ledger!
        Transaction.objects.create(
            user=self.request.user,
            category=category,
            amount=total_value,
            description=f"Sold {instance.symbol_or_name} Shares",
            date=datetime.now().date()
        )

        # 4. Finally, remove the asset from the portfolio
        instance.delete()


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

class GenerateReportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        current_month = datetime.now().month
        current_year = datetime.now().year

        # 1. Grab all transactions for this month
        monthly_txns = Transaction.objects.filter(
            user=user,
            date__month=current_month,
            date__year=current_year
        )

        # 2. Calculate totals
        income = monthly_txns.filter(category__type='INCOME').aggregate(total=Sum('amount'))['total'] or 0
        expenses = monthly_txns.filter(category__type='EXPENSE').aggregate(total=Sum('amount'))['total'] or 0

        # 3. Find the top expense category
        top_category_data = monthly_txns.filter(category__type='EXPENSE') \
            .values('category__name') \
            .annotate(cat_total=Sum('amount')) \
            .order_by('-cat_total') \
            .first()

        top_cat_name = top_category_data['category__name'] if top_category_data else "None"

        # 4. Update or Create the report for this month
        report, created = MonthlyReport.objects.update_or_create(
            user=user,
            month=current_month,
            year=current_year,
            defaults={
                'total_income': income,
                'total_expenses': expenses,
                'top_expense_category': top_cat_name
            }
        )

        return Response({"message": "Report generated successfully!"})

class GoalViewSet(viewsets.ModelViewSet):
    serializer_class = GoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user).order_by('is_completed', '-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user = request.user

    if request.method == 'GET':
        return Response({
            "username": user.username,
            "email": user.email,
            "date_joined": user.date_joined.strftime("%B %Y")
        })

    elif request.method == 'PUT':
        # Quick update logic for the demo
        user.username = request.data.get('username', user.username)
        user.email = request.data.get('email', user.email)
        user.save()
        return Response({"message": "Profile updated successfully!"})