-- Comments Schema for Novea
-- Run this SQL in Supabase SQL Editor

-- ==================== CHAPTER COMMENTS TABLE ====================
CREATE TABLE IF NOT EXISTS chapter_comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id INTEGER REFERENCES chapter_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_chapter_comments_chapter_id ON chapter_comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_comments_user_id ON chapter_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_comments_parent ON chapter_comments(parent_comment_id);

-- Enable RLS
ALTER TABLE chapter_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chapter_comments
DROP POLICY IF EXISTS "Anyone can view chapter comments" ON chapter_comments;
CREATE POLICY "Anyone can view chapter comments" ON chapter_comments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert comments" ON chapter_comments;
CREATE POLICY "Authenticated users can insert comments" ON chapter_comments
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
    );

DROP POLICY IF EXISTS "Users can update their own comments" ON chapter_comments;
CREATE POLICY "Users can update their own comments" ON chapter_comments
    FOR UPDATE USING (
        user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
    );

DROP POLICY IF EXISTS "Users can delete their own comments" ON chapter_comments;
CREATE POLICY "Users can delete their own comments" ON chapter_comments
    FOR DELETE USING (
        user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
    );


-- ==================== REVIEW REPLIES TABLE ====================
CREATE TABLE IF NOT EXISTS review_replies (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES novel_reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_user_id ON review_replies(user_id);

-- Enable RLS
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_replies
DROP POLICY IF EXISTS "Anyone can view review replies" ON review_replies;
CREATE POLICY "Anyone can view review replies" ON review_replies
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert replies" ON review_replies;
CREATE POLICY "Authenticated users can insert replies" ON review_replies
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
    );

DROP POLICY IF EXISTS "Users can update their own replies" ON review_replies;
CREATE POLICY "Users can update their own replies" ON review_replies
    FOR UPDATE USING (
        user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
    );

DROP POLICY IF EXISTS "Users can delete their own replies" ON review_replies;
CREATE POLICY "Users can delete their own replies" ON review_replies
    FOR DELETE USING (
        user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
    );


-- ==================== HELPER FUNCTIONS ====================

-- Function to increment replies count (if using denormalized count)
CREATE OR REPLACE FUNCTION increment_comment_replies(comment_id INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This function is a placeholder for incrementing reply count
    -- Currently we count replies dynamically, so this just returns
    NULL;
END;
$$;
