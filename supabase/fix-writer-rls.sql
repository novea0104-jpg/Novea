-- =====================================================
-- FIX RLS UNTUK WRITERS (NOVEL & CHAPTER)
-- =====================================================
-- Jalankan ini di Supabase Dashboard > SQL Editor
-- =====================================================

-- ===== NOVELS TABLE =====

-- Enable RLS
ALTER TABLE novels ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view novels" ON novels;
DROP POLICY IF EXISTS "Anyone can read novels" ON novels;
DROP POLICY IF EXISTS "Writers can insert novels" ON novels;
DROP POLICY IF EXISTS "Writers can insert their novels" ON novels;
DROP POLICY IF EXISTS "Authenticated users can insert novels" ON novels;
DROP POLICY IF EXISTS "Writers can update their novels" ON novels;
DROP POLICY IF EXISTS "Authors can update their novels" ON novels;
DROP POLICY IF EXISTS "Writers can delete their novels" ON novels;

-- SELECT: Anyone can view novels
CREATE POLICY "Anyone can view novels" ON novels
    FOR SELECT USING (true);

-- INSERT: Authenticated writers can create novels
CREATE POLICY "Writers can insert novels" ON novels
    FOR INSERT WITH CHECK (
        author_id IN (
            SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
        )
    );

-- UPDATE: Authors can update their own novels
CREATE POLICY "Writers can update their novels" ON novels
    FOR UPDATE USING (
        author_id IN (
            SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
        )
    );

-- DELETE: Authors can delete their own novels
CREATE POLICY "Writers can delete their novels" ON novels
    FOR DELETE USING (
        author_id IN (
            SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
        )
    );

-- ===== CHAPTERS TABLE =====

-- Enable RLS
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view chapters" ON chapters;
DROP POLICY IF EXISTS "Anyone can read chapters" ON chapters;
DROP POLICY IF EXISTS "Writers can insert chapters" ON chapters;
DROP POLICY IF EXISTS "Writers can insert their chapters" ON chapters;
DROP POLICY IF EXISTS "Authenticated users can insert chapters" ON chapters;
DROP POLICY IF EXISTS "Writers can update chapters" ON chapters;
DROP POLICY IF EXISTS "Writers can update their chapters" ON chapters;
DROP POLICY IF EXISTS "Writers can delete chapters" ON chapters;

-- SELECT: Anyone can view chapters
CREATE POLICY "Anyone can view chapters" ON chapters
    FOR SELECT USING (true);

-- INSERT: Writers can add chapters to their own novels
CREATE POLICY "Writers can insert chapters" ON chapters
    FOR INSERT WITH CHECK (
        novel_id IN (
            SELECT id FROM novels WHERE author_id IN (
                SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
            )
        )
    );

-- UPDATE: Writers can update chapters of their own novels
CREATE POLICY "Writers can update chapters" ON chapters
    FOR UPDATE USING (
        novel_id IN (
            SELECT id FROM novels WHERE author_id IN (
                SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
            )
        )
    );

-- DELETE: Writers can delete chapters of their own novels
CREATE POLICY "Writers can delete chapters" ON chapters
    FOR DELETE USING (
        novel_id IN (
            SELECT id FROM novels WHERE author_id IN (
                SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
            )
        )
    );

-- ===== NOVEL_GENRES TABLE (untuk multi-genre) =====

-- Create table if not exists
CREATE TABLE IF NOT EXISTS novel_genres (
    id SERIAL PRIMARY KEY,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(novel_id, genre_id)
);

-- Enable RLS
ALTER TABLE novel_genres ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view novel_genres" ON novel_genres;
DROP POLICY IF EXISTS "Writers can insert novel_genres" ON novel_genres;
DROP POLICY IF EXISTS "Writers can delete novel_genres" ON novel_genres;

-- SELECT: Anyone can view
CREATE POLICY "Anyone can view novel_genres" ON novel_genres
    FOR SELECT USING (true);

-- INSERT: Writers can add genres to their novels
CREATE POLICY "Writers can insert novel_genres" ON novel_genres
    FOR INSERT WITH CHECK (
        novel_id IN (
            SELECT id FROM novels WHERE author_id IN (
                SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
            )
        )
    );

-- DELETE: Writers can remove genres from their novels
CREATE POLICY "Writers can delete novel_genres" ON novel_genres
    FOR DELETE USING (
        novel_id IN (
            SELECT id FROM novels WHERE author_id IN (
                SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
            )
        )
    );

-- ===== GENRES TABLE =====

-- Create table if not exists
CREATE TABLE IF NOT EXISTS genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;

-- Anyone can view genres
DROP POLICY IF EXISTS "Anyone can view genres" ON genres;
CREATE POLICY "Anyone can view genres" ON genres
    FOR SELECT USING (true);

-- Insert default genres if empty
INSERT INTO genres (name, slug) VALUES
    ('Romance', 'romance'),
    ('Fantasy', 'fantasy'),
    ('Thriller', 'thriller'),
    ('Mystery', 'mystery'),
    ('Sci-Fi', 'sci-fi'),
    ('Adventure', 'adventure'),
    ('Drama', 'drama'),
    ('Horror', 'horror'),
    ('Comedy', 'comedy'),
    ('Action', 'action')
ON CONFLICT (slug) DO NOTHING;

-- ===== STORAGE BUCKET =====

-- Make sure storage bucket exists for novel covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('novel-covers', 'novel-covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for novel covers
DROP POLICY IF EXISTS "Anyone can view novel covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload novel covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own covers" ON storage.objects;

CREATE POLICY "Anyone can view novel covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'novel-covers');

CREATE POLICY "Authenticated users can upload novel covers"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'novel-covers' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own covers"
ON storage.objects FOR UPDATE
USING (bucket_id = 'novel-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own covers"
ON storage.objects FOR DELETE
USING (bucket_id = 'novel-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Verify
SELECT 'RLS Policies Created Successfully!' as status;
SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('novels', 'chapters', 'novel_genres', 'genres');
