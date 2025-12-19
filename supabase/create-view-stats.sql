-- Tabel untuk menyimpan statistik view count per novel
-- Lebih scalable daripada menghitung semua rows di novel_views

-- 1. Buat tabel novel_view_stats
CREATE TABLE IF NOT EXISTS novel_view_stats (
    novel_id INTEGER PRIMARY KEY REFERENCES novels(id) ON DELETE CASCADE,
    view_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Buat function untuk increment view count
CREATE OR REPLACE FUNCTION increment_novel_view_count()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO novel_view_stats (novel_id, view_count, updated_at)
    VALUES (NEW.novel_id, 1, NOW())
    ON CONFLICT (novel_id) 
    DO UPDATE SET 
        view_count = novel_view_stats.view_count + 1,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Buat trigger untuk auto-update saat ada view baru
DROP TRIGGER IF EXISTS trigger_increment_view_count ON novel_views;
CREATE TRIGGER trigger_increment_view_count
    AFTER INSERT ON novel_views
    FOR EACH ROW
    EXECUTE FUNCTION increment_novel_view_count();

-- 4. Backfill data dari novel_views yang sudah ada
INSERT INTO novel_view_stats (novel_id, view_count, updated_at)
SELECT novel_id, COUNT(*) as view_count, MAX(viewed_at) as updated_at
FROM novel_views
GROUP BY novel_id
ON CONFLICT (novel_id) 
DO UPDATE SET 
    view_count = EXCLUDED.view_count,
    updated_at = EXCLUDED.updated_at;

-- 5. Enable RLS dan buat policy
ALTER TABLE novel_view_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read view stats" ON novel_view_stats
    FOR SELECT USING (true);

-- Verifikasi
SELECT 'novel_view_stats created successfully' as status;
SELECT COUNT(*) as total_novels_with_stats FROM novel_view_stats;
