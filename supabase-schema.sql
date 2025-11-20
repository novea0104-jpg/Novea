-- Novea Database Schema for Supabase
-- Run this SQL in Supabase SQL Editor to create all tables

-- Enable UUID extension (optional, for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_writer BOOLEAN DEFAULT FALSE NOT NULL,
  coin_balance INTEGER DEFAULT 100 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Novels table
CREATE TABLE novels (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  author_id INTEGER REFERENCES users(id),
  genre VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  cover_url VARCHAR(500),
  status VARCHAR(50) DEFAULT 'ongoing' NOT NULL,
  rating INTEGER DEFAULT 0 NOT NULL,
  total_chapters INTEGER DEFAULT 0 NOT NULL,
  free_chapters INTEGER DEFAULT 5 NOT NULL,
  chapter_price INTEGER DEFAULT 10 NOT NULL,
  total_reads INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Chapters table
CREATE TABLE chapters (
  id SERIAL PRIMARY KEY,
  novel_id INTEGER REFERENCES novels(id) NOT NULL,
  chapter_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0 NOT NULL,
  is_free BOOLEAN DEFAULT FALSE NOT NULL,
  price INTEGER DEFAULT 10 NOT NULL,
  published_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Reading Progress table
CREATE TABLE reading_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  novel_id INTEGER REFERENCES novels(id) NOT NULL,
  chapter_id INTEGER REFERENCES chapters(id) NOT NULL,
  progress INTEGER DEFAULT 0 NOT NULL,
  last_read_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Unlocked Chapters table
CREATE TABLE unlocked_chapters (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  chapter_id INTEGER REFERENCES chapters(id) NOT NULL,
  novel_id INTEGER REFERENCES novels(id) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Following Novels table
CREATE TABLE following_novels (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  novel_id INTEGER REFERENCES novels(id) NOT NULL,
  followed_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Coin Transactions table
CREATE TABLE coin_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_chapters_novel_id ON chapters(novel_id);
CREATE INDEX idx_reading_progress_user_id ON reading_progress(user_id);
CREATE INDEX idx_unlocked_chapters_user_id ON unlocked_chapters(user_id);
CREATE INDEX idx_following_novels_user_id ON following_novels(user_id);
CREATE INDEX idx_coin_transactions_user_id ON coin_transactions(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_novels_updated_at BEFORE UPDATE ON novels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - Important for Supabase!
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlocked_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE following_novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Users can read their own data and update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Novels: Everyone can read novels
CREATE POLICY "Novels are viewable by everyone" ON novels
  FOR SELECT USING (true);

-- Chapters: Everyone can read chapters
CREATE POLICY "Chapters are viewable by everyone" ON chapters
  FOR SELECT USING (true);

-- Reading Progress: Users can manage their own reading progress
CREATE POLICY "Users can view own reading progress" ON reading_progress
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own reading progress" ON reading_progress
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own reading progress" ON reading_progress
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Unlocked Chapters: Users can view and manage their own unlocked chapters
CREATE POLICY "Users can view own unlocked chapters" ON unlocked_chapters
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own unlocked chapters" ON unlocked_chapters
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Following Novels: Users can manage their own follows
CREATE POLICY "Users can view own following novels" ON following_novels
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own following novels" ON following_novels
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own following novels" ON following_novels
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- Coin Transactions: Users can view their own transactions
CREATE POLICY "Users can view own coin transactions" ON coin_transactions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own coin transactions" ON coin_transactions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
