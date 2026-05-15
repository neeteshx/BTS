from rest_framework import serializers
from .models import User

from .models import Category, Transaction

from .models import Budget, InvestmentAsset, InvestmentTransaction, MonthlyReport

# Used to return user data safely (without the password)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'dob', 'gender']

# Used specifically for the Sign-Up process
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True) # write_only ensures password never leaves the server in JSON

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'dob', 'gender']

    # The create_user method automatically hashes the password using bcrypt
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            dob=validated_data.get('dob'),
            gender=validated_data.get('gender', '')
        )
        return user

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'type'] 
        # Notice we don't include 'user' here. We will set the user automatically in the backend for security.

class TransactionSerializer(serializers.ModelSerializer):
    # This allows the API to return the category name (e.g., "Groceries") instead of just the ID number (e.g., 4)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'category', 'category_name', 'amount', 'date', 'description', 'created_at']

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
    # This nests the transactions inside the asset for a detailed view
    transactions = InvestmentTransactionSerializer(many=True, read_only=True)

    class Meta:
        model = InvestmentAsset
        fields = ['id', 'symbol_or_name', 'asset_type', 'total_shares', 'average_buy_price', 'transactions']

class MonthlyReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyReport
        fields = ['id', 'month', 'year', 'total_income', 'total_expenses', 'top_expense_category']