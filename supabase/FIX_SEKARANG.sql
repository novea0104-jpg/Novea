-- =====================================================
-- FIX CEPAT - MATIKAN RLS SEMENTARA
-- Copy-paste ke Supabase > SQL Editor > RUN
-- =====================================================

-- Matikan RLS untuk novels dan chapters (agar bisa insert/update)
ALTER TABLE novels DISABLE ROW LEVEL SECURITY;
ALTER TABLE chapters DISABLE ROW LEVEL SECURITY;

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

SELECT 'DONE! RLS dimatikan, sekarang bisa insert/update chapter.' as result;
