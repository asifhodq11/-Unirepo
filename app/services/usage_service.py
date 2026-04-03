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
    "free":    10,    # Manual AI replies only
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
    try:
        result = (
            supabase.from_("users")
            .select("reply_count_this_month, plan, billing_cycle_start, subscription_end")
            .eq("id", user_id)
            .single()
            .execute()
        )
        user = result.data
    except Exception as e:
        from app.utils.logger import log_event
        log_event("usage_check_db_error", user_id=user_id, error=str(e))
        raise RuntimeError(f"Failed to check usage limits. Database schema may be missing columns: {str(e)}")
    plan = user.get("plan", "free")
    
    # Graceful degradation: if subscription ended, treat as free plan for limits
    subscription_end_str = user.get("subscription_end")
    if subscription_end_str:
        # Supabase returns ISO 8601 strings
        subscription_end = datetime.fromisoformat(subscription_end_str.replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > subscription_end:
            plan = "free"

    used = user.get("reply_count_this_month", 0)
    limit = get_plan_limit(plan)

    billing_start_str = user.get("billing_cycle_start")
    if billing_start_str:
        billing_start = datetime.fromisoformat(billing_start_str)
        reset_date = billing_start + timedelta(days=30)
    else:
        reset_date = datetime.now(timezone.utc) + timedelta(days=30)

    if used >= limit:
        raise ReplyLimitReached(
            used=used,
            limit=limit,
            reset_date=reset_date.isoformat(),
        )


def increment_usage(user_id: str) -> None:
    """
    Increments the reply_count_this_month for the user.
    Uses an atomic RPC with a built-in limit check and row-level locking
    to prevent race conditions (Wave 2 Hardening).
    """
    # 1. Fetch current plan to determine limit
    try:
        result = (
            supabase.from_("users")
            .select("plan")
            .eq("id", user_id)
            .single()
            .execute()
        )
        if not result.data:
            return
    except Exception as e:
        from app.utils.logger import log_event
        log_event("increment_usage_db_error", user_id=user_id, error=str(e))
        return  # Fail gracefully on usage increment so we don't break generation
    
    plan = result.data.get("plan", "free")
    limit = get_plan_limit(plan)

    # 2. Call the atomic RPC which returns a boolean
    rpc_result = supabase.rpc("increment_reply_count", {
        "user_id_input": user_id,
        "max_limit": limit
    }).execute()

    # 3. Handle failure (limit hit during race condition)
    if rpc_result.data is False:
        # We don't have the b_start here for a pretty reset_date, 
        # but check_usage_limit would have caught this 99% of the time anyway.
        raise ReplyLimitReached(used=limit, limit=limit, reset_date="next cycle")


def reserve_bulk_usage(user_id: str, count: int) -> None:
    """
    Reserved multiple credits for a bulk operations atomically.
    Used by /reviews/bulk-generate to ensure all-or-nothing credit commitment.
    """
    if count <= 0:
        return

    # 1. Fetch current plan to determine limit
    try:
        result = (
            supabase.from_("users")
            .select("plan")
            .eq("id", user_id)
            .single()
            .execute()
        )
        if not result.data:
            return
    except Exception as e:
        raise RuntimeError(f"Failed to reserve bulk usage. DB error: {str(e)}")
    
    plan = result.data.get("plan", "free")
    limit = get_plan_limit(plan)

    # 2. Call the bulk reservation RPC
    rpc_result = supabase.rpc("check_and_reserve_bulk_credits", {
        "user_id_input": user_id,
        "required_count": count,
        "max_limit": limit
    }).execute()

    # 3. Handle failure (Atomic rejection)
    if rpc_result.data is False:
        raise ReplyLimitReached(
            used="Calculated",
            limit=limit,
            reset_date="Insufficient credits for bulk batch."
        )


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
    except Exception as e:
        from app.utils.logger import log_event
        log_event("usage_count_error", user_id=user_id, error=str(e), stage="get_today_count")
        return 0  # Fail open — do not block generation on a count error
