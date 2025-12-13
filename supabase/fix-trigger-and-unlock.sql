-- =====================================================
-- FIX TRIGGER DAN UNLOCK CHAPTER
-- =====================================================
-- Jalankan SEMUA SQL ini di Supabase Dashboard > SQL Editor
-- =====================================================

-- STEP 1: Hapus trigger yang memblokir update coin_balance
DROP TRIGGER IF EXISTS trigger_prevent_coin_balance_update ON users;
DROP FUNCTION IF EXISTS prevent_coin_balance_update();

-- STEP 2: Tambah kolom coin_balance jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'coin_balance'
    ) THEN
        ALTER TABLE users ADD COLUMN coin_balance INTEGER DEFAULT 10;
    END IF;
END $$;

-- STEP 3: Tambah kolom writer_balance jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'writer_balance'
    ) THEN
        ALTER TABLE users ADD COLUMN writer_balance INTEGER DEFAULT 0;
    END IF;
END $$;

-- STEP 4: Tambah kolom total_earnings jika belum ada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'total_earnings'
    ) THEN
        ALTER TABLE users ADD COLUMN total_earnings INTEGER DEFAULT 0;
    END IF;
END $$;

-- STEP 5: Buat table unlocked_chapters jika belum ada
CREATE TABLE IF NOT EXISTS unlocked_chapters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, chapter_id)
);

-- STEP 6: Buat table coin_transactions jika belum ada
CREATE TABLE IF NOT EXISTS coin_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    reference_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 7: Buat table writer_earnings jika belum ada
CREATE TABLE IF NOT EXISTS writer_earnings (
    id SERIAL PRIMARY KEY,
    writer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    reader_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    writer_share INTEGER NOT NULL,
    platform_share INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 8: Enable RLS
ALTER TABLE unlocked_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE writer_earnings ENABLE ROW LEVEL SECURITY;

-- STEP 9: Buat RLS policies (SELECT only untuk client, RPC handles updates)
DROP POLICY IF EXISTS "Anyone can view unlocked chapters" ON unlocked_chapters;
CREATE POLICY "Anyone can view unlocked chapters" ON unlocked_chapters
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view coin transactions" ON coin_transactions;
CREATE POLICY "Anyone can view coin transactions" ON coin_transactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view writer earnings" ON writer_earnings;
CREATE POLICY "Anyone can view writer earnings" ON writer_earnings
    FOR SELECT USING (true);

-- STEP 10: Buat function untuk unlock chapter (SECURITY DEFINER = bypass RLS)
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
    -- Check user balance
    SELECT coin_balance INTO v_user_balance
    FROM users
    WHERE id = p_user_id;

    IF v_user_balance IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;

    IF v_user_balance < p_cost THEN
        RETURN json_build_object('success', false, 'error', 'Koin tidak cukup');
    END IF;

    -- Get chapter info
    SELECT novel_id INTO v_chapter_novel_id
    FROM chapters
    WHERE id = p_chapter_id;

    IF v_chapter_novel_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Chapter not found');
    END IF;

    -- Get novel author
    SELECT author_id INTO v_novel_author_id
    FROM novels
    WHERE id = v_chapter_novel_id;

    -- Check if already unlocked
    IF EXISTS (
        SELECT 1 FROM unlocked_chapters 
        WHERE user_id = p_user_id AND chapter_id = p_chapter_id
    ) THEN
        RETURN json_build_object('success', true, 'message', 'Already unlocked');
    END IF;

    -- Calculate revenue split (80% writer, 20% platform)
    v_writer_share := FLOOR(p_cost * 0.80);
    v_platform_share := p_cost - v_writer_share;

    -- 1. Deduct coins from reader
    UPDATE users
    SET coin_balance = coin_balance - p_cost
    WHERE id = p_user_id;

    -- 2. Insert unlock record
    INSERT INTO unlocked_chapters (user_id, chapter_id, novel_id)
    VALUES (p_user_id, p_chapter_id, v_chapter_novel_id);

    -- 3. Record coin transaction
    INSERT INTO coin_transactions (user_id, amount, type, description, metadata)
    VALUES (
        p_user_id,
        -p_cost,
        'unlock_chapter',
        'Unlocked chapter ' || p_chapter_id,
        json_build_object('chapter_id', p_chapter_id, 'novel_id', v_chapter_novel_id)
    );

    -- 4. Record writer earnings
    IF v_novel_author_id IS NOT NULL THEN
        INSERT INTO writer_earnings (writer_id, novel_id, chapter_id, reader_id, amount, writer_share, platform_share)
        VALUES (v_novel_author_id, v_chapter_novel_id, p_chapter_id, p_user_id, p_cost, v_writer_share, v_platform_share);

        -- 5. Update writer balance
        UPDATE users
        SET 
            writer_balance = COALESCE(writer_balance, 0) + v_writer_share,
            total_earnings = COALESCE(total_earnings, 0) + v_writer_share
        WHERE id = v_novel_author_id;
    END IF;

    -- Get updated balance
    SELECT coin_balance INTO v_user_balance
    FROM users
    WHERE id = p_user_id;

    RETURN json_build_object(
        'success', true,
        'new_balance', v_user_balance,
        'chapter_id', p_chapter_id,
        'cost', p_cost
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- STEP 11: Grant permission untuk function
GRANT EXECUTE ON FUNCTION unlock_chapter_secure(INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_chapter_secure(INTEGER, INTEGER, INTEGER) TO anon;

-- STEP 12: Verifikasi
SELECT 'Trigger dropped' as status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('coin_balance', 'writer_balance', 'total_earnings');
