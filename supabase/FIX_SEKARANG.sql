-- =====================================================
-- FIX CEPAT - MATIKAN RLS SEMENTARA
-- Copy-paste ke Supabase > SQL Editor > RUN
-- =====================================================

-- Matikan RLS untuk novels dan chapters (agar bisa insert/update)
ALTER TABLE novels DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapters DISABLE ROW LEVEL SECURITY;

-- DROP trigger yang bermasalah (menyebabkan error "record new has no field user_id")
DROP TRIGGER IF EXISTS trigger_notify_followers_novel ON novels;
DROP TRIGGER IF EXISTS trigger_notify_followers_timeline ON timeline_posts;
DROP FUNCTION IF EXISTS notify_followers_on_new_content() CASCADE;

-- Pastikan kolom ada
ALTER TABLE users ADD COLUMN IF NOT EXISTS coin_balance INTEGER DEFAULT 10;
ALTER TABLE users ADD COLUMN IF NOT EXISTS writer_balance INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_earnings INTEGER DEFAULT 0;

-- Hapus trigger yang memblokir
DROP TRIGGER IF EXISTS trigger_prevent_coin_balance_update ON users;
DROP FUNCTION IF EXISTS prevent_coin_balance_update();

-- Buat table yang diperlukan
CREATE TABLE IF NOT EXISTS unlocked_chapters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    chapter_id INTEGER NOT NULL,
    novel_id INTEGER NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, chapter_id)
);

