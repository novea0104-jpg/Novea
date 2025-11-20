-- Create secure function for role upgrade
-- Run this in Supabase SQL Editor

-- Drop function if exists (for idempotency)
DROP FUNCTION IF EXISTS upgrade_user_to_writer();

-- Create function to safely upgrade user from pembaca to penulis
-- SECURITY DEFINER means it runs with creator's privileges, bypassing RLS
CREATE OR REPLACE FUNCTION upgrade_user_to_writer()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_email TEXT;
  current_user_role VARCHAR(20);
  result_data json;
BEGIN
  -- Get current authenticated user's email
  current_user_email := (SELECT email FROM auth.users WHERE id = auth.uid());
  
  IF current_user_email IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get current user's role
  SELECT role INTO current_user_role 
  FROM users 
  WHERE email = current_user_email;
  
  -- Only allow upgrade if current role is 'pembaca'
  IF current_user_role != 'pembaca' THEN
    RAISE EXCEPTION 'User is already a writer or higher role';
  END IF;
  
  -- Update user to penulis role
  UPDATE users 
  SET 
    role = 'penulis',
    is_writer = true
  WHERE email = current_user_email
  RETURNING json_build_object(
    'id', id,
    'name', name,
    'email', email,
    'role', role,
    'is_writer', is_writer,
    'coin_balance', coin_balance
  ) INTO result_data;
  
  RETURN result_data;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upgrade_user_to_writer() TO authenticated;

-- Test query (optional - to verify function works)
-- SELECT upgrade_user_to_writer();
