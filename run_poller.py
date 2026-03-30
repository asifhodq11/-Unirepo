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

import time
from app import create_app
from app.extensions import supabase
from app.utils.logger import log_event
from app.models.review_model import insert_review
from app.models.reply_model import insert_reply
from app.services.ai_engine import generate_reply
from app.services.usage_service import increment_usage, get_today_reply_count
from app.services.google_api_service import get_master_access_token, fetch_recent_reviews

def run_simulation_poller():
    log_event("poller_started", environment="simulation")
    
    # 1. Fetch active users — now includes plan + daily_autonomy_limit for tier logic
    try:
        users_result = supabase.table("users").select(
            "id, business_name, business_type, tone_preference, plan, daily_autonomy_limit, google_location_id"
        ).eq("google_connected", True).execute()
        users = users_result.data if users_result.data else []
    except Exception as e:
        log_event("poller_error", stage="fetch_users", error=str(e))
        return

    log_event("poller_user_count", total_active_users=len(users))

    # Fetch Master Token once per cycle
    access_token = get_master_access_token()
    if not access_token:
        log_event("poller_error", stage="oauth_token", error="Failed to acquire Google Master Access Token")
        return

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
            
            # 2b. Deduplicate — skip already-processed reviews
            existing = supabase.table("reviews").select("id").eq("user_id", user_id).eq("google_review_id", google_id).execute()
            if existing.data:
                continue
                
            review_text = rev_payload.get("comment", "")
            if not review_text.strip():
                continue # Skip empty reviews, AI has nothing to reply to

            rating_map = {"ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5}
            raw_rating = rev_payload.get("starRating", "FIVE")
            numeric_rating = rating_map.get(raw_rating, 5)
            
            reviewer_name = rev_payload.get("reviewer", {}).get("displayName", "Customer")
                
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
                    "model_used":    ai_result.get("model_used", "simulation_poller_auto"),
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
        run_simulation_poller()