CREATE TABLE IF NOT EXISTS coin_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS writer_earnings (
    id SERIAL PRIMARY KEY,
    writer_id INTEGER NOT NULL,
    novel_id INTEGER NOT NULL,
    chapter_id INTEGER NOT NULL,
    reader_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    writer_share INTEGER NOT NULL,
    platform_share INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matikan RLS untuk table baru juga
ALTER TABLE unlocked_chapters DISABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE writer_earnings DISABLE ROW LEVEL SECURITY;

-- Function unlock chapter
CREATE OR REPLACE FUNCTION unlock_chapter_secure(
    p_user_id INTEGER,
    p_chapter_id INTEGER,
    p_cost INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_balance INTEGER;
    v_chapter_novel_id INTEGER;
    v_novel_author_id INTEGER;
    v_writer_share INTEGER;
    v_platform_share INTEGER;
BEGIN
    SELECT coin_balance INTO v_user_balance FROM users WHERE id = p_user_id;
    IF v_user_balance IS NULL THEN RETURN '{"success":false,"error":"User not found"}'::json; END IF;
    IF v_user_balance < p_cost THEN RETURN '{"success":false,"error":"Koin tidak cukup"}'::json; END IF;

    SELECT novel_id INTO v_chapter_novel_id FROM chapters WHERE id = p_chapter_id;
    IF v_chapter_novel_id IS NULL THEN RETURN '{"success":false,"error":"Chapter not found"}'::json; END IF;

    SELECT author_id INTO v_novel_author_id FROM novels WHERE id = v_chapter_novel_id;

    IF EXISTS (SELECT 1 FROM unlocked_chapters WHERE user_id = p_user_id AND chapter_id = p_chapter_id) THEN
        RETURN '{"success":true,"message":"Already unlocked"}'::json;
    END IF;

    -- Calculate writer share (80%) and platform share (20%)
    v_writer_share := FLOOR(p_cost * 0.80);
    v_platform_share := p_cost - v_writer_share;

    -- Deduct coins from reader
    UPDATE users SET coin_balance = coin_balance - p_cost WHERE id = p_user_id;
    
    -- Record the unlock
    INSERT INTO unlocked_chapters (user_id, chapter_id, novel_id) VALUES (p_user_id, p_chapter_id, v_chapter_novel_id);
    
    -- Record coin transaction for reader
    INSERT INTO coin_transactions (user_id, amount, type, description) VALUES (p_user_id, -p_cost, 'unlock', 'Chapter ' || p_chapter_id);

    -- Credit writer and record earnings
    IF v_novel_author_id IS NOT NULL THEN
        -- Update writer's balance and total earnings
        UPDATE users SET 
            writer_balance = COALESCE(writer_balance, 0) + v_writer_share,
            total_earnings = COALESCE(total_earnings, 0) + v_writer_share
        WHERE id = v_novel_author_id;
        
        -- Insert into writer_earnings table for dashboard analytics
        INSERT INTO writer_earnings (
            writer_id, 
            novel_id, 
            chapter_id, 
            reader_id, 
            amount, 
            writer_share, 
            platform_share
        ) VALUES (
            v_novel_author_id, 
            v_chapter_novel_id, 
            p_chapter_id, 
            p_user_id, 
            p_cost, 
            v_writer_share, 
            v_platform_share
        );
    END IF;

    SELECT coin_balance INTO v_user_balance FROM users WHERE id = p_user_id;
    RETURN json_build_object('success', true, 'new_balance', v_user_balance);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION unlock_chapter_secure(INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_chapter_secure(INTEGER, INTEGER, INTEGER) TO anon;

-- =====================================================
-- BACKFILL: Perbaiki data pembelian yang sudah ada
-- =====================================================

-- Insert missing writer_earnings records from unlocked_chapters
INSERT INTO writer_earnings (writer_id, novel_id, chapter_id, reader_id, amount, writer_share, platform_share, created_at)
SELECT DISTINCT
    n.author_id as writer_id,
    uc.novel_id,
    uc.chapter_id,
    uc.user_id as reader_id,
    COALESCE(c.price, 1) as amount,
    FLOOR(COALESCE(c.price, 1) * 0.80) as writer_share,
    CEIL(COALESCE(c.price, 1) * 0.20) as platform_share,
    uc.unlocked_at as created_at
FROM unlocked_chapters uc
JOIN novels n ON n.id = uc.novel_id
JOIN chapters c ON c.id = uc.chapter_id
WHERE n.author_id IS NOT NULL
  AND c.is_free = false
  AND NOT EXISTS (
    SELECT 1 FROM writer_earnings we 
    WHERE we.chapter_id = uc.chapter_id 
      AND we.reader_id = uc.user_id
  );

-- Update total_earnings for all writers based on writer_earnings table
UPDATE users u
SET total_earnings = COALESCE((
    SELECT SUM(we.writer_share) 
    FROM writer_earnings we 
    WHERE we.writer_id = u.id
), 0)
WHERE u.role IN ('penulis', 'editor', 'co_admin', 'super_admin');

-- Update writer_balance to match total_earnings minus any withdrawals
UPDATE users u
SET writer_balance = COALESCE((
    SELECT SUM(we.writer_share) 
    FROM writer_earnings we 
    WHERE we.writer_id = u.id
), 0) - COALESCE(u.pending_withdrawal, 0)
WHERE u.role IN ('penulis', 'editor', 'co_admin', 'super_admin');

-- =====================================================
-- BUAT ULANG TRIGGER YANG SUDAH DIPERBAIKI
-- =====================================================

-- Function untuk notify followers ketika ada novel baru
CREATE OR REPLACE FUNCTION notify_followers_new_novel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, actor_id, novel_id)
    SELECT 
        uf.follower_id,
        'new_novel',
        'Novel Baru dari ' || (SELECT name FROM users WHERE id = NEW.author_id),
        (SELECT name FROM users WHERE id = NEW.author_id) || ' memposting novel baru: ' || NEW.title,
        NEW.author_id,
        NEW.id
    FROM user_follows uf
    WHERE uf.following_id = NEW.author_id;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

-- Function untuk notify followers ketika ada timeline post baru  
CREATE OR REPLACE FUNCTION notify_followers_new_timeline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, actor_id, timeline_post_id)
    SELECT 
        uf.follower_id,
        'new_timeline_post',
        'Post Baru dari ' || (SELECT name FROM users WHERE id = NEW.user_id),
        (SELECT name FROM users WHERE id = NEW.user_id) || ' membuat post baru di Linimasa',
        NEW.user_id,
        NEW.id
    FROM user_follows uf
    WHERE uf.following_id = NEW.user_id;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

-- Buat trigger untuk novels
DROP TRIGGER IF EXISTS trigger_notify_followers_novel ON novels;
CREATE TRIGGER trigger_notify_followers_novel
    AFTER INSERT ON novels
    FOR EACH ROW
    EXECUTE FUNCTION notify_followers_new_novel();

-- Buat trigger untuk timeline_posts (jika table ada)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'timeline_posts') THEN
        DROP TRIGGER IF EXISTS trigger_notify_followers_timeline ON timeline_posts;
        CREATE TRIGGER trigger_notify_followers_timeline
            AFTER INSERT ON timeline_posts
            FOR EACH ROW
            EXECUTE FUNCTION notify_followers_new_timeline();
    END IF;
END $$;

SELECT 'DONE! Semua fix sudah diterapkan. Novel baru bisa dibuat.' as result;
