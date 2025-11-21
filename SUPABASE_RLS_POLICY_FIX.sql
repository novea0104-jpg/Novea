-- ========================================
-- RLS POLICY FIX: Allow SELECT for FK validation
-- ========================================
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/aqhoqcyespikebuatbmp/sql
-- ========================================

-- Create SELECT policy on users table
-- This allows authenticated users to SELECT from users table
-- Required for FK validation when creating novels (novels.author_id → users.id)
CREATE POLICY "allow_authenticated_select" 
ON public.users 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- ========================================
-- VERIFICATION: Check if policy is created
-- ========================================
SELECT 
    schemaname,
    tablename, 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users';
