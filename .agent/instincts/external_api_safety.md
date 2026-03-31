---
description: Safety patterns for external API integrations (Google OAuth, any token-based API).
confidence: 0.95
tags: [google-api, oauth, threading, concurrency, timeout, bug-hunter, security]
scope: project
---

# External API & OAuth Token Safety Instincts

## 1. The Token Cache Pattern (OAuth Refresh Race Condition Prevention)
**Trigger:** Whenever writing a function that refreshes an OAuth token from an external provider.
**Anti-Pattern:** Calling the token endpoint every time a token is needed. Concurrent threads will spam the provider, causing rate-limiting and potential credential revocation.
**Fix Pattern (Instinct):** Always cache the token with a TTL that's shorter than the actual expiry. Use a `threading.Lock()` with double-checked locking:

```python
_token_cache_lock = threading.Lock()
_cached_token = None
_token_expires_at = 0.0

def get_token():
    global _cached_token, _token_expires_at
    if _cached_token and time.monotonic() < _token_expires_at:
        return _cached_token  # Fast path (no lock needed)
    with _token_cache_lock:
        if _cached_token and time.monotonic() < _token_expires_at:
            return _cached_token  # Second check after acquiring lock
        # Refresh here, set _token_expires_at = time.monotonic() + TTL
```

## 2. Always Set Timeouts on External HTTP Requests
**Trigger:** Any `requests.get()`, `requests.post()`, `requests.put()` call.
**Anti-Pattern:** `requests.post(url, data=payload)` — no timeout. A slow or hung external service will block the thread forever.
**Fix Pattern:** Always specify `timeout=(connect_sec, read_sec)` or a single `timeout=N`. Standard API calls: `timeout=10`. Write operations: `timeout=15`.

## 3. The Admin N+1 Pagination DoS
**Trigger:** Calculating aggregate statistics (SUM, COUNT, AVG) in an admin dashboard route.
**Anti-Pattern:** Paginating through all rows in Python code: `while True: fetch page; accumulate`. This is O(N) memory and time, crashes with large tables.
**Fix Pattern:** Always delegate aggregations to Postgres: `SELECT COALESCE(SUM(col), 0) FROM table`. Expose it as a Supabase RPC function and call it once with `.rpc("fn_name", {})`.
