"""
app/models/reply_model.py

Handles Supabase operations for the replies table.
All queries MUST include .eq('user_id', current_user_id) per Security Rule 1.
"""

from app.extensions import supabase
from app.utils.logger import log_event


def insert_reply(user_id: str, reply_data: dict) -> dict | None:
    """
    Inserts a new AI reply draft.
    If the insert returns no content, attempts a fallback fetch 
    of the most recent reply for this review.
    """
    try:
        data_to_insert = {**reply_data, "user_id": user_id}
        result = supabase.table("replies").insert(data_to_insert).execute()
        
        # Check for error object in result (Supabase client behavior)
        error = getattr(result, "error", None)
        if error:
            # Re-raise to trigger the exception-based resilience logic below
            raise Exception(str(error.get("message") if isinstance(error, dict) else error))

        if result.data:
            return result.data[0]
            
    except Exception as e:
        error_str = str(e).lower()
        log_event("insert_reply_exception", user_id=user_id, error=error_str)
        
        # RESILIENCE: If DB column is missing (desync), try fallback to minimalist payload
        if "column" in error_str and "does not exist" in error_str:
            log_event("insert_reply_schema_desync_trigger", user_id=user_id)
            minimalist_data = {
                "user_id":    user_id,
                "review_id":  reply_data.get("review_id"),
                "reply_text": reply_data.get("reply_text"),
                "status":     reply_data.get("status", "draft"),
                "model_used": reply_data.get("model_used", "fallback-resilient")
            }
            try:
                # Second attempt: Minimalist payload
                retry_result = supabase.table("replies").insert(minimalist_data).execute()
                if retry_result.data:
                    return retry_result.data[0]
            except Exception as e_retry:
                log_event("insert_reply_retry_failed", user_id=user_id, error=str(e_retry))

        # Check for non-schema specific failed inserts
        if "pgrst204" not in error_str:
            log_event("insert_reply_unhandled_failure", user_id=user_id, level="error", error=str(e))

    # FALLBACK FETCH: Used when insert succeeds but no payload is returned (RLS/PostgREST 204)
    try:
        fallback = (
            supabase.table("replies")
            .select("*")
            .eq("user_id", user_id)
            .eq("review_id", reply_data["review_id"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return fallback.data[0] if fallback.data else None
    except Exception as e2:
        log_event("insert_reply_fallback_failed", user_id=user_id, error=str(e2))
        return None


def get_replies_by_review(user_id: str, review_id: str) -> list[dict]:
    """Fetches all replies for a specific review, strictly scoped to the owner."""
    try:
        result = supabase.table("replies").select("*").eq("review_id", review_id).eq("user_id", user_id).execute()
        return result.data if result.data else []
    except Exception as e:
        log_event("get_replies_failed", user_id=user_id, level="error", review_id=review_id, error=str(e))
        return []

def update_reply(user_id: str, reply_id: str, updates: dict) -> dict | None:
    """Updates a specific reply ensuring user_id constraint."""
    try:
        result = (
            supabase.table("replies")
            .update(updates)
            .eq("id", reply_id)
            .eq("user_id", user_id)
            .execute()
        )
        return result.data[0] if result.data else None
    except Exception as e:
        log_event("update_reply_failed", reply_id=reply_id, user_id=user_id, level="error", error=str(e))
        return None
