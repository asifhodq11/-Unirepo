"""
run_poller.py

Standalone background worker script representing 'Track A: The Simulation Engine'.
This script runs outside of the Flask web server (e.g. via cron or Railway scheduler every 15 mins).

Plan-Aware Logic (Phase 10):
  - free    : Users are polled but only collected if they  have google_connected.
                No auto-AI generation for free users ever.
  - starter : Reviews are COLLECTED only (status='pending').
                AI only runs when user manually clicks 'Generate' in the dashboard.
  - pro     : Full autonomous pipeline BUT gated by daily_autonomy_limit.
                When the daily limit is hit, overflow reviews are saved as 'pending'
                and a surge_limit_reached event is logged.
"""

import os
import socket
import time
from app import create_app
from app.extensions import supabase
from app.utils.logger import log_event
from app.models.review_model import insert_review
from app.models.reply_model import insert_reply
from app.services.ai_engine import generate_reply
from app.services.usage_service import increment_usage, get_today_reply_count
from app.services.google_api_service import get_master_access_token, fetch_recent_reviews
from app.utils.exceptions import PollerError, InvalidGrantError

_INSTANCE_ID = socket.gethostname()
_LOCK_TIMEOUT_MINUTES = 30  # Release stale locks older than 30 min


def _try_acquire_lock() -> bool:
    """
    Attempts to acquire the global poller mutex.
    Uses Supabase UPDATE with a WHERE clause that acts as an atomic CAS
    (Compare-And-Set): only succeeds if no active lock or lock is stale.
    Returns True if the lock was acquired, False if another instance holds it.
    """
    try:
        stale_threshold = f"now() - interval '{_LOCK_TIMEOUT_MINUTES} minutes'"
        # Acquire if: lock is unheld (acquired_by IS NULL) OR stale (older than 30 min)
        result = supabase.rpc("acquire_poller_lock", {
            "instance_id": _INSTANCE_ID,
            "timeout_minutes": _LOCK_TIMEOUT_MINUTES
        }).execute()
        return bool(result.data)
    except Exception as e:
        log_event("poller_lock_error", stage="acquire", error=str(e))
        return False  # Fail closed — do not run if lock state is unknown


def _release_lock() -> None:
    """Unconditionally releases the global poller mutex."""
    try:
        supabase.from_("poller_lock").update({
            "acquired_by": None,
            "acquired_at": "now()"
        }).eq("lock_name", "global_poller").execute()
    except Exception as e:
        log_event("poller_lock_error", stage="release", error=str(e))


def run_google_poller():
    # ── Distributed Concurrency Lock ───────────────────────────
    if not _try_acquire_lock():
        log_event("poller_skipped", reason="Another instance is already running", instance=_INSTANCE_ID)
        return
    log_event("poller_started", environment="google_api", instance=_INSTANCE_ID)
    try:
        _run_poller_body()
    finally:
        _release_lock()
        log_event("poller_lock_released", instance=_INSTANCE_ID)


