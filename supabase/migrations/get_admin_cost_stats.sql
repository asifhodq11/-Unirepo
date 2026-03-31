-- ============================================================
-- REQUIRED: Run this SQL in your Supabase SQL Editor
-- Project: ReplyIQ
-- Wave 2 Admin Fix: get_admin_cost_stats RPC
-- ============================================================
-- This replaces the catastrophic N+1 pagination loop in admin.py
-- that read EVERY row of the replies table into Python memory.
-- This function runs as a single O(1) Postgres aggregate query.
-- ============================================================

CREATE OR REPLACE FUNCTION get_admin_cost_stats()
RETURNS TABLE (
    total_cost_usd   NUMERIC,
    total_tokens_used BIGINT,
    total_replies    BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT
        COALESCE(SUM(cost_usd), 0)::NUMERIC   AS total_cost_usd,
        COALESCE(SUM(tokens_used), 0)::BIGINT  AS total_tokens_used,
        COUNT(*)::BIGINT                        AS total_replies
    FROM replies;
$$;

-- Grant execution to the anon/service_role (used by the Supabase Python client)
GRANT EXECUTE ON FUNCTION get_admin_cost_stats() TO anon;
GRANT EXECUTE ON FUNCTION get_admin_cost_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_cost_stats() TO service_role;
