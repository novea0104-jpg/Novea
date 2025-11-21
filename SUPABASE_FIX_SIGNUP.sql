-- ============================================
-- NOVEA - FIX SIGNUP ISSUE
-- ============================================
-- RUN THIS IN SUPABASE SQL EDITOR (Dashboard > SQL Editor)
-- This will allow user registration by fixing RLS policies

-- ============================================
-- 1. DROP OLD BROKEN POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Anyone can signup" ON users;
DROP POLICY IF EXISTS "Users can view all profiles" ON users;

-- ============================================
-- 2. CREATE NEW WORKING POLICIES
-- ============================================

-- Policy 1: Allow ANYONE to INSERT during signup (public registration)
-- This is CRITICAL for signup to work!
CREATE POLICY "Anyone can signup" ON users
  FOR INSERT 
  WITH CHECK (true);

-- Policy 2: Allow users to read ALL user profiles
-- (needed for author names, role badges, etc)
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT 
  USING (true);

-- Policy 3: Allow users to update their OWN profile only
-- Uses email matching to link Supabase Auth with users table
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE 
  USING (email = auth.jwt() ->> 'email')
  WITH CHECK (email = auth.jwt() ->> 'email');

-- ============================================
-- 3. VERIFY POLICIES WERE CREATED
-- ============================================

SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Expected output: 3 policies
-- 1. Anyone can signup (INSERT)
-- 2. Users can view all profiles (SELECT)
-- 3. Users can update own profile (UPDATE)
