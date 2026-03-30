-- ============================================================
-- Migration 014: Poller Distributed Mutex Lock
-- Ensures only one poller instance runs at a time on Railway,
-- even if the scheduler fires multiple concurrent instances.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.poller_lock (
    lock_name   TEXT        PRIMARY KEY,
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    acquired_by TEXT        -- hostname/instance identifier
);

-- Seed the single mutex row so UPDATE is always valid
INSERT INTO public.poller_lock (lock_name, acquired_by)
VALUES ('global_poller', NULL)
ON CONFLICT (lock_name) DO NOTHING;

-- ── Atomic CAS RPC ─────────────────────────────────────────
-- Returns TRUE if this instance successfully acquired the lock.
-- Returns FALSE if another instance already holds a fresh lock.
CREATE OR REPLACE FUNCTION public.acquire_poller_lock(
    instance_id     TEXT,
    timeout_minutes INT DEFAULT 30
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rows_updated INT;
BEGIN
    UPDATE public.poller_lock
    SET    acquired_by = instance_id,
           acquired_at = now()
    WHERE  lock_name   = 'global_poller'
      AND  (
               acquired_by IS NULL
            OR acquired_at < now() - (timeout_minutes || ' minutes')::interval
           );

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RETURN rows_updated > 0;
END;
$$;
