-- Reset all users Gold Novoin to 1
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

UPDATE users SET coin_balance = 1;

-- Verify the update
SELECT id, name, coin_balance FROM users ORDER BY id LIMIT 20;
