from django.contrib import admin
from .models import User, Category, Budget, Transaction, MonthlyReport, InvestmentAsset, InvestmentTransaction

# Registering models so they appear in the Admin Dashboard
admin.site.register(User)
admin.site.register(Category)
admin.site.register(Budget)
admin.site.register(MonthlyReport)
admin.site.register(InvestmentAsset)
admin.site.register(InvestmentTransaction)

# Adding a custom view for Transactions to make it easier to read
@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('date', 'user', 'category', 'amount')
    list_filter = ('date', 'category', 'user')