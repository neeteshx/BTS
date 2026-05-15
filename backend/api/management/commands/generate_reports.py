from django.core.management.base import BaseCommand
from django.db.models import Sum
from datetime import datetime, timedelta
from api.models import User, Transaction, MonthlyReport

class Command(BaseCommand):
    help = 'Generates monthly financial reports for all users for the previous month.'

    def handle(self, *args, **kwargs):
        # 1. Figure out what the "previous month" is
        today = datetime.today()
        first_of_this_month = today.replace(day=1)
        last_day_of_prev_month = first_of_this_month - timedelta(days=1)

        target_month = last_day_of_prev_month.month
        target_year = last_day_of_prev_month.year

        self.stdout.write(f"Generating reports for {target_month}/{target_year}...")

        users = User.objects.all()
        for user in users:
            # 2. Get all transactions for this user for the target month
            monthly_txns = Transaction.objects.filter(
                user=user,
                date__month=target_month,
                date__year=target_year
            )

            # 3. Calculate Totals
            income = monthly_txns.filter(category__type='INCOME').aggregate(Sum('amount'))['amount__sum'] or 0
            expenses = monthly_txns.filter(category__type='EXPENSE').aggregate(Sum('amount'))['amount__sum'] or 0

            # 4. Find the Top Expense Category
            top_category_name = "None"
            expense_txns = monthly_txns.filter(category__type='EXPENSE')
            
            if expense_txns.exists():
                # Group by category, sum the amounts, order highest to lowest, and grab the first one
                top_cat = expense_txns.values('category__name').annotate(total=Sum('amount')).order_by('-total').first()
                if top_cat:
                    top_category_name = top_cat['category__name']

            # 5. Save the Report
            # update_or_create is great: if a report already exists for this month, it just updates the numbers. 
            # If not, it creates a new row. This prevents accidental duplicates if you run the script twice!
            report, created = MonthlyReport.objects.update_or_create(
                user=user,
                month=target_month,
                year=target_year,
                defaults={
                    'total_income': income,
                    'total_expenses': expenses,
                    'top_expense_category': top_category_name
                }
            )

            status = "Created" if created else "Updated"
            self.stdout.write(f"  -> [{status}] Report for {user.username}")

        self.stdout.write(self.style.SUCCESS('Successfully generated all reports!'))