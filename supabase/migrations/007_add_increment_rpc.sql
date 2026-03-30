-- 007_add_increment_rpc.sql
-- Atomic increment for user replies. SECURITY DEFINER bypasses RLS safely 
-- because the parameter matches the ID being updated.

CREATE OR REPLACE FUNCTION public.increment_reply_count(user_id_input UUID, max_limit INT)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INT;
BEGIN
  -- 1. Fetch current count with a lock for the specific user row to prevent race conditions
  SELECT reply_count_this_month INTO current_count 
  FROM public.users 
  WHERE id = user_id_input 
  FOR UPDATE;

  -- 2. Check if we've already hit or exceeded the limit
  IF current_count >= max_limit THEN
    RETURN FALSE;
  END IF;

  -- 3. Perform the atomic increment
  UPDATE public.users 
  SET reply_count_this_month = reply_count_this_month + 1
  WHERE id = user_id_input;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
