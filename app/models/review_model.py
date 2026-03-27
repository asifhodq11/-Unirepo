"""
app/models/review_model.py

Handles Supabase operations for the reviews table.
All queries MUST include .eq('user_id', current_user_id) per Security Rule 1.
"""

from app.extensions import supabase
from app.utils.logger import log_event


def insert_review(user_id: str, review_data: dict) -> dict | None:
    """
    Inserts a new review and returns the created record.
    If the insert returns no content (PGRST204), attempts a fallback fetch 
    using the unique google_review_id to recover the created record.
    """
    try:
        data_to_insert = {**review_data, "user_id": user_id}
        result = supabase.table("reviews").insert(data_to_insert).execute()
        
        if result.data:
            return result.data[0]
            
    except Exception as e:
        error_str = str(e)
        if "PGRST204" in error_str:
            # Fallback Fetch: The insert succeeded, but RLS prevented the return payload.
            # We must fetch the record manually using the unique google_review_id.
            try:
                fallback = (
                    supabase.table("reviews")
                    .select("*")
                    .eq("user_id", user_id)
                    .eq("google_review_id", review_data["google_review_id"])
                    .maybe_single()
                    .execute()
                )
                return fallback.data
            except Exception as e2:
                log_event("insert_review_fallback_failed", user_id=user_id, error=str(e2))
                return None
                
        log_event("insert_review_failed", user_id=user_id, level="error", error=error_str)
        return None


def get_review_by_id(user_id: str, review_id: str) -> dict | None:
    """Fetches a single review by ID, strictly scoped to the owner."""
    try:
        result = (
            supabase.table("reviews")
            .select("*")
            .eq("id", review_id)
            .eq("user_id", user_id)
            .eq("is_deleted", False)
            .execute()
        )
        return result.data[0] if result.data else None
    except Exception as e:
        log_event("get_review_failed", user_id=user_id, level="error", review_id=review_id, error=str(e))
        return None


def update_review_status(user_id: str, review_id: str, status: str) -> bool:
    """Updates the status of a review record."""
    try:
        supabase.table("reviews").update({"status": status}).eq("id", review_id).eq("user_id", user_id).execute()
        return True
    except Exception as e:
        log_event(
            "update_review_status_failed", user_id=user_id, level="error", review_id=review_id, status=status, error=str(e)
        )
        return False
