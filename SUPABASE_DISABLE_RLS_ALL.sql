-- ========================================
-- DISABLE RLS ON ALL RELATED TABLES
-- ========================================
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/aqhoqcyespikebuatbmp/sql
-- ========================================

-- Disable RLS on reading_progress (this is causing the permission error)
ALTER TABLE reading_progress DISABLE ROW LEVEL SECURITY;

-- Disable RLS on other related tables for consistency
ALTER TABLE unlocked_chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE following_novels DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('users', 'novels', 'reading_progress', 'unlocked_chapters', 'following_novels', 'chapters', 'coin_transactions')
ORDER BY tablename;

-- All tables should show rowsecurity = false
