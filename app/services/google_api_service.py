"""
app/services/google_api_service.py

Handles all communication with the Google My Business Reviews API.

BUG HUNTER FIX (Wave 2):
  - Added thread-safe in-memory token cache (TTL = 3500s) to prevent OAuth
    refresh thrashing. Multiple concurrent background poller threads previously
    triggered duplicate refresh requests every time, risking Google revoking
    the MASTER_REFRESH_TOKEN due to rate limiting.
  - Added `timeout` parameter to the `reply_to_review()` requests.put() call.
    Without it, a hung Google API connection would block a poller thread forever.
"""

import threading
import time
import requests
from flask import current_app
import os
from app.utils.logger import log_event

# ── Thread-Safe Token Cache ───────────────────────────────────
# Google access tokens are valid for 3600 seconds (1 hour).
# We refresh 100s early (TTL = 3500s) to avoid using a token that's
# about to expire mid-request. The lock ensures only ONE thread
# performs the refresh at a time — all others wait and then read
# the cached token. This eliminates the race condition.

_token_cache_lock  = threading.Lock()
_cached_token      = None          # str | None
_token_expires_at  = 0.0           # Unix timestamp


def get_master_access_token() -> str | None:
    """
    Returns a valid Google OAuth2 access token for the Master Agency Account.

    Thread-safe: uses a double-checked lock pattern so only one thread
    ever calls the Google OAuth endpoint at a time. All concurrent callers
    share the cached result.
    """
    global _cached_token, _token_expires_at

    # Fast path: cached token is still valid (no lock needed for the read)
    if _cached_token and time.monotonic() < _token_expires_at:
        return _cached_token

    with _token_cache_lock:
        # Second check inside the lock — another thread may have refreshed
        # while we were waiting to acquire the lock.
        if _cached_token and time.monotonic() < _token_expires_at:
            return _cached_token

        # Slow path: refresh the token from Google
        client_id     = None
        client_secret = None
        refresh_token = None

        try:
            if current_app:
                client_id     = current_app.config.get("GOOGLE_CLIENT_ID")
                client_secret = current_app.config.get("GOOGLE_CLIENT_SECRET")
                refresh_token = current_app.config.get("GOOGLE_MASTER_REFRESH_TOKEN")
        except RuntimeError:
            pass

        if not all([client_id, client_secret, refresh_token]):
            client_id     = os.environ.get("GOOGLE_CLIENT_ID")
            client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
            refresh_token = os.environ.get("GOOGLE_MASTER_REFRESH_TOKEN")

        if not all([client_id, client_secret, refresh_token]):
            log_event("google_api_error", message="Missing OAuth credentials (ID, Secret, or Refresh Token).")
            return None

        url = "https://oauth2.googleapis.com/token"
        payload = {
            "client_id":     client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
            "grant_type":    "refresh_token",
        }

        try:
            resp = requests.post(url, data=payload, timeout=10)
        except requests.exceptions.RequestException as e:
            log_event("google_api_error", stage="refresh_token_request", error=str(e))
            return None

        if resp.status_code == 200:
            new_token = resp.json().get("access_token")
            if new_token:
                _cached_token     = new_token
                # Set expiry to 3500s from now (Google tokens last 3600s)
                _token_expires_at = time.monotonic() + 3500
                log_event("google_token_refreshed")
            return _cached_token
        else:
            error_resp = {}
            try:
                error_resp = resp.json()
            except Exception:
                pass

            log_event("google_api_error", stage="refresh_token", status=resp.status_code, error=resp.text)

            if error_resp.get("error") == "invalid_grant":
                from app.utils.exceptions import InvalidGrantError
                raise InvalidGrantError("Google refresh token revoked or inactive. status=degraded")

            return None


def fetch_recent_reviews(location_id: str, access_token: str, max_pages: int = 20) -> list:
    """
    Fetches the latest reviews for a specific Google Location.
    Includes pagination handling with a hard cap of `max_pages` (default 20 = ~1000 reviews).
    """
    if not access_token:
        log_event("google_api_error", message="Missing access token for fetch.")
        return []

    all_reviews = []
    page_token  = None
    pages_fetched = 0

    while pages_fetched < max_pages:
        url = f"https://mybusinessreviews.googleapis.com/v1/{location_id}/reviews"
        params = {"pageSize": 50, "orderBy": "updateTime desc"}
        if page_token:
            params["pageToken"] = page_token

        headers = {"Authorization": f"Bearer {access_token}"}

        try:
            resp = requests.get(url, headers=headers, params=params, timeout=10)
            if resp.status_code != 200:
                log_event("google_api_error", stage="fetch_reviews", status_code=resp.status_code, error=resp.text)
                break

            data    = resp.json()
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


def reply_to_review(location_id: str, review_id: str, reply_text: str, access_token: str) -> tuple[bool, object]:
    """
    Posts a reply to a specific Google review.
    Endpoint: PUT https://mybusinessreviews.googleapis.com/v1/{name}/reply

    BUG HUNTER FIX (Wave 2):
      - Added timeout=15 to prevent thread starvation on a hung Google connection.
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
        "Content-Type":  "application/json",
    }
    payload = {"comment": reply_text}

    try:
        resp = requests.put(url, headers=headers, json=payload, timeout=15)
        if resp.status_code == 200:
            return True, resp.json()
        else:
            log_event("google_api_reply_failed", review_id=review_id, status=resp.status_code, error=resp.text)
            return False, resp.text
    except requests.exceptions.RequestException as e:
        log_event("google_api_reply_exception", review_id=review_id, error=str(e))
        return False, str(e)
