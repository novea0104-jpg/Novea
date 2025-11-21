-- ========================================
-- CORRECT RLS POLICY FOR FK VALIDATION
-- ========================================
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/aqhoqcyespikebuatbmp/sql
-- ========================================

-- DROP old policy if exists (might fail if doesn't exist, that's OK)
DROP POLICY IF EXISTS "allow_authenticated_select" ON public.users;

-- Create CORRECT policy that allows authenticated users to SELECT any user
-- This is required for FK validation (novels.author_id → users.id)
CREATE POLICY "allow_select_for_fk_validation" 
ON public.users 
FOR SELECT 
TO authenticated
USING (true);

-- Also allow users to SELECT their own row by email
CREATE POLICY "allow_select_own_profile" 
ON public.users 
FOR SELECT 
TO authenticated
USING (email = auth.email());

-- ========================================
-- VERIFICATION
-- ========================================
SELECT 
    schemaname,
    tablename, 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;
