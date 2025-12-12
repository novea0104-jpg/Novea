-- Fix and Complete Schema for Novea
-- This script handles existing tables and adds missing columns
-- Run this SQL in Supabase SQL Editor

-- ==================== STEP 1: FIX EXISTING TABLES ====================

-- Add parent_comment_id column to chapter_comments if table exists but column doesn't
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chapter_comments') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chapter_comments' AND column_name = 'parent_comment_id') THEN
            ALTER TABLE chapter_comments ADD COLUMN parent_comment_id INTEGER REFERENCES chapter_comments(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- ==================== STEP 2: CREATE TABLES IF NOT EXIST ====================

-- Create chapter_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS chapter_comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id INTEGER REFERENCES chapter_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create review_replies table
CREATE TABLE IF NOT EXISTS review_replies (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES novel_reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    novel_id INTEGER REFERENCES novels(id) ON DELETE CASCADE,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    timeline_post_id INTEGER REFERENCES timeline_posts(id) ON DELETE CASCADE,
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    review_id INTEGER,
    comment_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== STEP 3: CREATE INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_chapter_comments_chapter_id ON chapter_comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_comments_user_id ON chapter_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_comments_parent ON chapter_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_review_id ON review_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_review_replies_user_id ON review_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);


-- ==================== STEP 4: ENABLE RLS ====================

ALTER TABLE chapter_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;


-- ==================== STEP 5: CREATE RLS POLICIES ====================

-- Chapter Comments Policies
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

-- Review Replies Policies
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

-- Notifications Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (
        user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
    );

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (
        user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
    );

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
    );


-- ==================== STEP 6: CREATE HELPER FUNCTIONS ====================

CREATE OR REPLACE FUNCTION increment_comment_replies(p_comment_id INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NULL;
END;
$$;


-- ==================== STEP 7: CREATE NOTIFICATION TRIGGERS ====================

CREATE OR REPLACE FUNCTION notify_followers_on_new_content()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, actor_id, novel_id, timeline_post_id)
    SELECT 
        uf.follower_id,
        CASE 
            WHEN TG_TABLE_NAME = 'novels' THEN 'new_novel'
            WHEN TG_TABLE_NAME = 'timeline_posts' THEN 'new_timeline_post'
            ELSE 'new_content'
        END,
        CASE 
            WHEN TG_TABLE_NAME = 'novels' THEN 'Novel Baru dari ' || (SELECT name FROM users WHERE id = NEW.author_id)
            WHEN TG_TABLE_NAME = 'timeline_posts' THEN 'Post Baru dari ' || (SELECT name FROM users WHERE id = NEW.user_id)
            ELSE 'Update Baru'
        END,
        CASE 
            WHEN TG_TABLE_NAME = 'novels' THEN (SELECT name FROM users WHERE id = NEW.author_id) || ' memposting novel baru: ' || NEW.title
            WHEN TG_TABLE_NAME = 'timeline_posts' THEN (SELECT name FROM users WHERE id = NEW.user_id) || ' membuat post baru di Linimasa'
            ELSE 'Ada konten baru dari pengguna yang kamu ikuti'
        END,
        CASE 
            WHEN TG_TABLE_NAME = 'novels' THEN NEW.author_id
            WHEN TG_TABLE_NAME = 'timeline_posts' THEN NEW.user_id
            ELSE NULL
        END,
        CASE WHEN TG_TABLE_NAME = 'novels' THEN NEW.id ELSE NULL END,
        CASE WHEN TG_TABLE_NAME = 'timeline_posts' THEN NEW.id ELSE NULL END
    FROM user_follows uf
    WHERE uf.following_id = CASE 
        WHEN TG_TABLE_NAME = 'novels' THEN NEW.author_id
        WHEN TG_TABLE_NAME = 'timeline_posts' THEN NEW.user_id
        ELSE NULL
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_all_on_admin_post()
RETURNS TRIGGER AS $$
DECLARE
    poster_role VARCHAR(50);
    poster_name VARCHAR(255);
BEGIN
    SELECT role, name INTO poster_role, poster_name FROM users WHERE id = NEW.user_id;
    
    IF poster_role IN ('Super Admin', 'Co Admin', 'Editor') THEN
        INSERT INTO notifications (user_id, type, title, message, actor_id, timeline_post_id)
        SELECT 
            u.id,
            'admin_announcement',
            'Pengumuman dari ' || poster_name,
            LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END,
            NEW.user_id,
            NEW.id
        FROM users u
        WHERE u.id != NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_followers_on_new_chapter()
RETURNS TRIGGER AS $$
DECLARE
    novel_title VARCHAR(255);
    author_id_val INTEGER;
BEGIN
    SELECT title, author_id INTO novel_title, author_id_val FROM novels WHERE id = NEW.novel_id;
    
    INSERT INTO notifications (user_id, type, title, message, actor_id, novel_id, chapter_id)
    SELECT 
        fn.user_id,
        'new_chapter',
        'Chapter Baru: ' || novel_title,
        'Chapter ' || NEW.chapter_number || ': ' || NEW.title || ' telah tersedia',
        author_id_val,
        NEW.novel_id,
        NEW.id
    FROM following_novels fn
    WHERE fn.novel_id = NEW.novel_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_on_review_reply()
RETURNS TRIGGER AS $$
DECLARE
    parent_user_id INTEGER;
    replier_name VARCHAR(255);
BEGIN
    SELECT nr.user_id INTO parent_user_id 
    FROM novel_reviews nr 
    WHERE nr.id = NEW.review_id;
    
    SELECT name INTO replier_name FROM users WHERE id = NEW.user_id;
    
    IF parent_user_id IS NOT NULL AND parent_user_id != NEW.user_id THEN
        INSERT INTO notifications (user_id, type, title, message, actor_id, review_id)
        VALUES (
            parent_user_id,
            'comment_reply',
            'Balasan Baru',
            replier_name || ' membalas ulasan kamu',
            NEW.user_id,
            NEW.review_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ==================== STEP 8: CREATE TRIGGERS ====================

DROP TRIGGER IF EXISTS trigger_notify_followers_novel ON novels;
DROP TRIGGER IF EXISTS trigger_notify_followers_timeline ON timeline_posts;
DROP TRIGGER IF EXISTS trigger_notify_admin_post ON timeline_posts;
DROP TRIGGER IF EXISTS trigger_notify_new_chapter ON chapters;
DROP TRIGGER IF EXISTS trigger_notify_review_reply ON review_replies;

CREATE TRIGGER trigger_notify_followers_novel
AFTER INSERT ON novels
FOR EACH ROW
EXECUTE FUNCTION notify_followers_on_new_content();

CREATE TRIGGER trigger_notify_followers_timeline
AFTER INSERT ON timeline_posts
FOR EACH ROW
EXECUTE FUNCTION notify_followers_on_new_content();

CREATE TRIGGER trigger_notify_admin_post
AFTER INSERT ON timeline_posts
FOR EACH ROW
EXECUTE FUNCTION notify_all_on_admin_post();

CREATE TRIGGER trigger_notify_new_chapter
AFTER INSERT ON chapters
FOR EACH ROW
EXECUTE FUNCTION notify_followers_on_new_chapter();

CREATE TRIGGER trigger_notify_review_reply
AFTER INSERT ON review_replies
FOR EACH ROW
EXECUTE FUNCTION notify_on_review_reply();


-- ==================== DONE ====================
SELECT 'Schema fix and setup completed successfully!' as status;
