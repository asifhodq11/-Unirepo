import os
import time

# Set dummy env vars BEFORE any app imports
os.environ['SECRET_KEY'] = 'test-secret'
os.environ['SUPABASE_URL'] = 'https://test.supabase.co'
FAKE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.fake'
os.environ['SUPABASE_ANON_KEY'] = FAKE_JWT
os.environ['SUPABASE_SERVICE_ROLE_KEY'] = FAKE_JWT
os.environ['GOOGLE_CLIENT_ID'] = 'test-client-id'
os.environ['GOOGLE_CLIENT_SECRET'] = 'test-client-secret'
os.environ['GOOGLE_MASTER_REFRESH_TOKEN'] = 'test-refresh-token'

import pytest
from unittest.mock import patch, MagicMock, call
import app.services.google_api_service as svc
from app.utils.exceptions import InvalidGrantError


# ─── Fixture: reset in-memory cache between tests ──────────────
@pytest.fixture(autouse=True)
def reset_token_cache():
    """
    The token cache is a module-level global. This fixture resets it
    between tests so each test starts from a clean state.
    """
    svc._cached_token = None
    svc._token_expires_at = 0.0
    yield
    svc._cached_token = None
    svc._token_expires_at = 0.0


# ══════════════════════════════════════════════════════════════
# SECTION 1: Token Cache Tests
# ══════════════════════════════════════════════════════════════

@patch('app.services.google_api_service.requests.post')
def test_token_is_cached_after_first_refresh(mock_post):
    """
    SCENARIO: Verifies that calling get_master_access_token() twice
    only results in ONE network call to Google's OAuth endpoint.

    BUG BEING TESTED: The Race Condition / Thrashing Bug.
    Without caching, every caller spams the OAuth endpoint.
    """
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"access_token": "fresh_token_abc"}
    mock_post.return_value = mock_resp

    # Call TWICE
    token1 = svc.get_master_access_token()
    token2 = svc.get_master_access_token()

    # Both calls return the same token
    assert token1 == "fresh_token_abc"
    assert token2 == "fresh_token_abc"

    # Google's OAuth endpoint was only hit ONCE
    assert mock_post.call_count == 1, (
        "BUG: Cache miss on second call — Google endpoint was hit twice. "
        "This is the Token Thrashing bug."
    )


@patch('app.services.google_api_service.requests.post')
def test_expired_token_is_refreshed(mock_post):
    """
    SCENARIO: If the cached token has expired (past TTL), the next call
    MUST hit the OAuth endpoint again to get a fresh one.
    """
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"access_token": "new_token_xyz"}
    mock_post.return_value = mock_resp

    # Force an expired state
    svc._cached_token = "old_stale_token"
    svc._token_expires_at = time.monotonic() - 10  # expired 10s ago

    token = svc.get_master_access_token()

    assert token == "new_token_xyz"
    assert mock_post.call_count == 1, "Should have refreshed the expired token."


@patch('app.services.google_api_service.requests.post')
def test_invalid_grant_raises_exception(mock_post):
    """
    SCENARIO: When Google responds with invalid_grant, the service
    MUST raise an InvalidGrantError to signal total system degradation.
    
    BUG BEING TESTED: Previously, this was only raised sometimes.
    """
    mock_resp = MagicMock()
    mock_resp.status_code = 400
    mock_resp.json.return_value = {"error": "invalid_grant"}
    mock_resp.text = '{"error": "invalid_grant"}'
    mock_post.return_value = mock_resp

    with pytest.raises(InvalidGrantError):
        svc.get_master_access_token()


@patch('app.services.google_api_service.requests.post')
def test_network_error_on_refresh_returns_none(mock_post):
    """
    SCENARIO: If the network is down when refreshing the token,
    get_master_access_token must return None gracefully (not crash).
    """
    import requests as req_lib
    mock_post.side_effect = req_lib.exceptions.ConnectionError("Network is down")

    token = svc.get_master_access_token()

    assert token is None, "Should return None on network failure, not raise."


# ══════════════════════════════════════════════════════════════
# SECTION 2: Retry Logic Tests
# ══════════════════════════════════════════════════════════════

@patch('app.services.google_api_service.requests.get')
def test_fetch_reviews_retries_on_503(mock_get):
    """
    SCENARIO: Google's API temporarily returns a 503 Service Unavailable.
    The fetch function MUST retry up to 3 times before giving up.

    BUG BEING TESTED: Current code has NO retry logic — one 503 drops all reviews.
    """
    fail_resp = MagicMock()
    fail_resp.status_code = 503
    fail_resp.text = "Service Unavailable"

    success_resp = MagicMock()
    success_resp.status_code = 200
    success_resp.json.return_value = {"reviews": [{"name": "rev1"}]}

    # Fail twice, succeed on 3rd attempt
    mock_get.side_effect = [fail_resp, fail_resp, success_resp]

    results = svc.fetch_recent_reviews("loc_123", "valid_token", max_pages=1)

    assert len(results) == 1, (
        "BUG: fetch_recent_reviews did not retry on 503 — reviews were lost."
    )
    assert mock_get.call_count == 3, "Should have retried 3 times total."


