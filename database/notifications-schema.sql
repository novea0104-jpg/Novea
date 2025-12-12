-- Notifications Table Schema for Novea
-- Run this SQL in Supabase SQL Editor

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    -- Reference IDs for navigation
    novel_id INTEGER REFERENCES novels(id) ON DELETE CASCADE,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    timeline_post_id INTEGER REFERENCES timeline_posts(id) ON DELETE CASCADE,
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    review_id INTEGER,
    comment_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Match user_id with auth.jwt() email since users table uses email for identification
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
-- Triggers run as table owner and bypass RLS, so this policy only affects client-side inserts
-- Service role bypasses RLS entirely, so this effectively blocks direct client inserts
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        -- Only allow inserts if the user is inserting for themselves (for testing) or via service role
        user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
    );

-- Function to create notification for followed users when author posts new content
CREATE OR REPLACE FUNCTION notify_followers_on_new_content()
RETURNS TRIGGER AS $$
BEGIN
    -- Notify all followers of the author
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

-- Function to notify all users when admin/editor posts on timeline
CREATE OR REPLACE FUNCTION notify_all_on_admin_post()
RETURNS TRIGGER AS $$
DECLARE
    poster_role VARCHAR(50);
BEGIN
    SELECT role INTO poster_role FROM users WHERE id = NEW.user_id;
    
    IF poster_role IN ('super_admin', 'co_admin', 'editor') THEN
        INSERT INTO notifications (user_id, type, title, message, actor_id, timeline_post_id)
        SELECT 
            u.id,
            'admin_timeline_post',
            'Pengumuman dari ' || (SELECT name FROM users WHERE id = NEW.user_id),
            (SELECT name FROM users WHERE id = NEW.user_id) || ' memposting pengumuman baru',
            NEW.user_id,
            NEW.id
        FROM users u
        WHERE u.id != NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify on new chapter
CREATE OR REPLACE FUNCTION notify_followers_on_new_chapter()
RETURNS TRIGGER AS $$
DECLARE
    novel_title VARCHAR(255);
    author_id_val INTEGER;
BEGIN
    SELECT title, author_id INTO novel_title, author_id_val FROM novels WHERE id = NEW.novel_id;
    
    -- Notify followers of the novel
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

-- Function to notify on comment reply
CREATE OR REPLACE FUNCTION notify_on_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
    parent_user_id INTEGER;
    replier_name VARCHAR(255);
BEGIN
    -- Get parent comment user_id
    IF TG_TABLE_NAME = 'review_replies' THEN
        SELECT nr.user_id INTO parent_user_id 
        FROM novel_reviews nr 
        WHERE nr.id = NEW.review_id;
    ELSIF TG_TABLE_NAME = 'chapter_comment_replies' THEN
        SELECT cc.user_id INTO parent_user_id 
        FROM chapter_comments cc 
        WHERE cc.id = NEW.comment_id;
    ELSIF TG_TABLE_NAME = 'timeline_comment_replies' THEN
        SELECT tc.user_id INTO parent_user_id 
        FROM timeline_comments tc 
        WHERE tc.id = NEW.comment_id;
    END IF;
    
    SELECT name INTO replier_name FROM users WHERE id = NEW.user_id;
    
    -- Only notify if not replying to own comment
    IF parent_user_id IS NOT NULL AND parent_user_id != NEW.user_id THEN
        INSERT INTO notifications (user_id, type, title, message, actor_id, review_id, comment_id)
        VALUES (
            parent_user_id,
            'comment_reply',
            'Balasan Baru',
            replier_name || ' membalas komentar kamu',
            NEW.user_id,
            CASE WHEN TG_TABLE_NAME = 'review_replies' THEN NEW.review_id ELSE NULL END,
            CASE WHEN TG_TABLE_NAME IN ('chapter_comment_replies', 'timeline_comment_replies') THEN NEW.comment_id ELSE NULL END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers (drop existing first to avoid errors)
DROP TRIGGER IF EXISTS trigger_notify_followers_novel ON novels;
DROP TRIGGER IF EXISTS trigger_notify_followers_timeline ON timeline_posts;
DROP TRIGGER IF EXISTS trigger_notify_admin_post ON timeline_posts;
DROP TRIGGER IF EXISTS trigger_notify_new_chapter ON chapters;
DROP TRIGGER IF EXISTS trigger_notify_review_reply ON review_replies;

-- Trigger for new novel
CREATE TRIGGER trigger_notify_followers_novel
AFTER INSERT ON novels
FOR EACH ROW
EXECUTE FUNCTION notify_followers_on_new_content();

-- Trigger for new timeline post (from followed users)
CREATE TRIGGER trigger_notify_followers_timeline
AFTER INSERT ON timeline_posts
FOR EACH ROW
EXECUTE FUNCTION notify_followers_on_new_content();

-- Trigger for admin/editor timeline posts
CREATE TRIGGER trigger_notify_admin_post
AFTER INSERT ON timeline_posts
FOR EACH ROW
EXECUTE FUNCTION notify_all_on_admin_post();

-- Trigger for new chapter
CREATE TRIGGER trigger_notify_new_chapter
AFTER INSERT ON chapters
FOR EACH ROW
EXECUTE FUNCTION notify_followers_on_new_chapter();

-- Trigger for review replies (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'review_replies') THEN
        CREATE TRIGGER trigger_notify_review_reply
        AFTER INSERT ON review_replies
        FOR EACH ROW
        EXECUTE FUNCTION notify_on_comment_reply();
    END IF;
END $$;

-- Select statement to verify table creation
SELECT 'Notifications table and triggers created successfully!' as status;