def _run_poller_body():
    """Core poller logic — called only after the mutex is held."""
    from app.services.health_service import preflight_check

    # ── Pre-flight: abort if external dependencies are down ────
    if not preflight_check():
        log_event(
            "poller_aborted",
            reason="Pre-flight health check failed — external dependency is down. No user processing this cycle.",
        )
        return

    # 1. Fetch active users — now includes plan + daily_autonomy_limit for tier logic

    try:
        users_result = supabase.table("users").select(
            "id, business_name, business_type, tone_preference, plan, daily_autonomy_limit, google_location_id"
        ).eq("google_connected", True).execute()
        users = users_result.data if users_result.data else []
    except Exception as e:
        log_event("poller_error", stage="fetch_users", error=str(e))
        raise PollerError(stage="fetch_users", message=str(e))

    log_event("poller_user_count", total_active_users=len(users))

    # Fetch Master Token once per cycle
    try:
        access_token = get_master_access_token()
    except InvalidGrantError as e:
        log_event("poller_terminal_error", stage="oauth_token", error="INVALID_GRANT: Master Token revoked or expired.", action="degrading_all_users")
        # Global degradation: Set all connected users to degraded
        try:
            supabase.table("users").update({"google_status": "degraded"}).eq("google_connected", True).execute()
        except Exception as update_err:
            log_event("poller_error", stage="degrade_users", error=str(update_err))
        raise PollerError(stage="oauth_token", message=str(e))

    if not access_token:
        error_msg = "Failed to acquire Google Master Access Token. Check your .env credentials (GOOGLE_CLIENT_ID, etc)."
        log_event("poller_error", stage="oauth_token", error=error_msg)
        raise PollerError(stage="oauth_token", message=error_msg)

    # 2. Iterate and process reviews per user
    for user in users:
        user_id   = user["id"]
        biz_name  = user["business_name"] or "Unknown Business"
        biz_type  = user["business_type"] or "Retail Store"
        tone      = user["tone_preference"] or "professional"
        plan      = user.get("plan", "free")
        # Default limit: 20 if column not yet migrated or null
        daily_limit = user.get("daily_autonomy_limit") or 20
        
        location_id = user.get("google_location_id")
        if not location_id:
            continue
            
        # 2a. Fetch from Real Google API
        real_reviews = fetch_recent_reviews(location_id, access_token)
        if not real_reviews:
            continue
            
        for rev_payload in real_reviews:
            google_id = rev_payload.get("name")
            if not google_id:
                continue
            
            # 2b. Deduplication — skip already-processed reviews unless they previously FAILED
            existing = supabase.table("reviews").select("id, status").eq("user_id", user_id).eq("google_review_id", google_id).execute()
            
            # If a record exists and it's NOT in a failed state, we skip it.
            # If it's in 'failed' status, we give it another shot (AI retry).
            if existing.data:
                status = existing.data[0].get("status")
                if status != "failed":
                    continue
                # If we are here, status is 'failed', so we proceed to re-insert or re-process.
                # Actually, to avoid PKEY violations if google_review_id is unique or similar,
                
            review_text = rev_payload.get("comment", "")
            if not review_text.strip():
                continue # Skip empty reviews, AI has nothing to reply to

            # Handle anonymous reviewers gracefully
            reviewer_name = rev_payload.get("reviewer", {}).get("displayName", "")
            if not reviewer_name or reviewer_name == "A Google User":
                reviewer_name = None

            rating_map = {"ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5}
            raw_rating = rev_payload.get("starRating", "FIVE")
            numeric_rating = rating_map.get(raw_rating, 5)
                
            # 2c. Build the review record
            review_record = {
                "google_review_id": google_id,
                "reviewer_name":    reviewer_name,
                "rating":           numeric_rating,
                "review_text":      review_text,
                "status":           "pending",
            }
            
            # Insert review into DB regardless of plan
            inserted_review = insert_review(user_id, review_record)
            if not inserted_review:
                log_event("poller_error", stage="insert_review", user_id=user_id)
                continue
                
            review_db_id = inserted_review["id"]
 
            # ── PLAN-AWARE AI GATE ────────────────────────────────
            #
            # STARTER: Collect only — user must click Generate manually.
            if plan == "starter":
                log_event("poller_collected_starter", user_id=user_id, review_id=review_db_id)
                continue  # No AI, no cost. Review sits as 'pending'.
 
            # FREE: No autonomous generation either.
            if plan == "free":
                log_event("poller_collected_free", user_id=user_id, review_id=review_db_id)
                continue
 
            # PRO: Check daily autonomy circuit breaker before calling AI.
            if plan == "pro":
                today_count = get_today_reply_count(user_id)
                if today_count >= daily_limit:
                    log_event(
                        "surge_limit_reached",
                        user_id=user_id,
                        review_id=review_db_id,
                        today_count=today_count,
                        daily_limit=daily_limit,
                        action="queued_as_pending",
                    )
                    # Review already saved as 'pending' — user can generate manually
                    continue
            # ─────────────────────────────────────────────────────
 
            # 2d. Trigger the AI Pipeline (Pro plan under daily limit)
            start_time = time.time()
            try:
                ai_result = generate_reply(
                    business_name=biz_name,
                    business_type=biz_type,
                    tone_preference=tone,
                    star_rating=review_record["rating"],
                    review_text=review_record["review_text"]
                )
                
                gen_ms = int((time.time() - start_time) * 1000)
                
                reply_record = {
                    "review_id":     review_db_id,
                    "reply_text":    ai_result["text"],
                    "status":        "draft",
                    "model_used":    ai_result.get("model_used", "google_poller_auto"),
                    "generation_ms": gen_ms,
                    "tokens_used":   ai_result["tokens"],
                    "cost_usd":      ai_result["cost_usd"],
                }
                insert_reply(user_id, reply_record)
                increment_usage(user_id)
                
                supabase.table("reviews").update({"status": "replied"}).eq("id", review_db_id).execute()
                log_event("poller_success_draft_created", user_id=user_id, review_id=review_db_id)
                
            except Exception as e_ai:
                log_event("poller_error", stage="ai_generation", user_id=user_id, review_id=review_db_id, error=str(e_ai))
                supabase.table("reviews").update({"status": "failed"}).eq("id", review_db_id).execute()
 
    log_event("poller_completed")
 
 
if __name__ == "__main__":
    # Load the Flask App context so config & extensions (Supabase) are wired correctly
    # We use 'development' as default for testing the simulation
    import os
    env = os.environ.get("FLASK_ENV", "development")
    app = create_app(env)
    
    with app.app_context():
        run_google_poller()
