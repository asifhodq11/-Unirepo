-- ============================================================
-- Migration 013: Billing Grace Period & Sync
-- ============================================================

-- Add subscription_end and stripe_subscription_id to users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create an index to quickly lookup subscriptions
CREATE INDEX IF NOT EXISTS idx_users_stripe_sub 
    ON public.users (stripe_subscription_id);

-- Update the realtime listener if needed to broadcast these changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
