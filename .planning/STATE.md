# GSD Workspace State: Bug Hunter & Code Review Audit

**Objective:** Executive-level Bug Hunt and Security Review on `app/routes/admin.py` and `app/services/google_api_service.py` to identify security flaws, concurrency deadlocks, and structural bottlenecks.
**Active Tech Stack:** Python Flask, Supabase (Postgres), Stripe, React (Frontend).

## Target 1: `app/routes/admin.py` (Structural Risk: 18.0 HIGH)

### 1. The N+1 Resource Exhaustion Trap (DoS Vulnerability)
**Location:** `dashboard_stats()`, lines 45-60.
**The Bug:** To calculate the `total_cost` of AI usage, the code paginates through **every single row** in the `replies` table synchronously using a `while True` loop with Supabase `range()`. 
*   *Pre-Mortem Failure:* As the SaaS scales to 1,000,000+ replies, calculating this stat on the fly will choke the API, time out the request, and consume massive memory.
*   *Fix Pattern:* Move the SUM aggregation directly into Postgres using a Supabase RPC (Remote Procedure Call) like `select sum(cost_usd) from replies`, or build a materialized view / trigger-based incrementer in the `usage_service`.

### 2. Missing Input Sanitization
**Location:** `update_google_config(user_id)`
**The Bug:** The payload `data["google_location_id"]` is cast directly to a string and pushed to the database without schema validation (e.g., length checking). This violates the `@[/security-review]` protocol (No Zod/Marshmallow schemas used).

## Target 2: `app/services/google_api_service.py` (Structural Risk: 13.9 MODERATE)

### 1. Token Refresh Race Condition
**Location:** `get_master_access_token()`
**The Bug:** The service makes a live POST request to `oauth2.googleapis.com` every single time a token is needed.
*   *Pre-Mortem Failure:* If multiple background threads (pollers) or user requests attempt to fetch reviews simultaneously, they will trigger massive duplicate OAuth refresh requests. Google strictly rate-limits refresh traffic and may revoke the `MASTER_REFRESH_TOKEN` entirely due to suspicious concurrent thrashing.
*   *Fix Pattern:* Implement an in-memory or Database-backed Token Cache with a TTL (Time-to-Live) of 3500 seconds (Google tokens last 1 hour). A single thread should refresh the token, and all other threads should read from the cache.

### 2. Single-Agent OAuth Architecture Assumption
**Location:** `get_master_access_token()`
**The Bug:** The entire app relies on a global `GOOGLE_MASTER_REFRESH_TOKEN` injected via ENV variables, treating the SaaS as a single Google Agency Account. This requires verification: if end-users are meant to connect *their own* Google accounts via OAuth, this service is fundamentally misarchitected. If it's pure agency-mode, the caching fix applies.

## Phase 2 Directive (For Claude 3.7 Sonnet)
You must read this document, generate the `PLAN.xml` for fixing the N+1 database DoS in `admin.py` and the OAuth caching logic in `google_api_service.py`, and rigorously enforce the `@[/systematic-debugging]` and `@[/security-review]` workflows.
