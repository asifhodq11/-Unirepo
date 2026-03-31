"""
app/services/google_api_service.py

Handles all communication with the Google My Business Reviews API.

Architecture: Agency Mode — all access uses a single GOOGLE_MASTER_REFRESH_TOKEN
issued by the agency account. Individual users do NOT have their own Google OAuth
tokens; they connect their location via the Admin panel.

Bug Hunter Wave 2 Hardening:
  - Thread-safe double-checked lock token cache (TTL=3500s) — eliminates OAuth
    refresh thrashing when background pollers run concurrently.
  - Exponential backoff retry decorator — survived transient 5xx errors without
    losing reviews or replies.
  - 401 cache invalidation — if a cached token is revoked by Google before its
    TTL, the next 401 error now atomically clears the cache so the system
    self-heals on the next cycle without manual intervention.
  - Explicit timeout on all HTTP calls — prevents thread starvation on hung
    Google connections.
"""

import threading
import time
import requests
from flask import current_app
import os
from app.utils.logger import log_event

# ── Thread-Safe Token Cache ───────────────────────────────────
# Google access tokens are valid for 3600 seconds (1 hour).
# We refresh 100s early (TTL=3500s) to avoid using a token
# that's about to expire mid-request.
# _token_cache_lock ensures only ONE thread ever calls the OAuth
# endpoint at a time — all others wait and read the shared result.

_token_cache_lock = threading.Lock()
_cached_token: str | None = None
_token_expires_at: float = 0.0


def invalidate_token_cache() -> None:
    """
    Evicts the current access token from the in-memory cache.
    Called when a downstream API call returns 401 Unauthorized,
    signalling that the cached token has been revoked by Google
    before its TTL expired.

    Thread-safe: acquires the lock before mutating shared state.
    """
    global _cached_token, _token_expires_at
    with _token_cache_lock:
        _cached_token = None
        _token_expires_at = 0.0
    log_event("google_token_cache_invalidated", reason="401_received")


def _retry(max_attempts: int = 3, base_delay: float = 1.0):
    """
    A lightweight exponential-backoff retry decorator.
    Retries only on HTTP 5xx (server-side transient errors) or
    requests.exceptions.RequestException (network failures).

    Approach: 1s → 2s → 4s between attempts.
    Does NOT retry on 4xx errors (client errors are not retried).

    Args:
        max_attempts: Total number of attempts (1 original + N-1 retries).
        base_delay:   Initial sleep between retries in seconds.
    """
    def decorator(fn):
        from functools import wraps

        @wraps(fn)
        def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(max_attempts):
                try:
                    return fn(*args, **kwargs)
                except _RetryableError as e:
                    last_exc = e
                    wait = base_delay * (2 ** attempt)
                    log_event(
                        "google_api_retry",
                        function=fn.__name__,
                        attempt=attempt + 1,
                        max_attempts=max_attempts,
                        wait_seconds=wait,
                        reason=str(e),
                    )
                    if attempt < max_attempts - 1:
                        time.sleep(wait)
            # Re-raise the last exception after all retries are exhausted
            raise last_exc  # type: ignore[misc]
        return wrapper
    return decorator


class _RetryableError(Exception):
    """Internal sentinel raised by API functions when a retryable condition is met."""
    pass


def get_master_access_token() -> str | None:
    """
    Returns a valid Google OAuth2 access token for the Master Agency Account.

    Thread-safe via double-checked locking:
      - Fast path: if cache is valid, return immediately (no lock).
      - Slow path: if cache is expired/empty, acquire lock, check again
        (another thread may have refreshed while we waited), then refresh.
    """
    global _cached_token, _token_expires_at

    # Fast path — no lock needed for reads when cache is warm
    if _cached_token and time.monotonic() < _token_expires_at:
        return _cached_token

    with _token_cache_lock:
        # Second check — another thread may have refreshed while we waited
        if _cached_token and time.monotonic() < _token_expires_at:
            return _cached_token

        client_id, client_secret, refresh_token = _load_google_credentials()

        if not all([client_id, client_secret, refresh_token]):
            log_event("google_api_error", message="Missing OAuth credentials.")
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
                _cached_token = new_token
                _token_expires_at = time.monotonic() + 3500
                log_event("google_token_refreshed")
            return _cached_token

        # Handle known failure modes
        error_resp: dict = {}
        try:
            error_resp = resp.json()
        except Exception:
            pass

        log_event(
            "google_api_error",
            stage="refresh_token",
            status=resp.status_code,
            error=resp.text,
        )

        if error_resp.get("error") == "invalid_grant":
            from app.utils.exceptions import InvalidGrantError
            raise InvalidGrantError(
                "Google refresh token revoked or inactive. status=degraded"
            )

        return None


