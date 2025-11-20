-- Add Role System to Novea
-- Run this SQL in Supabase SQL Editor to add 5 role system

-- Step 1: Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'pembaca' NOT NULL;

-- Step 2: Create check constraint for valid roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('pembaca', 'penulis', 'editor', 'co_admin', 'super_admin'));

-- Step 3: Migrate existing is_writer data to role
-- (If user is writer, set role to 'penulis', otherwise keep 'pembaca')
UPDATE users 
SET role = CASE 
  WHEN is_writer = true THEN 'penulis'
  ELSE 'pembaca'
END
WHERE role = 'pembaca';

-- Step 4: Add index for faster role queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Note: We're keeping is_writer column for backward compatibility
-- New code should use 'role' field instead

-- Role Hierarchy:
-- 1. pembaca (default) - Regular reader
-- 2. penulis - Writer who can create novels
-- 3. editor - Can edit and moderate content
-- 4. co_admin - Has admin privileges
-- 5. super_admin - Full system access
