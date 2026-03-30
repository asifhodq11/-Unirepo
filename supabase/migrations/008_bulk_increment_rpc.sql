-- 008_bulk_increment_rpc.sql
-- Atomic bulk reservation for user replies.
-- Prevents race conditions and credit over-runs during batch generation.

CREATE OR REPLACE FUNCTION public.check_and_reserve_bulk_credits(
  user_id_input UUID, 
  required_count INT, 
  max_limit INT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INT;
BEGIN
  -- 1. Fetch current count with a 'FOR UPDATE' lock to prevent any other 
  -- concurrent processes from modifying this user's usage during this check.
  SELECT reply_count_this_month INTO current_count 
  FROM public.users 
  WHERE id = user_id_input 
  FOR UPDATE;

  -- 2. Strictly verify if adding the bulk batch exceeds the plan limit
  IF (current_count + required_count) > max_limit THEN
    RETURN FALSE;
  END IF;

  -- 3. Atomically deduct/reserve the credits
  UPDATE public.users 
  SET reply_count_this_month = reply_count_this_month + required_count
  WHERE id = user_id_input;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
