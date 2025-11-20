-- FIX: Row Level Security Policies for Novea (Version 2 - Idempotent)
-- Run this ENTIRE file in Supabase SQL Editor to enable user registration
-- This version is SAFE to run multiple times (idempotent)
-- 
-- PROBLEM: Original policies compare auth.uid() (UUID) with users.id (SERIAL/integer)
-- SOLUTION: Use email-based matching to link Supabase Auth with our users table

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Drop ALL existing policies first (to make this script idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Anyone can signup" ON users;
DROP POLICY IF EXISTS "Users can view all profiles" ON users;

-- Create new correct policies

-- 1. Allow ANYONE to INSERT during signup (public registration)
CREATE POLICY "Anyone can signup" ON users
  FOR INSERT WITH CHECK (true);

-- 2. Allow users to read ALL user profiles (needed for author names, etc)
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

-- 3. Allow users to update their own profile (using email matching)
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ============================================
-- READING PROGRESS, UNLOCKED CHAPTERS, ETC
-- ============================================

-- Drop existing broken policies (they use auth.uid()::text = user_id::text which doesn't work)
DROP POLICY IF EXISTS "Users can view own reading progress" ON reading_progress;
DROP POLICY IF EXISTS "Users can insert own reading progress" ON reading_progress;
DROP POLICY IF EXISTS "Users can update own reading progress" ON reading_progress;
DROP POLICY IF EXISTS "Users can manage own reading progress" ON reading_progress;

DROP POLICY IF EXISTS "Users can view own unlocked chapters" ON unlocked_chapters;
DROP POLICY IF EXISTS "Users can insert own unlocked chapters" ON unlocked_chapters;
DROP POLICY IF EXISTS "Users can manage own unlocked chapters" ON unlocked_chapters;

DROP POLICY IF EXISTS "Users can view own following novels" ON following_novels;
DROP POLICY IF EXISTS "Users can insert own following novels" ON following_novels;
DROP POLICY IF EXISTS "Users can delete own following novels" ON following_novels;
DROP POLICY IF EXISTS "Users can manage own following novels" ON following_novels;

DROP POLICY IF EXISTS "Users can view own coin transactions" ON coin_transactions;
DROP POLICY IF EXISTS "Users can insert own coin transactions" ON coin_transactions;
DROP POLICY IF EXISTS "Users can manage own coin transactions" ON coin_transactions;

-- Create new email-based policies

-- Reading Progress
CREATE POLICY "Users can manage own reading progress" ON reading_progress
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Unlocked Chapters
CREATE POLICY "Users can manage own unlocked chapters" ON unlocked_chapters
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Following Novels
CREATE POLICY "Users can manage own following novels" ON following_novels
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Coin Transactions
CREATE POLICY "Users can manage own coin transactions" ON coin_transactions
  FOR ALL USING (
    user_id = (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- ============================================
-- VERIFICATION
-- ============================================

-- Check that all policies were created successfully
-- You should see 3 policies for users table and 1 policy each for other tables

SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'reading_progress', 'unlocked_chapters', 'following_novels', 'coin_transactions')
ORDER BY tablename, policyname;

-- Expected output:
-- users: 3 policies (Anyone can signup, Users can view all profiles, Users can update own profile)
-- reading_progress: 1 policy (Users can manage own reading progress)
-- unlocked_chapters: 1 policy (Users can manage own unlocked chapters)
-- following_novels: 1 policy (Users can manage own following novels)  
-- coin_transactions: 1 policy (Users can manage own coin transactions)

-- ============================================
-- NOTES
-- ============================================

-- Why email-based matching?
-- - Our users.id is SERIAL (integer auto-increment)
-- - Supabase auth.uid() is UUID (text)
-- - They can't be compared directly
-- - We link them via email address which exists in both tables
