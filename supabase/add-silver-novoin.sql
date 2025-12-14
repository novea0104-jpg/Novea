-- Add Silver Novoin balance to users table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- Add silver_balance column to users table (default 0 for existing users)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS silver_balance INTEGER DEFAULT 0 NOT NULL;

-- Optional: Give new users some starting silver (e.g., 100 Silver as welcome bonus)
-- You can adjust the default value by running:
-- ALTER TABLE users ALTER COLUMN silver_balance SET DEFAULT 100;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('coin_balance', 'silver_balance');
