"""
app/services/reply_poster.py

Handles posting approved or auto-approved review replies
out to the external platform (e.g. Google Business Profile).

Hardened with 3-attempt exponential backoff on transient Google API errors.
"""

import time
from app.extensions import supabase
from app.utils.exceptions import GooglePostError
from app.services.google_api_service import get_master_access_token, reply_to_review
from app.utils.logger import log_event

_TRANSIENT_ERRORS = {"500", "502", "503", "504", "429"}


def _post_with_retry(location_id: str, google_review_id: str, reply_text: str, access_token: str, review_id: str):
    """
    Calls reply_to_review with exponential backoff on transient HTTP errors.
    Attempts: 1s -> 2s -> 4s before raising GooglePostError.
    """
    delays = [1, 2, 4]
    for attempt, delay in enumerate(delays, start=1):
        success, api_res = reply_to_review(location_id, google_review_id, reply_text, access_token)
        if success:
            return

        # Check if it's a transient server error worth retrying
        error_str = str(api_res)
        is_transient = any(code in error_str for code in _TRANSIENT_ERRORS)

        if is_transient and attempt < len(delays):
            log_event(
                "reply_poster_retry",
                attempt=attempt,
                delay_s=delay,
                review_id=review_id,
                error=error_str,
            )
            time.sleep(delay)
            continue

        # Non-transient error or final attempt — raise immediately
        raise GooglePostError(review_id=review_id, google_error=error_str)


def post_reply_to_google(reply_id: str, user_id: str) -> bool:
    """
    Posts a review reply to Google Business Profile.
    Includes a strict duplicate check to prevent double-posting
    the same reply if tokens are somehow double-clicked or racily approved.

    Returns:
        True: if successfully posted
        False: if a reply was already posted for this review
    Raises:
        GooglePostError: if the external API call fails after retries
    """
    # 1. Get the review_id and reply_text to check for duplicates
    reply_res = supabase.from_("replies").select("review_id, reply_text").eq("id", reply_id).eq("user_id", user_id).execute()

    if not reply_res.data:
        raise GooglePostError(review_id=None, google_error="Reply not found or unauthorized access.")

    review_id = reply_res.data[0]["review_id"]
    reply_text = reply_res.data[0]["reply_text"]

    # 2. Prevent duplicate posting on the same review
    existing_res = (
        supabase.from_("replies")
        .select("id")
        .eq("review_id", review_id)
        .in_("status", ["posted", "auto-posted"])
        .execute()
    )

    if existing_res.data:
        return False

    # 3. Gather required identifiers
    access_token = get_master_access_token()
    if not access_token:
        raise GooglePostError(review_id=review_id, google_error="Could not get master access token.")

    rev_res = supabase.from_("reviews").select("google_review_id").eq("id", review_id).execute()
    if not rev_res.data:
        raise GooglePostError(review_id=review_id, google_error="Review not found in db.")

    google_review_id = rev_res.data[0]["google_review_id"]

    usr_res = supabase.from_("users").select("google_location_id").eq("id", user_id).execute()
    if not usr_res.data or not usr_res.data[0].get("google_location_id"):
        raise GooglePostError(review_id=review_id, google_error="User is not fully connected to Google.")

    location_id = usr_res.data[0]["google_location_id"]

    # 4. Post with retry
    _post_with_retry(location_id, google_review_id, reply_text, access_token, review_id)

    # 5. Mark the reply as successfully posted
    supabase.from_("replies").update({"status": "posted"}).eq("id", reply_id).eq("user_id", user_id).execute()

    return True
