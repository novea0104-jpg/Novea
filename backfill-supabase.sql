-- BACKFILL SCRIPT FOR SUPABASE
-- Run this in Supabase SQL Editor with service role
-- This reconstructs coin_transactions and writer_earnings from unlocked_chapters

-- Step 1: Insert missing coin_transactions for chapter unlocks
INSERT INTO coin_transactions (user_id, amount, type, description, metadata, created_at)
SELECT 
  uc.user_id,
  -COALESCE(c.price, 2) as amount,
  'unlock_chapter' as type,
  'Unlocked chapter ' || uc.chapter_id as description,
  jsonb_build_object('chapter_id', uc.chapter_id, 'novel_id', uc.novel_id) as metadata,
  uc.unlocked_at as created_at
FROM unlocked_chapters uc
LEFT JOIN chapters c ON c.id = uc.chapter_id
WHERE NOT EXISTS (
  SELECT 1 FROM coin_transactions ct 
  WHERE ct.user_id = uc.user_id 
    AND ct.type = 'unlock_chapter'
    AND (ct.metadata->>'chapter_id')::int = uc.chapter_id
);

-- Step 2: Insert missing writer_earnings
INSERT INTO writer_earnings (writer_id, novel_id, chapter_id, reader_id, amount, writer_share, platform_share, created_at)
SELECT 
  n.author_id as writer_id,
  uc.novel_id,
  uc.chapter_id,
  uc.user_id as reader_id,
  COALESCE(c.price, 2) as amount,
  FLOOR(COALESCE(c.price, 2) * 0.80) as writer_share,
  COALESCE(c.price, 2) - FLOOR(COALESCE(c.price, 2) * 0.80) as platform_share,
  uc.unlocked_at as created_at
FROM unlocked_chapters uc
LEFT JOIN chapters c ON c.id = uc.chapter_id
LEFT JOIN novels n ON n.id = uc.novel_id
WHERE NOT EXISTS (
  SELECT 1 FROM writer_earnings we 
  WHERE we.reader_id = uc.user_id 
    AND we.chapter_id = uc.chapter_id
);

-- Step 3: Verify the data
SELECT 'coin_transactions count:' as info, COUNT(*) as count FROM coin_transactions WHERE type = 'unlock_chapter';
SELECT 'writer_earnings count:' as info, COUNT(*) as count FROM writer_earnings;
SELECT 'unlocked_chapters count:' as info, COUNT(*) as count FROM unlocked_chapters;

-- Step 4: Show writer balances
SELECT id, name, writer_balance, total_earnings FROM users WHERE writer_balance > 0 OR total_earnings > 0;
