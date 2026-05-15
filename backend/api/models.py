from django.contrib.auth.models import AbstractUser
from django.db import models

# 1. Custom User Model
class User(AbstractUser):
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    )
    
    email = models.EmailField(unique=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)

    def __str__(self):
        return self.username


# 2. Core Budgeting Models
class Category(models.Model):
    CATEGORY_TYPES = (
        ('INCOME', 'Income'),
        ('EXPENSE', 'Expense'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=50)
    type = models.CharField(max_length=10, choices=CATEGORY_TYPES)
    
    class Meta:
        unique_together = ('user', 'name')

    def __str__(self):
        return f"{self.name} ({self.type})"


class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='budgets')
    monthly_limit = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.category.name} Budget: {self.monthly_limit}"


class Transaction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    # SET_NULL ensures deleting a category keeps the financial history intact
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.date} | {self.amount}"


# 3. Monthly Reporting Model (Snapshots)
class MonthlyReport(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    month = models.IntegerField()
    year = models.IntegerField()
    total_income = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    top_expense_category = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'month', 'year')


# 4. Investment Tracking Models
class InvestmentAsset(models.Model):
    ASSET_TYPES = (
        ('STOCK', 'Stock'),
        ('CRYPTO', 'Cryptocurrency'),
        ('REAL_ESTATE', 'Real Estate'),
        ('MF', 'Mutual Fund'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    symbol_or_name = models.CharField(max_length=50)
    asset_type = models.CharField(max_length=20, choices=ASSET_TYPES)
    total_shares = models.DecimalField(max_digits=15, decimal_places=6, default=0)
    average_buy_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.symbol_or_name} ({self.total_shares})"


class InvestmentTransaction(models.Model):
    TRANSACTION_TYPES = (
        ('BUY', 'Buy'),
        ('SELL', 'Sell'),
    )
    asset = models.ForeignKey(InvestmentAsset, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=4, choices=TRANSACTION_TYPES)
    shares = models.DecimalField(max_digits=15, decimal_places=6)
    price_per_share = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()

    def __str__(self):
        return f"{self.transaction_type} {self.shares} of {self.asset.symbol_or_name}"