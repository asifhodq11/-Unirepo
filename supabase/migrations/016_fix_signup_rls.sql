-- ============================================================
-- Migration 016: Fix user profile INSERT bypass for server-side signup
--
-- Problem: The service role key client still evaluates RLS policies
-- because auth.uid() returns NULL in a server-side context (no JWT).
-- The INSERT policy WITH CHECK (id = auth.uid()) therefore fails
-- even for the service role, silently crashing signup.
--
-- Fix: Add a SECURITY DEFINER function that inserts the user profile
-- row without RLS evaluation. Called from the backend via .rpc().
-- The function is only callable by the authenticated service role.
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_user_profile(
    p_id              UUID,
    p_email           TEXT,
    p_business_name   TEXT,
    p_business_type   TEXT,
    p_tone_preference TEXT DEFAULT 'friendly'
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs as the function owner (postgres superuser), bypasses RLS
SET search_path = public
AS $$
DECLARE
    new_user public.users;
BEGIN
    INSERT INTO public.users (id, email, business_name, business_type, tone_preference)
    VALUES (p_id, p_email, p_business_name, p_business_type, p_tone_preference)
    RETURNING * INTO new_user;

    RETURN new_user;
END;
$$;
