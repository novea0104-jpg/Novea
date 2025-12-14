-- Gold Novoin Withdrawal Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS gold_withdrawals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_account_id INTEGER NOT NULL REFERENCES writer_bank_accounts(id) ON DELETE CASCADE,
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
USING (auth.uid()::text = user_id::text OR 
       EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::integer AND role IN ('super_admin', 'co_admin')));

-- Policy: Users can insert their own withdrawal requests
CREATE POLICY "Users can create gold withdrawals"
ON gold_withdrawals FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

-- Policy: Admins can update withdrawals
CREATE POLICY "Admins can update gold withdrawals"
ON gold_withdrawals FOR UPDATE
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid()::integer AND role IN ('super_admin', 'co_admin')));
