-- FIX: Row Level Security Policies for Novea
-- Run this ENTIRE file in Supabase SQL Editor to enable user registration
-- 
-- PROBLEM: Original policies compare auth.uid() (UUID) with users.id (SERIAL/integer)
-- SOLUTION: Use email-based matching to link Supabase Auth with our users table

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Drop existing broken policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

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

DROP POLICY IF EXISTS "Users can view own unlocked chapters" ON unlocked_chapters;
DROP POLICY IF EXISTS "Users can insert own unlocked chapters" ON unlocked_chapters;

DROP POLICY IF EXISTS "Users can view own following novels" ON following_novels;
DROP POLICY IF EXISTS "Users can insert own following novels" ON following_novels;
DROP POLICY IF EXISTS "Users can delete own following novels" ON following_novels;

DROP POLICY IF EXISTS "Users can view own coin transactions" ON coin_transactions;
DROP POLICY IF EXISTS "Users can insert own coin transactions" ON coin_transactions;

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
-- NOTES
-- ============================================

-- Why email-based matching?
-- - Our users.id is SERIAL (integer auto-increment)
-- - Supabase auth.uid() is UUID (text)
-- - They can't be compared directly
-- - We link them via email address which exists in both tables
