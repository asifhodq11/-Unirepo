-- ============================================================
-- Migration 015: Core Performance Indexing
-- Adds composite indices for common query patterns.
-- Ensures sub-millisecond lookups even at 100k+ rows.
-- ============================================================

-- Index: reviews table — poller deduplication lookup
-- Used heavily in run_poller.py: .eq("user_id").eq("google_review_id")
CREATE INDEX IF NOT EXISTS idx_reviews_user_google
    ON public.reviews (user_id, google_review_id);

-- Index: reviews table — dashboard history query
-- Used by /reviews/history: .eq("user_id").eq("is_deleted").order("created_at")
CREATE INDEX IF NOT EXISTS idx_reviews_user_active_date
    ON public.reviews (user_id, is_deleted, created_at DESC)
    WHERE is_deleted = FALSE;

-- Index: replies table — fetching replies for a review
-- Used across all generation routes: .eq("review_id").eq("user_id")
CREATE INDEX IF NOT EXISTS idx_replies_review_user
    ON public.replies (review_id, user_id);

-- Index: replies table — daily autonomy circuit breaker
-- Used by get_today_reply_count: .eq("user_id").gte("created_at")
CREATE INDEX IF NOT EXISTS idx_replies_user_created
    ON public.replies (user_id, created_at DESC);

-- Index: replies table — duplicate post prevention
-- Used by reply_poster.py: .eq("review_id").in_("status", [...])
CREATE INDEX IF NOT EXISTS idx_replies_review_status
    ON public.replies (review_id, status);

-- Index: users table — poller active user fetch
-- Used by run_poller.py: .eq("google_connected")
CREATE INDEX IF NOT EXISTS idx_users_google_connected
    ON public.users (google_connected)
    WHERE google_connected = TRUE;
