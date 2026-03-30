"""
app/services/reply_poster.py

Handles posting approved or auto-approved review replies
out to the external platform (e.g. Google Business Profile).
"""

from app.extensions import supabase
from app.utils.exceptions import GooglePostError
from app.services.google_api_service import get_master_access_token, reply_to_review


def post_reply_to_google(reply_id: str, user_id: str) -> bool:
    """
    Posts a review reply to Google Business Profile.
    Includes a strict duplicate check to prevent double-posting
    the same reply if tokens are somehow double-clicked or racily approved.

    Returns:
        True: if successfully posted
        False: if a reply was already posted for this review
    Raises:
        GooglePostError: if the external API call fails
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
        # A reply has already been posted to Google for this review
        return False

    # 3. Post to Google API
    access_token = get_master_access_token()
    if not access_token:
        raise GooglePostError(review_id=review_id, google_error="Could not get master access token.")

    # fetch google_review_id from review
    rev_res = supabase.from_("reviews").select("google_review_id").eq("id", review_id).execute()
    if not rev_res.data:
        raise GooglePostError(review_id=review_id, google_error="Review not found in db.")
        
    google_review_id = rev_res.data[0]["google_review_id"]
    
    # fetch location_id from user
    usr_res = supabase.from_("users").select("google_location_id").eq("id", user_id).execute()
    if not usr_res.data or not usr_res.data[0].get("google_location_id"):
        raise GooglePostError(review_id=review_id, google_error="User is not fully connected to Google.")
        
    location_id = usr_res.data[0]["google_location_id"]
    
    success, api_res = reply_to_review(location_id, google_review_id, reply_text, access_token)
    
    if not success:
         raise GooglePostError(review_id=review_id, google_error=str(api_res))

    # 4. Mark the reply as successfully posted
    supabase.from_("replies").update({"status": "posted"}).eq("id", reply_id).eq("user_id", user_id).execute()

    return True
