import resend
from django.conf import settings

# Load the API key from settings
resend.api_key = settings.RESEND_API_KEY

def send_goal_completed_email(user_email, user_name, goal_name):
    """
    Sends a congratulatory email when a user hits a savings goal.
    """
    try:
        r = resend.Emails.send({
            "from": "Budget Tracker <onboarding@resend.dev>",
            "to": [user_email],
            "subject": f"🎉 You did it, {user_name}!",
            "html": f"""
                <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                    <h2 style="color: #10B981;">Goal Achieved! 🏆</h2>
                    <p>Congratulations <strong>{user_name}</strong>!</p>
                    <p>You have successfully reached your savings target for <strong>{goal_name}</strong>.</p>
                    <p>Log in to your dashboard to set your next big target.</p>
                    <br/>
                    <p style="color: #6b7280; font-size: 12px;">- The Budget Tracker Team</p>
                </div>
            """
        })
        print(f"Email sent successfully! ID: {r['id']}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

def send_transaction_alert(user_email, user_name, transaction):
    """
    Sends an email alert for new transactions or budget breaches.
    """
    try:
        # Determine the emoji and tone based on type
        is_expense = transaction.category.type == 'EXPENSE'
        icon = "💸" if is_expense else "💰"

        r = resend.Emails.send({
            "from": "Budget Tracker <onboarding@resend.dev>",
            "to": [user_email],
            "subject": f"{icon} New Transaction: {transaction.category.name}",
            "html": f"""
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h2 style="color: { '#EF4444' if is_expense else '#10B981' };">
                        Transaction Recorded
                    </h2>
                    <p>Hi {user_name}, a new <strong>{transaction.category.type.lower()}</strong> has been logged:</p>
                    <ul style="list-style: none; padding: 0;">
                        <li><strong>Category:</strong> {transaction.category.name}</li>
                        <li><strong>Amount:</strong> ₹{transaction.amount}</li>
                        <li><strong>Date:</strong> {transaction.date}</li>
                    </ul>
                    <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
                        If this wasn't you, please secure your account immediately.
                    </p>
                </div>
            """
        })
        return True
    except Exception as e:
        print(f"Resend Error: {e}")
        return False