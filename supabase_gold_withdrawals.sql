-- Gold Novoin Withdrawal Table
-- Run this in Supabase SQL Editor

-- Drop existing table if it exists (uncomment if needed)
-- DROP TABLE IF EXISTS gold_withdrawals;

CREATE TABLE IF NOT EXISTS gold_withdrawals (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_account_id BIGINT NOT NULL REFERENCES writer_bank_accounts(id) ON DELETE CASCADE,
  gold_amount INTEGER NOT NULL,
  rupiah_amount INTEGER NOT NULL,
  fee INTEGER NOT NULL DEFAULT 2500,
  net_amount INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_gold_withdrawals_user ON gold_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_gold_withdrawals_status ON gold_withdrawals(status);

-- Enable RLS
ALTER TABLE gold_withdrawals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own withdrawals
CREATE POLICY "Users can view own gold withdrawals"
ON gold_withdrawals FOR SELECT
USING (user_id = (SELECT id FROM users WHERE auth.uid()::text = users.auth_id) OR 
       EXISTS (SELECT 1 FROM users WHERE auth.uid()::text = users.auth_id AND role IN ('super_admin', 'co_admin')));

-- Policy: Users can insert their own withdrawal requests
CREATE POLICY "Users can create gold withdrawals"
ON gold_withdrawals FOR INSERT
WITH CHECK (user_id = (SELECT id FROM users WHERE auth.uid()::text = users.auth_id));

-- Policy: Admins can update withdrawals
CREATE POLICY "Admins can update gold withdrawals"
ON gold_withdrawals FOR UPDATE
USING (EXISTS (SELECT 1 FROM users WHERE auth.uid()::text = users.auth_id AND role IN ('super_admin', 'co_admin')));
