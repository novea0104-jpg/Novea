-- =====================================================
-- ADMIN WITHDRAWAL TABLES
-- Copy ini ke Supabase > SQL Editor > Run
-- =====================================================

-- 1. BUAT TABLE ADMIN_BANK_ACCOUNTS
CREATE TABLE IF NOT EXISTS admin_bank_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bank_name VARCHAR(100) NOT NULL,
    bank_code VARCHAR(20),
    account_number VARCHAR(50) NOT NULL,
    account_holder_name VARCHAR(200) NOT NULL,
    is_primary BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, account_number)
);

-- 2. BUAT TABLE ADMIN_WITHDRAWALS
CREATE TABLE IF NOT EXISTS admin_withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL,
    percentage_used NUMERIC(5,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    admin_note TEXT,
    bank_account_id INTEGER REFERENCES admin_bank_accounts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- 3. ENABLE RLS
ALTER TABLE admin_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_withdrawals ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES UNTUK ADMIN_BANK_ACCOUNTS
DROP POLICY IF EXISTS "Admins can view own bank accounts" ON admin_bank_accounts;
CREATE POLICY "Admins can view own bank accounts" ON admin_bank_accounts 
FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
    OR EXISTS (
        SELECT 1 FROM users 
        WHERE email = auth.jwt() ->> 'email' 
        AND role IN ('super_admin', 'Super Admin')
    )
);

DROP POLICY IF EXISTS "Admins can insert own bank accounts" ON admin_bank_accounts;
CREATE POLICY "Admins can insert own bank accounts" ON admin_bank_accounts 
FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Admins can update own bank accounts" ON admin_bank_accounts;
CREATE POLICY "Admins can update own bank accounts" ON admin_bank_accounts 
FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Admins can delete own bank accounts" ON admin_bank_accounts;
CREATE POLICY "Admins can delete own bank accounts" ON admin_bank_accounts 
FOR DELETE USING (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
);

-- 5. POLICIES UNTUK ADMIN_WITHDRAWALS
DROP POLICY IF EXISTS "Admins can view own withdrawals" ON admin_withdrawals;
CREATE POLICY "Admins can view own withdrawals" ON admin_withdrawals 
FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
    OR EXISTS (
        SELECT 1 FROM users 
        WHERE email = auth.jwt() ->> 'email' 
        AND role IN ('super_admin', 'Super Admin')
    )
);

DROP POLICY IF EXISTS "Admins can insert withdrawals" ON admin_withdrawals;
CREATE POLICY "Admins can insert withdrawals" ON admin_withdrawals 
FOR INSERT WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id IN (SELECT id FROM users WHERE email = auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Super admins can update withdrawals" ON admin_withdrawals;
CREATE POLICY "Super admins can update withdrawals" ON admin_withdrawals 
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE email = auth.jwt() ->> 'email' 
        AND role IN ('super_admin', 'Super Admin')
    )
);

-- 6. INDEX UNTUK PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_admin_bank_accounts_user_id ON admin_bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_withdrawals_user_id ON admin_withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_withdrawals_status ON admin_withdrawals(status);

-- DONE!
SELECT 'Admin withdrawal tables created successfully!' as status;
