-- Function to unlock a chapter and handle all transactions securely
-- This function bypasses RLS for internal operations while maintaining security

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
  v_writer_balance INTEGER;
  v_writer_total_earnings INTEGER;
  v_result JSON;
BEGIN
  -- Check user's current balance
  SELECT coin_balance INTO v_user_balance
  FROM users
  WHERE id = p_user_id;

  IF v_user_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  IF v_user_balance < p_cost THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient coins');
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

  -- Begin transaction operations

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

    -- 5. Update writer's balance
    UPDATE users
    SET 
      writer_balance = COALESCE(writer_balance, 0) + v_writer_share,
      total_earnings = COALESCE(total_earnings, 0) + v_writer_share
    WHERE id = v_novel_author_id;
  END IF;

  -- Get updated user balance
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION unlock_chapter_secure(INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_chapter_secure(INTEGER, INTEGER, INTEGER) TO anon;
