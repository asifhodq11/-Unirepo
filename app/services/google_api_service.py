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


def fetch_recent_reviews(location_id, access_token, max_pages=20):
    """
    Fetches the latest reviews for a specific Google Location.
    Includes pagination handling (Wave 2 Hardening).
    - Default max_pages=20 captures ~1,000 reviews.
    """
    if not access_token:
        log_event("google_api_error", message="Missing access token for fetch.")
        return []

    all_reviews = []
    page_token = None
    pages_fetched = 0

    while pages_fetched < max_pages:
        url = f"https://mybusinessreviews.googleapis.com/v1/{location_id}/reviews"
        params = {
            "pageSize": 50,
            "orderBy": "updateTime desc"
        }
        if page_token:
            params["pageToken"] = page_token

        headers = { "Authorization": f"Bearer {access_token}" }
        
        try:
            resp = requests.get(url, headers=headers, params=params, timeout=10)
            if resp.status_code != 200:
                log_event("google_api_error", status_code=resp.status_code, error=resp.text)
                break
            
            data = resp.json()
            reviews = data.get("reviews", [])
            all_reviews.extend(reviews)
            
            page_token = data.get("nextPageToken")
            if not page_token:
                break
                
            pages_fetched += 1
        except Exception as e:
            log_event("google_api_error", stage="fetch_pagination", error=str(e))
            break

    return all_reviews

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
