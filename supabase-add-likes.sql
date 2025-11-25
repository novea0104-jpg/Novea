-- Create novel_likes table
CREATE TABLE IF NOT EXISTS novel_likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  novel_id INTEGER NOT NULL REFERENCES novels(id),
  liked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, novel_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_novel_likes_user_id ON novel_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_novel_likes_novel_id ON novel_likes(novel_id);

-- Enable RLS (disabled for now, uncomment when ready for production)
-- ALTER TABLE novel_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policy for novel_likes (uncomment when enabling RLS)
-- CREATE POLICY "Users can manage own likes" ON novel_likes
--   FOR ALL USING (user_id = current_user_id())
--   WITH CHECK (user_id = current_user_id());

-- Public read access for like counts
-- CREATE POLICY "Anyone can view likes" ON novel_likes
--   FOR SELECT USING (true);
