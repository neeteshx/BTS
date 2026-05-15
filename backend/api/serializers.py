from rest_framework import serializers
from .models import User, Category, Transaction, Budget, InvestmentAsset, InvestmentTransaction, MonthlyReport

# --- AUTH SERIALIZERS ---
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'dob', 'gender']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'dob', 'gender']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            dob=validated_data.get('dob'),
            gender=validated_data.get('gender', '')
        )
        return user


# --- APP SERIALIZERS ---
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'type'] 

class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    type = serializers.CharField(source='category.type', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'category', 'category_name', 'type', 'amount', 'date', 'description', 'created_at']

class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Budget
        fields = ['id', 'category', 'category_name', 'monthly_limit']

class InvestmentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestmentTransaction
        fields = ['id', 'asset', 'transaction_type', 'shares', 'price_per_share', 'date']

class InvestmentAssetSerializer(serializers.ModelSerializer):
    transactions = InvestmentTransactionSerializer(many=True, read_only=True)

    class Meta:
        model = InvestmentAsset
        fields = ['id', 'symbol_or_name', 'asset_type', 'total_shares', 'average_buy_price', 'transactions']

class MonthlyReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyReport
        fields = ['id', 'month', 'year', 'total_income', 'total_expenses', 'top_expense_category']