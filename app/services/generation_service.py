"""
app/services/generation_service.py

High-level Service Layer for AI Generation.
Consolidates User context, DB persistence, and AI Orchestration.
Reduces code duplication across Reviews and Webhooks routes.
"""

import time
import traceback
from app.utils.logger import log_event
from app.models.review_model import update_review_status
from app.models.reply_model import insert_reply
from app.services.usage_service import increment_usage
from app.services.ai_engine import generate_reply

def process_single_generation(user: dict, review_id: str, rating: int, text: str, name: str = "", provider: str = "manual") -> dict:
    """
    Unified pipeline for generating a reply to a single review.
    Handles AI call, database persistence, and usage increments.
    Returns the saved_reply dict.
    """
    user_id = user["id"]
    
    # 1. Trigger AI Intelligence Pipeline (v2.3)
    start_time = time.time()
    ai_result = generate_reply(
        business_name=user.get("business_name", "your business"),
        business_type=user.get("business_type", "business"),
        tone_preference=user.get("tone_preference", "friendly"),
        star_rating=rating,
        review_text=text or "",
        reviewer_name=name or "",
        user_id=user_id,
        business_register=user.get("business_register", "restaurant"),
    )
    duration_ms = int((time.time() - start_time) * 1000)

    # 2. Persist the reply (Intelligence v2.3 compliant)
    reply_data = {
        "review_id":     review_id,
        "reply_text":    ai_result["text"],
        "status":        "draft",
        "model_used":    ai_result.get("model_used", "auto"),
        "quality_score": ai_result.get("quality_score", 18),
        "opener_type":   ai_result.get("opener_type", "experience"),
        "tokens_used":   ai_result.get("tokens", 0),
        "cost_usd":      ai_result.get("cost_usd", 0.0),
    }

    saved_reply = insert_reply(user_id, reply_data)
    if not saved_reply:
        raise Exception("Database insertion failed for generated reply.")

    # 3. Mark review as processed (replied)
    update_review_status(user_id, review_id, "replied")

    # 4. Atomic Usage Increment
    try:
        increment_usage(user_id)
    except Exception as e:
        error_msg = str(e)
        stack = traceback.format_exc()
        log_event("generation_pipeline_exception", user_id=user_id, error=error_msg, stack=stack)
        raise Exception(f"AI Pipeline failed: {error_msg}")

    log_event(
        "generation_pipeline_success",
        user_id=user_id,
        review_id=review_id,
        ms=duration_ms,
        provider=provider,
        quality=ai_result.get("quality_score")
    )

    return saved_reply
