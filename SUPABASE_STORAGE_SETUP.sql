-- ============================================
-- NOVEA - SUPABASE STORAGE BUCKET SETUP
-- ============================================
-- RUN THIS IN SUPABASE DASHBOARD > STORAGE
-- This creates the storage bucket for novel cover images

-- ============================================
-- 1. CREATE NOVEL COVERS BUCKET
-- ============================================
-- Go to Supabase Dashboard > Storage > "Create Bucket"
-- Bucket name: novel-covers
-- Public bucket: YES (so covers can be displayed)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- ============================================
-- 2. SETUP STORAGE POLICIES (Run in SQL Editor)
-- ============================================

-- Policy 1: Anyone can view novel covers (public read)
CREATE POLICY "Anyone can view novel covers" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'novel-covers');

-- Policy 2: Authenticated users can upload their own covers
CREATE POLICY "Writers can upload novel covers" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'novel-covers' 
    AND auth.role() = 'authenticated'
  );

-- Policy 3: Users can update their own covers
CREATE POLICY "Writers can update own covers" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'novel-covers' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy 4: Users can delete their own covers
CREATE POLICY "Writers can delete own covers" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'novel-covers' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- 3. VERIFY POLICIES
-- ============================================
SELECT 
  policyname, 
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
  AND policyname LIKE '%novel covers%'
ORDER BY policyname;

-- Expected output: 4 policies
-- 1. Anyone can view novel covers (SELECT)
-- 2. Writers can upload novel covers (INSERT)
-- 3. Writers can update own covers (UPDATE)
-- 4. Writers can delete own covers (DELETE)

-- ============================================
-- ALTERNATIVE: MANUAL BUCKET CREATION VIA SQL
-- ============================================
-- If you prefer SQL instead of UI:

INSERT INTO storage.buckets (id, name, public)
VALUES ('novel-covers', 'novel-covers', true);

-- ============================================
-- NOTES:
-- ============================================
-- 1. Storage folder structure: {userId}/{filename}.jpg
--    Example: 550e8400-e29b-41d4-a716-446655440000/cover-1732168920123.jpg
--
-- 2. Public URL format:
--    https://{project-id}.supabase.co/storage/v1/object/public/novel-covers/{userId}/{filename}.jpg
--
-- 3. The uploadNovelCoverAsync function in utils/novelCoverStorage.ts
--    handles compression (800x1200, 85% quality) before upload
--
-- 4. Supported formats: JPEG, PNG, WebP (auto-converted to JPEG)
