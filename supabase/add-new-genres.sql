-- Add 7 new genres to the genres table
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

INSERT INTO genres (name, slug, icon, gradient_start, gradient_end)
VALUES 
  ('Chicklit', 'chicklit', 'heart', '#F472B6', '#EC4899'),
  ('Teenlit', 'teenlit', 'star', '#34D399', '#10B981'),
  ('Apocalypse', 'apocalypse', 'zap', '#78350F', '#451A03'),
  ('Pernikahan', 'pernikahan', 'heart', '#FB7185', '#F43F5E'),
  ('Sistem', 'sistem', 'cpu', '#22D3EE', '#0891B2'),
  ('Urban', 'urban', 'compass', '#64748B', '#475569'),
  ('Fanfiction', 'fanfiction', 'star', '#C084FC', '#A855F7')
ON CONFLICT (slug) DO NOTHING;

-- Verify the genres were added
SELECT * FROM genres ORDER BY id;
