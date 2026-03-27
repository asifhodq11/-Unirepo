"""
run_poller.py

Standalone background worker script representing 'Track A: The Simulation Engine'.
This script runs outside of the Flask web server (e.g. via cron or Railway scheduler every 15 mins).

It loads the Flask context to use the app's `supabase` client and `config.py`.
1. Queries all active users.
2. Calls the `mock_google.py` API to simulate fetching new reviews.
3. Inserts any non-duplicate reviews into the database.
4. Triggers the AI Engine to generate reply drafts for those new reviews.
"""

import time
from app import create_app
from app.extensions import supabase
from app.utils.logger import log_event
from app.services.mock_google import generate_fake_reviews
from app.models.review_model import insert_review
from app.models.reply_model import insert_reply
from app.services.ai_engine import generate_reply
from app.services.usage_service import increment_usage

def run_simulation_poller():
    log_event("poller_started", environment="simulation")
    
    # 1. Fetch active users
    # For simulation, we fetch ALL users to ensure we can test dashboards easily.
    # In production with Manager Access, this would be: eq("google_connected", True)
    try:
        users_result = supabase.table("users").select("id, business_name, business_type, tone_preference").execute()
        users = users_result.data if users_result.data else []
    except Exception as e:
        log_event("poller_error", stage="fetch_users", error=str(e))
        return

    log_event("poller_user_count", total_active_users=len(users))

    # 2. Iterate and process mock reviews
    for user in users:
        user_id = user["id"]
        biz_name = user["business_name"] or "Unknown Business"
        biz_type = user["business_type"] or "Retail Store"
        tone = user["tone_preference"] or "professional"
        
        # 2a. Fetch from "Google"
        mock_reviews = generate_fake_reviews(biz_name, max_count=2)
        if not mock_reviews:
            continue
            
        for rev_payload in mock_reviews:
            google_id = rev_payload["name"]  # The unique google ID 
            
            # 2b. Deduplicate - Check if we already processed this review
            existing = supabase.table("reviews").select("id").eq("user_id", user_id).eq("google_review_id", google_id).execute()
            if existing.data:
                continue # Already pulled
                
            # 2c. Build the review record
            # IMPORTANT: Column names MUST match DB schema exactly.
            # DB uses "rating" (NOT "star_rating"), and has no "review_time" column.
            review_record = {
                "google_review_id": google_id,
                "reviewer_name": rev_payload["reviewer"]["displayName"],
                "rating": rev_payload["numericRating"],
                "review_text": rev_payload["comment"],
                "status": "pending"
            }
            
            # Insert into database
            inserted_review = insert_review(user_id, review_record)
            if not inserted_review:
                log_event("poller_error", stage="insert_review", user_id=user_id)
                continue
                
            review_db_id = inserted_review["id"]
            
            # 2d. Trigger the AI Pipeline
            start_time = time.time()
            try:
                ai_text = generate_reply(
                    business_name=biz_name,
                    business_type=biz_type,
                    tone_preference=tone,
                    star_rating=review_record["rating"],
                    review_text=review_record["review_text"]
                )
                
                gen_ms = int((time.time() - start_time) * 1000)
                
                # Insert Draft
                reply_record = {
                    "review_id": review_db_id,
                    "reply_text": ai_text,
                    "status": "draft",
                    "model_used": "simulation_poller_auto",
                    "generation_ms": gen_ms
                }
                # 4. Success! Save to DB
                insert_reply(user_id, reply_record)
                
                # 5. Increment usage quota
                increment_usage(user_id)
                
                # Update review to 'replied' locally to show processing finished
                supabase.table("reviews").update({"status": "replied"}).eq("id", review_db_id).execute()
                
                log_event("poller_success_draft_created", user_id=user_id, review_id=review_db_id)
                
            except Exception as e_ai:
                log_event("poller_error", stage="ai_generation", user_id=user_id, review_id=review_db_id, error=str(e_ai))
                # Mark as failed so user knows there's a backlog
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
