-- Migration: 007_processed_webhooks.sql
-- Creates a persistent store for Stripe webhook event IDs to ensure idempotency
-- across server restarts and re-deploys.

CREATE TABLE IF NOT EXISTS processed_webhooks (
    stripe_event_id TEXT PRIMARY KEY,
    processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cleanup queries (auto-purge events older than 90 days)
CREATE INDEX IF NOT EXISTS idx_processed_webhooks_at ON processed_webhooks (processed_at);

-- Row-Level Security: only the service role (backend) can read/write this table
ALTER TABLE processed_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only" ON processed_webhooks
    USING (auth.role() = 'service_role');
