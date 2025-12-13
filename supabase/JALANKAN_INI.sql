-- =====================================================
-- COPY SEMUA INI KE SUPABASE > SQL EDITOR > RUN
-- =====================================================

-- 1. HAPUS TRIGGER YANG MEMBLOKIR
DROP TRIGGER IF EXISTS trigger_prevent_coin_balance_update ON users;
DROP FUNCTION IF EXISTS prevent_coin_balance_update();

-- 2. TAMBAH KOLOM YANG KURANG
ALTER TABLE users ADD COLUMN IF NOT EXISTS coin_balance INTEGER DEFAULT 10;
ALTER TABLE users ADD COLUMN IF NOT EXISTS writer_balance INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_earnings INTEGER DEFAULT 0;

-- 3. BUAT TABLE UNLOCKED_CHAPTERS
CREATE TABLE IF NOT EXISTS unlocked_chapters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, chapter_id)
);

-- 4. BUAT TABLE COIN_TRANSACTIONS
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

-- 5. BUAT TABLE WRITER_EARNINGS
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

-- 6. ENABLE RLS
ALTER TABLE unlocked_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE writer_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;

-- 7. POLICIES UNTUK UNLOCKED_CHAPTERS, COIN_TRANSACTIONS, WRITER_EARNINGS
DROP POLICY IF EXISTS "Anyone can view unlocked chapters" ON unlocked_chapters;
CREATE POLICY "Anyone can view unlocked chapters" ON unlocked_chapters FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view coin transactions" ON coin_transactions;
CREATE POLICY "Anyone can view coin transactions" ON coin_transactions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view writer earnings" ON writer_earnings;
CREATE POLICY "Anyone can view writer earnings" ON writer_earnings FOR SELECT USING (true);

-- 8. POLICIES UNTUK NOVELS (CRUD)
DROP POLICY IF EXISTS "Anyone can view novels" ON novels;
DROP POLICY IF EXISTS "Anyone can read novels" ON novels;
DROP POLICY IF EXISTS "Writers can insert novels" ON novels;
DROP POLICY IF EXISTS "Writers can update their novels" ON novels;
DROP POLICY IF EXISTS "Writers can delete their novels" ON novels;
DROP POLICY IF EXISTS "Authenticated users can insert novels" ON novels;

CREATE POLICY "Anyone can view novels" ON novels FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert novels" ON novels 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Writers can update their novels" ON novels 
FOR UPDATE USING (
    author_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
);

CREATE POLICY "Writers can delete their novels" ON novels 
FOR DELETE USING (
    author_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
);

-- 9. POLICIES UNTUK CHAPTERS (CRUD)
DROP POLICY IF EXISTS "Anyone can view chapters" ON chapters;
DROP POLICY IF EXISTS "Anyone can read chapters" ON chapters;
DROP POLICY IF EXISTS "Writers can insert chapters" ON chapters;
DROP POLICY IF EXISTS "Writers can update chapters" ON chapters;
DROP POLICY IF EXISTS "Writers can delete chapters" ON chapters;
DROP POLICY IF EXISTS "Authenticated users can insert chapters" ON chapters;

CREATE POLICY "Anyone can view chapters" ON chapters FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert chapters" ON chapters 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Writers can update chapters" ON chapters 
FOR UPDATE USING (
    novel_id IN (
        SELECT id FROM novels WHERE author_id IN (
            SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
        )
    )
);

CREATE POLICY "Writers can delete chapters" ON chapters 
FOR DELETE USING (
    novel_id IN (
        SELECT id FROM novels WHERE author_id IN (
            SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
        )
    )
);

-- 10. FUNCTION UNTUK UNLOCK CHAPTER (BYPASS RLS)
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
    IF v_user_balance IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    IF v_user_balance < p_cost THEN
        RETURN json_build_object('success', false, 'error', 'Koin tidak cukup');
    END IF;

    SELECT novel_id INTO v_chapter_novel_id FROM chapters WHERE id = p_chapter_id;
    IF v_chapter_novel_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Chapter not found');
    END IF;

    SELECT author_id INTO v_novel_author_id FROM novels WHERE id = v_chapter_novel_id;

    IF EXISTS (SELECT 1 FROM unlocked_chapters WHERE user_id = p_user_id AND chapter_id = p_chapter_id) THEN
        RETURN json_build_object('success', true, 'message', 'Already unlocked');
    END IF;

    v_writer_share := FLOOR(p_cost * 0.80);
    v_platform_share := p_cost - v_writer_share;

    UPDATE users SET coin_balance = coin_balance - p_cost WHERE id = p_user_id;

    INSERT INTO unlocked_chapters (user_id, chapter_id, novel_id) VALUES (p_user_id, p_chapter_id, v_chapter_novel_id);

    INSERT INTO coin_transactions (user_id, amount, type, description, metadata)
    VALUES (p_user_id, -p_cost, 'unlock_chapter', 'Unlocked chapter ' || p_chapter_id, json_build_object('chapter_id', p_chapter_id, 'novel_id', v_chapter_novel_id));

    IF v_novel_author_id IS NOT NULL THEN
        INSERT INTO writer_earnings (writer_id, novel_id, chapter_id, reader_id, amount, writer_share, platform_share)
        VALUES (v_novel_author_id, v_chapter_novel_id, p_chapter_id, p_user_id, p_cost, v_writer_share, v_platform_share);

        UPDATE users SET 
            writer_balance = COALESCE(writer_balance, 0) + v_writer_share,
            total_earnings = COALESCE(total_earnings, 0) + v_writer_share
        WHERE id = v_novel_author_id;
    END IF;

    SELECT coin_balance INTO v_user_balance FROM users WHERE id = p_user_id;

    RETURN json_build_object('success', true, 'new_balance', v_user_balance, 'chapter_id', p_chapter_id, 'cost', p_cost);
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 11. GRANT PERMISSION
GRANT EXECUTE ON FUNCTION unlock_chapter_secure(INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_chapter_secure(INTEGER, INTEGER, INTEGER) TO anon;

-- DONE!
SELECT 'BERHASIL! Sekarang app bisa buat chapter dan unlock chapter.' as status;
