"""
jobs/downgrade_expired.py

Safety-net background worker that identifies users whose subscription_end 
timestamp has passed (with a 24h grace buffer) and handles the downgrade 
to the 'free' plan. 

This script is an ultimate fallback in case Stripe webhooks for 
'customer.subscription.deleted' ever fail to arrive or be processed.
"""

import os
from datetime import datetime, timezone, timedelta
from app import create_app
from app.extensions import supabase
from app.utils.logger import log_event

def run_downgrade_cycle():
    """
    Finds PRO/STARTER/ULTRA users whose subscription_end < (now - 24 hours).
    Updates them back to the FREE plan and resets metadata.
    """
    now = datetime.now(timezone.utc)
    
    # We allow a 24-hour grace period buffer for late-firing Stripe webhooks
    cutoff = (now - timedelta(hours=24)).isoformat()
    
    log_event("downgrade_cycle_started", cutoff=cutoff)
    
    try:
        # Query for non-free users whose subscription has ended past the cutoff.
        # .lt() is 'less than'
        result = supabase.table("users").select("id, email, plan, subscription_end").neq("plan", "free").lt("subscription_end", cutoff).execute()
        
        expired_users = result.data if result.data else []
    except Exception as e:
        log_event("downgrade_query_failed", error=str(e))
        return

    log_event("downgrade_cycle_count", total_expired_found=len(expired_users))

    for user in expired_users:
        user_id = user["id"]
        email = user.get("email")
        old_plan = user.get("plan")
        
        try:
            # Downgrade to free.
            # We clear stripe_subscription_id to force a fresh checkout session if they resubscribe.
            supabase.table("users").update({
                "plan": "free",
                "subscription_end": None,
                "stripe_subscription_id": None
            }).eq("id", user_id).execute()
            
            log_event(
                "downgrade_success", 
                user_id=user_id, 
                email=email, 
                previous_plan=old_plan
            )
        except Exception as update_err:
            log_event(
                "downgrade_failed", 
                user_id=user_id, 
                error=str(update_err)
            )

    log_event("downgrade_cycle_completed")

if __name__ == "__main__":
    # Load Flask App for logger/supabase context config
    env = os.environ.get("FLASK_ENV", "development")
    app = create_app(env)
    
    with app.app_context():
        run_downgrade_cycle()
