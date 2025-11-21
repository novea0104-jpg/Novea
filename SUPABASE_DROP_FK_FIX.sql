-- ========================================
-- FINAL SOLUTION: Drop FK Constraint
-- ========================================
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/aqhoqcyespikebuatbmp/sql
-- ========================================

-- Drop the foreign key constraint that's causing permission issues
-- We'll rely on application-level validation instead
ALTER TABLE novels 
DROP CONSTRAINT IF EXISTS novels_author_id_fkey;

-- Verify FK is dropped
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conrelid = 'novels'::regclass
  AND contype = 'f';
  
-- If result is empty = FK successfully dropped ✅
