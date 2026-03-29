-- ============================================================
-- Migration 011: admin_role
-- Adds an `is_admin` boolean to the `public.users` table.
-- Defaults to false. Can only be toggled manually by a Superuser (You).
-- ============================================================

ALTER TABLE public.users
ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- Create an index to quickly find admins if needed
CREATE INDEX idx_users_is_admin ON public.users (is_admin);
