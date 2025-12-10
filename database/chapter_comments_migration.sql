-- =====================================================
-- NOVEA - Chapter Comments Migration (with Reply Support)
-- Run this SQL in Supabase Dashboard SQL Editor
-- =====================================================

-- Create chapter_comments table with reply support
CREATE TABLE IF NOT EXISTS chapter_comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  parent_comment_id INTEGER REFERENCES chapter_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chapter_comments_chapter_id ON chapter_comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_comments_user_id ON chapter_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_comments_novel_id ON chapter_comments(novel_id);
CREATE INDEX IF NOT EXISTS idx_chapter_comments_parent_id ON chapter_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_chapter_comments_created_at ON chapter_comments(created_at DESC);

-- Enable RLS
ALTER TABLE chapter_comments ENABLE ROW LEVEL SECURITY;

-- Policies for chapter_comments
CREATE POLICY "Anyone can view chapter comments"
ON chapter_comments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert comments"
ON chapter_comments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own comments"
ON chapter_comments FOR UPDATE
USING (user_id = (SELECT id FROM users WHERE email = auth.email()));

CREATE POLICY "Users can delete their own comments"
ON chapter_comments FOR DELETE
USING (user_id = (SELECT id FROM users WHERE email = auth.email()));

-- Function to increment replies count
CREATE OR REPLACE FUNCTION increment_comment_replies(comment_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE chapter_comments
  SET replies_count = replies_count + 1
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement replies count
CREATE OR REPLACE FUNCTION decrement_comment_replies(comment_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE chapter_comments
  SET replies_count = GREATEST(0, replies_count - 1)
  WHERE id = comment_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- If table already exists, run these ALTER statements:
-- =====================================================
-- ALTER TABLE chapter_comments ADD COLUMN IF NOT EXISTS parent_comment_id INTEGER REFERENCES chapter_comments(id) ON DELETE CASCADE;
-- ALTER TABLE chapter_comments ADD COLUMN IF NOT EXISTS replies_count INTEGER DEFAULT 0;
-- CREATE INDEX IF NOT EXISTS idx_chapter_comments_parent_id ON chapter_comments(parent_comment_id);

-- =====================================================
-- Run this in Supabase Dashboard SQL Editor
-- =====================================================