@patch('app.services.google_api_service.requests.put')
def test_reply_to_review_retries_on_503(mock_put):
    """
    SCENARIO: When posting a reply, Google returns 503 on the first attempt.
    reply_to_review MUST retry instead of silently failing.

    BUG BEING TESTED: Current code has NO retry logic — one 503 loses the reply.
    """
    fail_resp = MagicMock()
    fail_resp.status_code = 503
    fail_resp.text = "Service Unavailable"

    success_resp = MagicMock()
    success_resp.status_code = 200
    success_resp.json.return_value = {"comment": "Reply posted"}

    mock_put.side_effect = [fail_resp, success_resp]

    success, data = svc.reply_to_review("loc_123", "rev_456", "Great!", "valid_token")

    assert success is True, "BUG: reply_to_review did not retry on 503."
    assert mock_put.call_count == 2


# ══════════════════════════════════════════════════════════════
# SECTION 3: 401 Cache Invalidation Tests
# ══════════════════════════════════════════════════════════════

@patch('app.services.google_api_service.requests.get')
def test_fetch_reviews_invalidates_cache_on_401(mock_get):
    """
    SCENARIO: A cached token has been revoked. Google responds 401 Unauthorized
    to the fetch call. The service MUST clear the cache.
    
    After clearing, the NEXT call to get_master_access_token() will force a full
    refresh. This verifies the cache-clear side effect.

    BUG BEING TESTED: Currently, a 401 just breaks the fetch loop but the stale
    token stays in cache — all subsequent calls (and retries) will also get 401.
    """
    # Pre-load cache with a token
    svc._cached_token = "stale_revoked_token"
    svc._token_expires_at = time.monotonic() + 3000  # looks valid TTL-wise

    unauth_resp = MagicMock()
    unauth_resp.status_code = 401
    unauth_resp.text = "Unauthorized"
    mock_get.return_value = unauth_resp

    # Pass the stale token explicitly; function should detect 401 and clear cache
    svc.fetch_recent_reviews("loc_123", "stale_revoked_token", max_pages=1)

    # CRITICAL: stale token must be evicted from cache after 401
    assert svc._cached_token is None, (
        "BUG: Cache was NOT cleared after receiving a 401 Unauthorized. "
        "All subsequent requests will also fail with the stale token."
    )


@patch('app.services.google_api_service.requests.put')
def test_reply_to_review_invalidates_cache_on_401(mock_put):
    """
    SCENARIO: A reply attempt gets 401 Unauthorized.
    The service MUST clear the token cache so the next operation
    triggers a fresh token fetch from Google.
    """
    svc._cached_token = "stale_revoked_token"
    svc._token_expires_at = time.monotonic() + 3000

    unauth_resp = MagicMock()
    unauth_resp.status_code = 401
    unauth_resp.text = "Unauthorized"
    mock_put.return_value = unauth_resp

    success, _ = svc.reply_to_review("loc_123", "rev_456", "Great!", "stale_revoked_token")

    assert success is False  # The reply itself fails
    assert svc._cached_token is None, (
        "BUG: reply_to_review did not clear the token cache after 401."
    )


# ══════════════════════════════════════════════════════════════
# SECTION 4: Regression Tests (Preserve Existing Behavior)
# ══════════════════════════════════════════════════════════════

@patch('app.services.google_api_service.requests.get')
def test_fetch_recent_reviews_pagination(mock_get):
    """Regression: multi-page pagination still works after hardening."""
    page1 = {"reviews": [{"name": "rev1"}], "nextPageToken": "token2"}
    page2 = {"reviews": [{"name": "rev2"}]}

    r1 = MagicMock(status_code=200)
    r1.json.return_value = page1
    r2 = MagicMock(status_code=200)
    r2.json.return_value = page2
    mock_get.side_effect = [r1, r2]

    results = svc.fetch_recent_reviews("loc_123", "valid_token", max_pages=5)
    assert len(results) == 2


@patch('app.services.google_api_service.requests.get')
def test_fetch_recent_reviews_max_pages_limit(mock_get):
    """Regression: max_pages cap still enforced after hardening."""
    mock_resp = MagicMock(status_code=200)
    mock_resp.json.return_value = {"reviews": [{"name": "rev"}], "nextPageToken": "inf"}
    mock_get.return_value = mock_resp

    results = svc.fetch_recent_reviews("loc_123", "valid_token", max_pages=2)
    assert len(results) == 2
    assert mock_get.call_count == 2
