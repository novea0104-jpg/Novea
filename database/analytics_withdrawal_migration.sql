-- =====================================================
-- NOVEA - Analytics & Withdrawal System Migration
-- Run this SQL in Supabase Dashboard SQL Editor
-- =====================================================

-- 1. Create writer_bank_accounts table for withdrawal destinations
CREATE TABLE IF NOT EXISTS writer_bank_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_name VARCHAR(100) NOT NULL,
  bank_code VARCHAR(20),
  account_number VARCHAR(50) NOT NULL,
  account_holder_name VARCHAR(100) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_account_id INTEGER NOT NULL REFERENCES writer_bank_accounts(id) ON DELETE RESTRICT,
  amount INTEGER NOT NULL CHECK (amount > 0),
  fee INTEGER DEFAULT 0,
  net_amount INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'rejected', 'paid', 'cancelled')),
  admin_note TEXT,
  processed_by INTEGER REFERENCES users(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add writer_balance column to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS writer_balance INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_earnings INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_withdrawal INTEGER DEFAULT 0;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_writer_bank_accounts_user_id ON writer_bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at);

-- 5. Create writer_earnings table to track per-chapter earnings
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

CREATE INDEX IF NOT EXISTS idx_writer_earnings_writer_id ON writer_earnings(writer_id);
CREATE INDEX IF NOT EXISTS idx_writer_earnings_novel_id ON writer_earnings(novel_id);
CREATE INDEX IF NOT EXISTS idx_writer_earnings_created_at ON writer_earnings(created_at);

-- 6. Create view for daily earnings analytics
CREATE OR REPLACE VIEW writer_daily_earnings AS
SELECT 
  writer_id,
  DATE(created_at) as date,
  COUNT(*) as unlock_count,
  SUM(amount) as total_amount,
  SUM(writer_share) as total_writer_share
FROM writer_earnings
GROUP BY writer_id, DATE(created_at)
ORDER BY date DESC;

-- 7. Create view for novel performance
CREATE OR REPLACE VIEW novel_performance AS
SELECT 
  we.novel_id,
  n.title as novel_title,
  n.author_id as writer_id,
  COUNT(*) as total_unlocks,
  SUM(we.amount) as total_revenue,
  SUM(we.writer_share) as total_writer_earnings,
  COUNT(DISTINCT we.reader_id) as unique_readers,
  COUNT(DISTINCT we.chapter_id) as chapters_unlocked
FROM writer_earnings we
JOIN novels n ON n.id = we.novel_id
GROUP BY we.novel_id, n.title, n.author_id;

-- 8. Function to record chapter unlock and distribute earnings
CREATE OR REPLACE FUNCTION record_chapter_unlock(
  p_reader_id INTEGER,
  p_chapter_id INTEGER,
  p_novel_id INTEGER,
  p_writer_id INTEGER,
  p_amount INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_writer_share INTEGER;
  v_platform_share INTEGER;
BEGIN
  -- Calculate shares (70% to writer, 30% to platform)
  v_writer_share := FLOOR(p_amount * 0.70);
  v_platform_share := p_amount - v_writer_share;
  
  -- Insert earning record
  INSERT INTO writer_earnings (writer_id, novel_id, chapter_id, reader_id, amount, writer_share, platform_share)
  VALUES (p_writer_id, p_novel_id, p_chapter_id, p_reader_id, p_amount, v_writer_share, v_platform_share);
  
  -- Update writer's balance
  UPDATE users 
  SET writer_balance = writer_balance + v_writer_share,
      total_earnings = total_earnings + v_writer_share,
      updated_at = NOW()
  WHERE id = p_writer_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 9. Function to create withdrawal request
CREATE OR REPLACE FUNCTION create_withdrawal_request(
  p_user_id INTEGER,
  p_bank_account_id INTEGER,
  p_amount INTEGER,
  p_fee INTEGER DEFAULT 0
) RETURNS INTEGER AS $$
DECLARE
  v_current_balance INTEGER;
  v_pending_wd INTEGER;
  v_net_amount INTEGER;
  v_request_id INTEGER;
BEGIN
  -- Get current balance
  SELECT writer_balance, pending_withdrawal INTO v_current_balance, v_pending_wd
  FROM users WHERE id = p_user_id;
  
  -- Check if enough balance
  IF v_current_balance - v_pending_wd < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Calculate net amount
  v_net_amount := p_amount - p_fee;
  
  -- Create withdrawal request
  INSERT INTO withdrawal_requests (user_id, bank_account_id, amount, fee, net_amount)
  VALUES (p_user_id, p_bank_account_id, p_amount, p_fee, v_net_amount)
  RETURNING id INTO v_request_id;
  
  -- Update pending withdrawal
  UPDATE users 
  SET pending_withdrawal = pending_withdrawal + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Function to process withdrawal (for admin)
CREATE OR REPLACE FUNCTION process_withdrawal(
  p_request_id INTEGER,
  p_admin_id INTEGER,
  p_status VARCHAR(20),
  p_note TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id INTEGER;
  v_amount INTEGER;
BEGIN
  -- Get request details
  SELECT user_id, amount INTO v_user_id, v_amount
  FROM withdrawal_requests WHERE id = p_request_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;
  
  -- Update request status
  UPDATE withdrawal_requests 
  SET status = p_status,
      admin_note = p_note,
      processed_by = p_admin_id,
      processed_at = NOW(),
      paid_at = CASE WHEN p_status = 'paid' THEN NOW() ELSE paid_at END,
      updated_at = NOW()
  WHERE id = p_request_id;
  
  -- Handle balance updates based on status
  IF p_status = 'approved' OR p_status = 'paid' THEN
    -- Deduct from writer balance
    UPDATE users 
    SET writer_balance = writer_balance - v_amount,
        pending_withdrawal = pending_withdrawal - v_amount,
        updated_at = NOW()
    WHERE id = v_user_id;
  ELSIF p_status = 'rejected' OR p_status = 'cancelled' THEN
    -- Just remove from pending
    UPDATE users 
    SET pending_withdrawal = pending_withdrawal - v_amount,
        updated_at = NOW()
    WHERE id = v_user_id;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 11. Insert some sample earnings data for testing (optional)
-- Uncomment to add test data
/*
INSERT INTO writer_earnings (writer_id, novel_id, chapter_id, reader_id, amount, writer_share, platform_share, created_at)
SELECT 
  1 as writer_id,
  1 as novel_id,
  1 as chapter_id,
  2 as reader_id,
  10 as amount,
  7 as writer_share,
  3 as platform_share,
  NOW() - (random() * INTERVAL '30 days') as created_at
FROM generate_series(1, 50);
*/

-- 12. Grant permissions (adjust as needed)
-- These are handled by RLS policies

-- =====================================================
-- Run this migration in Supabase Dashboard SQL Editor
-- =====================================================
