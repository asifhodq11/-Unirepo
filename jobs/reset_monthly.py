"""
jobs/reset_monthly.py

Resets reply_count_this_month to 0 for users whose
billing cycle completes today.
"""

from datetime import date
from app.extensions import supabase
from app.utils.logger import log_event


def get_users_due_for_reset():
    """
    Finds users where 30 or more days have passed since their last billing_cycle_start.
    This safely avoids all leap year and '31st of the month' calendar edge cases.
    """
    today = date.today()

    result = supabase.from_("users").select("id, billing_cycle_start").execute()

    due = []
    if result.data:
        for user in result.data:
            b_start = user.get("billing_cycle_start")
            if not b_start:
                continue

            b_date = date.fromisoformat(b_start)
            # If 30 days have elapsed, they are due for a reset.
            if (today - b_date).days >= 30:
                due.append(user)

    return due


def reset_user_count(user_id):
    """
    Atomic-like reset of monthly usage.
    Sets count to 0 and updates billing_cycle_start to today.
    """
    today = date.today().isoformat()

    supabase.from_("users").update({"reply_count_this_month": 0, "billing_cycle_start": today}).eq(
        "id", user_id
    ).execute()

    log_event("info", "monthly_count_reset", user_id=user_id)


def run_reset_cycle():
    """Executes the monthly count reset cycle."""
    due_users = get_users_due_for_reset()

    log_event("info", "reset_cycle_start", count=len(due_users))

    for user in due_users:
        try:
            reset_user_count(user["id"])
        except Exception as e:
            # One failure should not stop the entire cycle
            log_event("error", "reset_user_failed", user_id=user.get("id"), error=str(e))

    log_event("info", "reset_cycle_complete")


if __name__ == "__main__":
    run_reset_cycle()