def _load_google_credentials() -> tuple[str | None, str | None, str | None]:
    """Loads Google OAuth credentials from Flask config or environment fallback."""
    client_id = client_secret = refresh_token = None
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

    return client_id, client_secret, refresh_token


@_retry(max_attempts=3, base_delay=1.0)
def _fetch_reviews_page(
    url: str,
    params: dict,
    access_token: str,
) -> dict:
    """
    Fetches a single page of reviews. Raises _RetryableError on transient 5xx.
    Calls invalidate_token_cache() and returns {} on 401.
    """
    headers = {"Authorization": f"Bearer {access_token}"}
    resp = requests.get(url, headers=headers, params=params, timeout=10)

    if resp.status_code == 200:
        return resp.json()

    if resp.status_code == 401:
        log_event("google_api_error", stage="fetch_reviews", status_code=401)
        invalidate_token_cache()
        return {}  # Caller will stop pagination

    if resp.status_code >= 500:
        raise _RetryableError(f"fetch_reviews {resp.status_code}: {resp.text[:200]}")

    # 4xx non-401 — not retryable, log and return empty
    log_event(
        "google_api_error",
        stage="fetch_reviews",
        status_code=resp.status_code,
        error=resp.text,
    )
    return {}


def fetch_recent_reviews(
    location_id: str,
    access_token: str,
    max_pages: int = 20,
) -> list:
    """
    Fetches the latest reviews for a specific Google Location.

    Hardening (Wave 2):
      - Each page fetch uses exponential-backoff retry on 5xx errors.
      - 401 evicts the token cache and stops pagination (self-healing).
      - Hard cap at max_pages (default 20 ≈ 1,000 reviews).
    """
    if not access_token:
        log_event("google_api_error", message="Missing access token for fetch.")
        return []

    all_reviews: list = []
    page_token: str | None = None
    pages_fetched = 0

    while pages_fetched < max_pages:
        url = f"https://mybusinessreviews.googleapis.com/v1/{location_id}/reviews"
        params: dict = {"pageSize": 50, "orderBy": "updateTime desc"}
        if page_token:
            params["pageToken"] = page_token

        try:
            data = _fetch_reviews_page(url, params, access_token)
        except _RetryableError as e:
            # All retries exhausted — log and abort pagination
            log_event("google_api_error", stage="fetch_reviews_exhausted", error=str(e))
            break
        except Exception as e:
            log_event("google_api_error", stage="fetch_pagination", error=str(e))
            break

        if not data:
            # Empty dict returned on 401 (cache invalidated) or unretryable 4xx
            break

        all_reviews.extend(data.get("reviews", []))

        page_token = data.get("nextPageToken")
        if not page_token:
            break

        pages_fetched += 1

    return all_reviews


@_retry(max_attempts=3, base_delay=1.0)
def _do_reply_put(url: str, headers: dict, payload: dict) -> requests.Response:
    """
    Executes the PUT request for posting a reply.
    Raises _RetryableError on transient 5xx.
    """
    resp = requests.put(url, headers=headers, json=payload, timeout=15)
    if resp.status_code >= 500:
        raise _RetryableError(f"reply_to_review {resp.status_code}: {resp.text[:200]}")
    return resp


def reply_to_review(
    location_id: str,
    review_id: str,
    reply_text: str,
    access_token: str,
) -> tuple[bool, object]:
    """
    Posts a reply to a specific Google review.
    Endpoint: PUT https://mybusinessreviews.googleapis.com/v1/{name}/reply

    Hardening (Wave 2):
      - Exponential-backoff retry on 5xx transient errors.
      - 401 invalidates the token cache for self-healing recovery.
      - Explicit timeout=15 prevents thread starvation on hung connections.
    """
    if not access_token:
        return False, "No access token provided"

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
        resp = _do_reply_put(url, headers, payload)
    except _RetryableError as e:
        log_event("google_api_reply_exhausted", review_id=review_id, error=str(e))
        return False, str(e)
    except requests.exceptions.RequestException as e:
        log_event("google_api_reply_exception", review_id=review_id, error=str(e))
        return False, str(e)

    if resp.status_code == 200:
        return True, resp.json()

    if resp.status_code == 401:
        log_event("google_api_reply_failed", review_id=review_id, status=401)
        invalidate_token_cache()
        return False, "Unauthorized — token cache invalidated for self-healing."

    log_event(
        "google_api_reply_failed",
        review_id=review_id,
        status=resp.status_code,
        error=resp.text,
    )
    return False, resp.text
