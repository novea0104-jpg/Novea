-- ========================================
-- NUCLEAR OPTION: DISABLE RLS ON USERS TABLE
-- ========================================
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/aqhoqcyespikebuatbmp/sql
-- ========================================

-- Disable RLS on users table entirely
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on novels table too (just in case)
ALTER TABLE novels DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('users', 'novels');

-- If rowsecurity = false = RLS disabled ✅
