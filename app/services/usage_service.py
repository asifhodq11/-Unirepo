"""
app/services/usage_service.py

Tracks and enforces monthly reply limits based on the user's plan.
Free     =   5 replies/month  (manual generation only)
Starter  = 100 replies/month  (manual generation, HITL)
Pro      = 100 replies/month  (autonomous, circuit-breaker via daily_autonomy_limit)
Ultra    = 500 replies/month  (fully autonomous, VIP support, custom brand models)
"""

from datetime import datetime, timedelta

from datetime import datetime, timedelta, timezone
from app.extensions import supabase
from app.utils.exceptions import ReplyLimitReached


PLAN_LIMITS = {
    "free":    5,     # Manual AI replies only
    "starter": 100,   # Manual hold & review
    "pro":     100,   # Autonomous replies
    "ultra":   500,   # Unlimited auto replies (500 cap)
}


def get_plan_limit(plan: str) -> int:
    """Returns the monthly reply limit for a given plan slug."""
    return PLAN_LIMITS.get(plan, 5)


def check_usage_limit(user_id: str) -> None:
    """
    Reads live count from DB on every call.
    Prevents stale session cache from allowing
    over-limit requests when two arrive simultaneously.
    """
    result = (
        supabase.from_("users")
        .select("reply_count_this_month, plan, billing_cycle_start")
        .eq("id", user_id)
        .single()
        .execute()
    )
    user = result.data
    plan = user.get("plan", "free")
    used = user.get("reply_count_this_month", 0)
    limit = get_plan_limit(plan)

    billing_start_str = user.get("billing_cycle_start")
    if billing_start_str:
        billing_start = datetime.fromisoformat(billing_start_str)
        reset_date = billing_start + timedelta(days=30)
    else:
        reset_date = datetime.utcnow() + timedelta(days=30)

    if used >= limit:
        raise ReplyLimitReached(
            used=used,
            limit=limit,
            reset_date=reset_date.isoformat(),
        )


def increment_usage(user_id: str) -> None:
    """
    Increments the reply_count_this_month for the user by 1.
    Uses atomic RPC to prevent race conditions.
    """
    supabase.rpc("increment_reply_count", {"user_id_input": user_id}).execute()


def get_today_reply_count(user_id: str) -> int:
    """
    Counts how many AI replies were generated for this user in the last 24 hours.
    Used by the Pro-plan daily autonomy circuit breaker in run_poller.py.
    """
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    try:
        result = (
            supabase.from_("replies")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .gte("created_at", since)
            .execute()
        )
        return result.count if result.count is not None else 0
    except Exception:
        return 0  # Fail open — do not block generation on a count error
