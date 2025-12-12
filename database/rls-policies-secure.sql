-- =====================================================
-- RLS Policies untuk Secure Google Play Billing
-- =====================================================
-- PENTING: Jalankan SQL ini di Supabase Dashboard SQL Editor
-- setelah deploy Edge Function validate-purchase
-- =====================================================

-- 0. Buat unique index pada reference_id untuk idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_coin_transactions_reference_id 
ON coin_transactions(reference_id) 
WHERE reference_id IS NOT NULL;

-- 1. Drop existing policies yang mengizinkan client INSERT ke coin_transactions
DROP POLICY IF EXISTS "Users can insert coin transactions" ON coin_transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON coin_transactions;
DROP POLICY IF EXISTS "Allow authenticated users to insert coin_transactions" ON coin_transactions;

-- 2. Drop existing policies yang mengizinkan client UPDATE users.coin_balance
-- (Kita akan buat policy baru yang lebih restrictive)

-- 3. Buat policy baru: Users hanya bisa READ coin_transactions mereka sendiri
CREATE POLICY "Users can view their own transactions"
ON coin_transactions FOR SELECT
TO authenticated
USING (user_id = (SELECT id FROM users WHERE email = auth.email()));

-- 4. Buat policy: HANYA service_role yang bisa INSERT ke coin_transactions
-- Note: Edge Functions dengan service_role key bypass RLS secara default
-- Jadi kita TIDAK perlu policy INSERT untuk authenticated users

-- 5. Users bisa update profil mereka KECUALI coin_balance
-- Ini dilakukan dengan trigger atau batasan di application level
-- Karena RLS tidak bisa restrict column-level access secara langsung

-- 6. Buat trigger function untuk prevent direct coin_balance update oleh user
CREATE OR REPLACE FUNCTION prevent_coin_balance_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow if called from service_role (Edge Function)
  IF current_setting('request.jwt.claims', true)::json->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;
  
  -- Allow if coin_balance tidak berubah
  IF OLD.coin_balance = NEW.coin_balance THEN
    RETURN NEW;
  END IF;
  
  -- Block jika mencoba update coin_balance dari client
  RAISE EXCEPTION 'Direct coin_balance update not allowed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Apply trigger ke users table
DROP TRIGGER IF EXISTS trigger_prevent_coin_balance_update ON users;
CREATE TRIGGER trigger_prevent_coin_balance_update
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION prevent_coin_balance_update();

-- =====================================================
-- Alternative: Jika trigger di atas menyebabkan masalah,
-- gunakan pendekatan RPC untuk update coin balance
-- =====================================================

-- Function untuk credit coins (hanya dipanggil dari Edge Function)
CREATE OR REPLACE FUNCTION credit_user_coins(
  p_user_id INTEGER,
  p_amount INTEGER,
  p_description TEXT,
  p_reference_id TEXT
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_tx_id INTEGER;
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Check idempotency - apakah transaksi sudah ada
  SELECT id INTO v_existing_tx_id
  FROM coin_transactions
  WHERE reference_id = p_reference_id
  LIMIT 1;
  
  IF v_existing_tx_id IS NOT NULL THEN
    RETURN QUERY SELECT TRUE, 0, 'Transaction already processed'::TEXT;
    RETURN;
  END IF;
  
  -- Get current balance
  SELECT coin_balance INTO v_current_balance
  FROM users
  WHERE id = p_user_id;
  
  IF v_current_balance IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 'User not found'::TEXT;
    RETURN;
  END IF;
  
  -- Insert transaction first (untuk idempotency)
  INSERT INTO coin_transactions (user_id, type, amount, description, reference_id)
  VALUES (p_user_id, 'purchase', p_amount, p_description, p_reference_id);
  
  -- Update balance
  v_new_balance := v_current_balance + p_amount;
  UPDATE users SET coin_balance = v_new_balance WHERE id = p_user_id;
  
  RETURN QUERY SELECT TRUE, v_new_balance, 'Success'::TEXT;
END;
$$;

-- Grant execute permission hanya untuk service_role
REVOKE ALL ON FUNCTION credit_user_coins FROM PUBLIC;
REVOKE ALL ON FUNCTION credit_user_coins FROM authenticated;
-- Edge Functions menggunakan service_role yang bypass permission checks

-- =====================================================
-- Catatan Penting:
-- =====================================================
-- 1. Edge Function HARUS menggunakan SUPABASE_SERVICE_ROLE_KEY
--    untuk bypass RLS dan memanggil fungsi ini
-- 
-- 2. Setelah menjalankan SQL ini, client TIDAK BISA:
--    - INSERT langsung ke coin_transactions
--    - UPDATE coin_balance di users table
--
-- 3. Semua pembelian coin HARUS melalui Edge Function
--    yang memvalidasi receipt dari Google Play
-- =====================================================
