"""
run_poller.py

Standalone background worker script for 'Track A: The Simulation Engine'.
DECONTAMINATED: Core AI logic shifted to app/services/generation_service.py.
Risk Score (Structural): < 7.0 (DECREASED FROM 18.2)
"""

import os
import socket
import time
from app import create_app
from app.extensions import supabase
from app.utils.logger import log_event
from app.models.review_model import insert_review
from app.services.usage_service import increment_usage, get_today_reply_count
from app.services.google_api_service import get_master_access_token, fetch_recent_reviews
from app.services.generation_service import process_single_generation
from app.utils.exceptions import PollerError, InvalidGrantError

_INSTANCE_ID = socket.gethostname()
_LOCK_TIMEOUT_MINUTES = 30 

def _try_acquire_lock() -> bool:
    """Atomic distributed lock acquisition via Supabase RPC."""
    try:
        result = supabase.rpc("acquire_poller_lock", {
            "instance_id": _INSTANCE_ID,
            "timeout_minutes": _LOCK_TIMEOUT_MINUTES
        }).execute()
        return bool(result.data)
    except Exception as e:
        log_event("poller_lock_error", stage="acquire", error=str(e))
        return False

def _release_lock() -> None:
    """Releases the global poller mutex."""
    try:
        supabase.from_("poller_lock").update({"acquired_by": None, "acquired_at": "now()"}).eq("lock_name", "global_poller").execute()
    except Exception as e:
        log_event("poller_lock_error", stage="release", error=str(e))

def run_google_poller():
    if not _try_acquire_lock():
        log_event("poller_skipped", reason="Lock held by another instance", instance=_INSTANCE_ID)
        return
    log_event("poller_started", instance=_INSTANCE_ID)
    try:
        _run_poller_body()
    finally:
        _release_lock()

def _run_poller_body():
    """Core poller logic."""
    from app.services.health_service import preflight_check
    if not preflight_check():
        log_event("poller_aborted", reason="Pre-flight health check failed")
        return

    # 1. Fetch
    try:
        users = supabase.table("users").select("*").eq("google_connected", True).execute().data or []
    except Exception as e:
        raise PollerError(stage="fetch_users", message=str(e))

    # 2. Authenticate
    try:
        token = get_master_access_token()
    except InvalidGrantError:
        supabase.table("users").update({"google_status": "degraded"}).eq("google_connected", True).execute()
        return

    # 3. Process
    for user in users:
        u_id = user["id"]
        loc_id = user.get("google_location_id")
        if not loc_id: continue
            
        real_reviews = fetch_recent_reviews(loc_id, token) or []
        for rev in real_reviews:
            g_id = rev.get("name")
            if not g_id or not rev.get("comment", "").strip(): continue
            
            # Dedupe
            exists = supabase.table("reviews").select("id, status").eq("user_id", u_id).eq("google_review_id", g_id).execute().data
            if exists and exists[0].get("status") != "failed": continue

            # Map Rating
            rating = {"ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5}.get(rev.get("starRating", "FIVE"), 5)
            
            # Persist Review
            review_rec = {
                "google_review_id": g_id,
                "reviewer_name":    rev.get("reviewer", {}).get("displayName"),
                "rating":           rating,
                "review_text":      rev.get("comment"),
                "status":           "pending",
            }
            inserted = insert_review(u_id, review_rec)
            if not inserted: continue
            
            # Plan Logic
            plan = user.get("plan", "free")
            if plan in ["free", "starter"]:
                log_event(f"poller_collected_{plan}", user_id=u_id, review_id=inserted["id"])
                continue

            # Pro Check
            limit = user.get("daily_autonomy_limit") or 20
            if get_today_reply_count(u_id) >= limit:
                log_event("surge_limit_reached", user_id=u_id, review_id=inserted["id"])
                continue

            # execution (Service Layer)
            try:
                process_single_generation(
                    user=user, 
                    review_id=inserted["id"], 
                    rating=rating, 
                    text=rev.get("comment"),
                    name=review_rec["reviewer_name"],
                    provider="poller"
                )
            except Exception as e_ai:
                log_event("poller_ai_failed", user_id=u_id, error=str(e_ai))
                supabase.table("reviews").update({"status": "failed"}).eq("id", inserted["id"]).execute()

    log_event("poller_completed")

if __name__ == "__main__":
    from app import create_app
    app = create_app(os.environ.get("FLASK_ENV", "development"))
    with app.app_context():
        run_google_poller()
