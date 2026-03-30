import requests
from flask import current_app
import os
from app.utils.logger import log_event

def get_master_access_token():
    """
    Exchanges the MASTER_REFRESH_TOKEN for a fresh access_token.
    This allows the backend to act as the Agency Account.
    """
    # If called outside app context (like in a standalone script), we fallback to os.environ
    try:
        if current_app:
            client_id = current_app.config.get("GOOGLE_CLIENT_ID")
            client_secret = current_app.config.get("GOOGLE_CLIENT_SECRET")
            refresh_token = current_app.config.get("GOOGLE_MASTER_REFRESH_TOKEN")
        else:
            raise RuntimeError()
    except RuntimeError:
        client_id = os.environ.get("GOOGLE_CLIENT_ID")
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
        refresh_token = os.environ.get("GOOGLE_MASTER_REFRESH_TOKEN")

    if not all([client_id, client_secret, refresh_token]):
        log_event("google_api_error", message="Missing OAuth credentials (ID, Secret, or Refresh Token).")
        return None

    url = "https://oauth2.googleapis.com/token"
    payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token"
    }

    resp = requests.post(url, data=payload)
    if resp.status_code == 200:
        return resp.json().get("access_token")
    else:
        error_resp = {}
        try:
            error_resp = resp.json()
        except Exception:
            pass
            
        log_event("google_api_error", stage="refresh_token", error=resp.text)
        
        if error_resp.get("error") == "invalid_grant":
            from app.utils.exceptions import InvalidGrantError
            raise InvalidGrantError("Google refresh token revoked or inactive. status=degraded")
            
        return None


def fetch_recent_reviews(location_id, access_token):
    """
    Fetches the latest reviews for a specific Google Location.
    `location_id` must be in the format 'accounts/{account_id}/locations/{location_id}'
    """
    if not access_token:
        print("[Google API Error] No access token provided.")
        return []
        
    # Standard format fallback warning
    if not location_id.startswith("accounts/"):
        print(f"[Google API Warning] Location ID '{location_id}' is not in the correct 'accounts/*/locations/*' format.")

    # Manage reviews endpoint
    url = f"https://mybusinessreviews.googleapis.com/v1/{location_id}/reviews"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    resp = requests.get(url, headers=headers)
    if resp.status_code == 200:
        data = resp.json()
        # Returns a list of review objects as defined by Google
        return data.get("reviews", [])
    else:
        print(f"[Google API Error] Error fetching reviews for {location_id}: {resp.text}")
        return []

def reply_to_review(location_id, review_id, reply_text, access_token):
    """
    Posts a reply to a specific review.
    Endpoint: PUT https://mybusinessreviews.googleapis.com/v1/{name}/reply
    """
    if not access_token:
        return False, "No access token provided"

    # review_id might already contain the full path "accounts/xx/locations/yy/reviews/zz"
    if review_id.startswith("accounts/"):
        url = f"https://mybusinessreviews.googleapis.com/v1/{review_id}/reply"
    else:
        url = f"https://mybusinessreviews.googleapis.com/v1/{location_id}/reviews/{review_id}/reply"
        
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "comment": reply_text
    }

    resp = requests.put(url, headers=headers, json=payload)
    if resp.status_code == 200:
        return True, resp.json()
    else:
        print(f"[Google API Error] Failed to post reply to {review_id}: {resp.text}")
        return False, resp.text
