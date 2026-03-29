-- ============================================================
-- Migration 010: ai_cost_tracking
-- Adds a precise fractional USD tracking column to the replies table.
-- ============================================================

ALTER TABLE public.replies
ADD COLUMN cost_usd NUMERIC(15, 6) DEFAULT 0.000000;

-- Optional: Create an index if we want fast cost aggregation later
CREATE INDEX idx_replies_cost ON public.replies (cost_usd);
