-- ========================================
-- FINAL SOLUTION: Fix Permission Denied
-- ========================================
-- Run this EXACTLY in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/aqhoqcyespikebuatbmp/sql
--
-- IMPORTANT: Make sure you're logged into https://supabase.com
-- and in project "aqhoqcyespikebuatbmp"
-- ========================================

-- Step 1: Grant schema access to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 2: Grant SELECT and REFERENCES on users table
-- (Required for FK validation when inserting novels)
GRANT SELECT, REFERENCES ON TABLE public.users TO authenticated;

-- Step 3: Grant INSERT and UPDATE on novels table
GRANT INSERT, UPDATE, SELECT ON TABLE public.novels TO authenticated;

-- Step 4: Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, REFERENCES ON TABLES TO authenticated;

-- ========================================
-- VERIFICATION QUERY (run after above)
-- ========================================
-- This should show grants for authenticated role
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'novels')
    AND grantee = 'authenticated'
ORDER BY table_name, privilege_type;
