-- ============================================
-- COMPLETE SUPABASE SETUP FOR NOVEA APP
-- ============================================
-- Run this ONCE in Supabase SQL Editor
-- This combines all necessary setup steps
-- ============================================

-- STEP 1: Add avatar_url and bio columns to users table
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- STEP 2: Create Storage Bucket for Avatars
-- ============================================
-- Create avatars bucket (public read access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- STEP 3: Storage RLS Policies for Avatars
-- ============================================
-- Allow public to read avatars (anyone can view profile pictures)
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatars
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatars
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own avatars
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- STEP 4: Enable RLS on All Tables
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocked_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE following_novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- STEP 5: RLS Policies for Users Table (CRITICAL!)
-- ============================================
-- Allow users to read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON users;
CREATE POLICY "Users can read own profile" ON users
FOR SELECT USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- STEP 6: RLS Policies for Novels & Chapters
-- ============================================
-- Anyone can view novels and chapters (public browsing)
DROP POLICY IF EXISTS "Anyone can view novels" ON novels;
CREATE POLICY "Anyone can view novels" ON novels
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view chapters" ON chapters;
CREATE POLICY "Anyone can view chapters" ON chapters
FOR SELECT USING (true);

-- Writers can manage their own novels
DROP POLICY IF EXISTS "Writers can manage own novels" ON novels;
CREATE POLICY "Writers can manage own novels" ON novels
FOR ALL USING (
  author_id = (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Writers can manage chapters for their own novels
DROP POLICY IF EXISTS "Writers can manage own chapters" ON chapters;
CREATE POLICY "Writers can manage own chapters" ON chapters
FOR ALL USING (
  novel_id IN (
    SELECT id FROM novels WHERE author_id = (
      SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
);

-- STEP 7: RLS Policies for User-Specific Data
-- ============================================
-- Reading progress
DROP POLICY IF EXISTS "Users can manage own reading progress" ON reading_progress;
CREATE POLICY "Users can manage own reading progress" ON reading_progress
FOR ALL USING (
  user_id = (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Unlocked chapters
DROP POLICY IF EXISTS "Users can manage own unlocked chapters" ON unlocked_chapters;
CREATE POLICY "Users can manage own unlocked chapters" ON unlocked_chapters
FOR ALL USING (
  user_id = (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Following novels
DROP POLICY IF EXISTS "Users can manage own following" ON following_novels;
CREATE POLICY "Users can manage own following" ON following_novels
FOR ALL USING (
  user_id = (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Coin transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON coin_transactions;
CREATE POLICY "Users can view own transactions" ON coin_transactions
FOR SELECT USING (
  user_id = (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- STEP 8: Create Role Upgrade Function (Pembaca → Penulis)
-- ============================================
CREATE OR REPLACE FUNCTION upgrade_user_to_writer(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET role = 'penulis', is_writer = true 
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 9: Verification Queries
-- ============================================
-- Check RLS is enabled
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'novels', 'chapters', 'reading_progress', 'unlocked_chapters', 'following_novels', 'coin_transactions')
ORDER BY tablename;

-- Check storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'avatars';

-- Check users table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('avatar_url', 'bio', 'role')
ORDER BY column_name;

-- ============================================
-- SETUP COMPLETE! ✅
-- ============================================
-- Your app should now work with:
-- ✅ Avatar uploads to Supabase Storage
-- ✅ Bio editing
-- ✅ Profile updates without permission errors
-- ✅ Role-based navigation
-- ============================================
