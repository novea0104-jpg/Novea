-- Add coin_balance column to users table if it doesn't exist
-- Run this in Supabase SQL Editor

-- Step 1: Add coin_balance column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'coin_balance'
    ) THEN
        ALTER TABLE users ADD COLUMN coin_balance INTEGER DEFAULT 0;
    END IF;
END $$;

-- Step 2: Add writer_balance column for writer monetization
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'writer_balance'
    ) THEN
        ALTER TABLE users ADD COLUMN writer_balance INTEGER DEFAULT 0;
    END IF;
END $$;

-- Step 3: Add total_earnings column for writer monetization
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'total_earnings'
    ) THEN
        ALTER TABLE users ADD COLUMN total_earnings INTEGER DEFAULT 0;
    END IF;
END $$;

-- Step 4: Create unlocked_chapters table if not exists
CREATE TABLE IF NOT EXISTS unlocked_chapters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, chapter_id)
);

-- Step 5: Create coin_transactions table if not exists
CREATE TABLE IF NOT EXISTS coin_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create writer_earnings table if not exists
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

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_unlocked_chapters_user ON unlocked_chapters(user_id);
CREATE INDEX IF NOT EXISTS idx_unlocked_chapters_chapter ON unlocked_chapters(chapter_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_writer_earnings_writer ON writer_earnings(writer_id);

-- Step 8: Enable RLS
ALTER TABLE unlocked_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE writer_earnings ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies
DROP POLICY IF EXISTS "Users can view their unlocked chapters" ON unlocked_chapters;
CREATE POLICY "Users can view their unlocked chapters" ON unlocked_chapters
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their coin transactions" ON coin_transactions;
CREATE POLICY "Users can view their coin transactions" ON coin_transactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Writers can view their earnings" ON writer_earnings;
CREATE POLICY "Writers can view their earnings" ON writer_earnings
    FOR SELECT USING (true);

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('coin_balance', 'writer_balance', 'total_earnings');
