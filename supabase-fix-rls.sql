-- ============================================
-- FIX RLS POLICIES - Run this in Supabase
-- ============================================
-- This will DROP and RECREATE policies to avoid "already exists" error

-- Step 1: Drop existing policies (safe to run multiple times)
-- ============================================
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view novels" ON novels;
DROP POLICY IF EXISTS "Anyone can view chapters" ON chapters;
DROP POLICY IF EXISTS "Users can manage own reading progress" ON reading_progress;
DROP POLICY IF EXISTS "Users can manage own unlocked chapters" ON unlocked_chapters;
DROP POLICY IF EXISTS "Users can manage own following" ON following_novels;
DROP POLICY IF EXISTS "Users can view own transactions" ON coin_transactions;

-- Step 2: Ensure columns exist
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Step 3: Create storage bucket (safe if already exists)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Enable RLS on all tables
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocked_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE following_novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for USERS table (CRITICAL!)
-- ============================================
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON users
FOR SELECT USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Step 6: Create policies for public content
-- ============================================
-- Anyone can view novels
CREATE POLICY "Anyone can view novels" ON novels
FOR SELECT USING (true);

-- Anyone can view chapters
CREATE POLICY "Anyone can view chapters" ON chapters
FOR SELECT USING (true);

-- Step 7: Create policies for user-specific data
-- ============================================
-- Reading progress
CREATE POLICY "Users can manage own reading progress" ON reading_progress
FOR ALL USING (
  user_id = (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Unlocked chapters
CREATE POLICY "Users can manage own unlocked chapters" ON unlocked_chapters
FOR ALL USING (
  user_id = (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Following novels
CREATE POLICY "Users can manage own following" ON following_novels
FOR ALL USING (
  user_id = (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Coin transactions
CREATE POLICY "Users can view own transactions" ON coin_transactions
FOR SELECT USING (
  user_id = (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Step 8: Storage policies for avatars
-- ============================================
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Public read access to avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- SUCCESS MESSAGE
SELECT '✅ RLS POLICIES FIXED - Reload your app now!' as status;
