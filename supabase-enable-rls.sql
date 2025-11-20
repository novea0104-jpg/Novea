-- Enable Row Level Security (RLS) on all tables
-- Run this in Supabase SQL Editor to fix permission errors

-- Enable RLS on users table (required for stats queries to work)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on all other tables for security
ALTER TABLE novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocked_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE following_novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to novels and chapters (anyone can browse)
DROP POLICY IF EXISTS "Anyone can view novels" ON novels;
CREATE POLICY "Anyone can view novels" ON novels
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view chapters" ON chapters;
CREATE POLICY "Anyone can view chapters" ON chapters
  FOR SELECT USING (true);

-- Writers can insert/update their own novels
DROP POLICY IF EXISTS "Writers can manage own novels" ON novels;
CREATE POLICY "Writers can manage own novels" ON novels
  FOR ALL USING (
    author_id = (SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Writers can manage chapters for their own novels
DROP POLICY IF EXISTS "Writers can manage own chapters" ON chapters;
CREATE POLICY "Writers can manage own chapters" ON chapters
  FOR ALL USING (
    novel_id IN (
      SELECT id FROM novels WHERE author_id = (
        SELECT id FROM users WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

-- Verification query
SELECT 
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'novels', 'chapters', 'reading_progress', 'unlocked_chapters', 'following_novels', 'coin_transactions')
ORDER BY tablename;

-- Expected output: All tables should have "RLS Enabled" = true
