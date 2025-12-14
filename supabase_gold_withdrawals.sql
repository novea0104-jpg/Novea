-- Gold Novoin Withdrawal Table
-- Run this in Supabase SQL Editor

CREATE TABLE gold_withdrawals (
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

CREATE INDEX idx_gold_withdrawals_user ON gold_withdrawals(user_id);
CREATE INDEX idx_gold_withdrawals_status ON gold_withdrawals(status);
