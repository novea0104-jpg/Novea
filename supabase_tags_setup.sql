-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create novel_tags junction table
CREATE TABLE IF NOT EXISTS novel_tags (
  id SERIAL PRIMARY KEY,
  novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(novel_id, tag_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_novel_tags_novel_id ON novel_tags(novel_id);
CREATE INDEX IF NOT EXISTS idx_novel_tags_tag_id ON novel_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);

-- Insert all tags
INSERT INTO tags (name, slug) VALUES
  ('CEO/Bos', 'ceo-bos'),
  ('ONS', 'ons'),
  ('Selingkuh', 'selingkuh'),
  ('Nikah Kontrak', 'nikah-kontrak'),
  ('Nikah Paksa', 'nikah-paksa'),
  ('Rumah Tangga', 'rumah-tangga'),
  ('Wanita Kuat', 'wanita-kuat'),
  ('Kriminal', 'kriminal'),
  ('Detektif', 'detektif'),
  ('Game', 'game'),
  ('Olahraga', 'olahraga'),
  ('Angst', 'angst'),
  ('Milyarder', 'milyarder'),
  ('Dewa Perang', 'dewa-perang'),
  ('Pendekar', 'pendekar'),
  ('Fantasi Timur', 'fantasi-timur'),
  ('Fantasi Barat', 'fantasi-barat'),
  ('Fantasi Urban', 'fantasi-urban'),
  ('Mafia', 'mafia'),
  ('Balas Dendam', 'balas-dendam'),
  ('Petualangan', 'petualangan'),
  ('Transmigrasi', 'transmigrasi'),
  ('Regresi', 'regresi'),
  ('Sihir', 'sihir'),
  ('Dark Romance', 'dark-romance'),
  ('Perbedaan Usia', 'perbedaan-usia'),
  ('Kerajaan', 'kerajaan'),
  ('Kesatria', 'kesatria'),
  ('Salah Paham', 'salah-paham'),
  ('Pengkhianatan', 'pengkhianatan'),
  ('Penyesalan', 'penyesalan'),
  ('Super Power', 'super-power'),
  ('Mantan', 'mantan'),
  ('Pengembangan Diri', 'pengembangan-diri'),
  ('Perjodohan', 'perjodohan'),
  ('Fiksi', 'fiksi'),
  ('Non-Fiksi', 'non-fiksi'),
  ('Sejarah', 'sejarah'),
  ('Independen', 'independen'),
  ('Ketegangan', 'ketegangan'),
  ('Tragedi', 'tragedi'),
  ('Relationship', 'relationship'),
  ('Cinta Sejati', 'cinta-sejati'),
  ('Soulmate', 'soulmate'),
  ('Badboy', 'badboy'),
  ('Playboy', 'playboy'),
  ('Playgirl', 'playgirl'),
  ('Dominan', 'dominan'),
  ('Manis', 'manis'),
  ('Cerdas', 'cerdas'),
  ('Time Travel', 'time-travel'),
  ('Bayi Genius', 'bayi-genius'),
  ('SMA', 'sma'),
  ('Reinkarnasi', 'reinkarnasi'),
  ('Benci Jadi Cinta', 'benci-jadi-cinta'),
  ('Vampir', 'vampir')
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE novel_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags (everyone can read)
CREATE POLICY "Anyone can read tags" ON tags
  FOR SELECT USING (true);

-- RLS Policies for novel_tags
CREATE POLICY "Anyone can read novel_tags" ON novel_tags
  FOR SELECT USING (true);

CREATE POLICY "Authors can manage their novel tags" ON novel_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM novels WHERE novels.id = novel_tags.novel_id AND novels.author_id = auth.uid()::text::integer
    )
  );
