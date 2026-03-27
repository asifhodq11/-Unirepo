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
        
        if result.data:
            return result.data[0]
            
        # Scenario: Insert succeeded but RLS returned empty list (no exception)
        # Proceed to fallback fetch below.
            
    except Exception as e:
        error_str = str(e)
        if "PGRST204" not in error_str:
            log_event("insert_reply_failed", user_id=user_id, level="error", error=error_str)
            return None
        # If PGRST204, proceed to fallback fetch below.

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
