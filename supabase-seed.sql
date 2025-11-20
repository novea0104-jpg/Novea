-- Novea Sample Data for Supabase
-- Run this AFTER creating the schema (supabase-schema.sql)

-- Insert sample novels
INSERT INTO novels (title, author, genre, description, status, rating, total_chapters, free_chapters, chapter_price, total_reads) VALUES
('The Last Kingdom', 'Bernard Cornwell', 'Fantasy', 'An epic tale of war, loyalty, and destiny in medieval England.', 'completed', 92, 45, 5, 10, 1523),
('Midnight Mystery', 'Agatha Christie', 'Mystery', 'A detective''s quest to solve the most puzzling murder case of the century.', 'ongoing', 88, 30, 5, 10, 982),
('Hearts Entwined', 'Nicholas Sparks', 'Romance', 'A love story that transcends time and space.', 'ongoing', 85, 25, 5, 10, 745),
('Cyber Horizon', 'William Gibson', 'Sci-Fi', 'In a dystopian future, humanity''s last hope lies in virtual reality.', 'ongoing', 90, 35, 5, 10, 1234),
('The Silent Killer', 'James Patterson', 'Thriller', 'A serial killer stalks the streets of New York. Only one detective can stop them.', 'ongoing', 87, 28, 5, 10, 867);

-- Helper function to generate chapters for a novel
DO $$
DECLARE
  novel_record RECORD;
  i INTEGER;
BEGIN
  -- Loop through all novels
  FOR novel_record IN SELECT id, total_chapters, free_chapters, chapter_price, title FROM novels LOOP
    -- Create chapters for this novel
    FOR i IN 1..novel_record.total_chapters LOOP
      INSERT INTO chapters (novel_id, chapter_number, title, content, word_count, is_free, price)
      VALUES (
        novel_record.id,
        i,
        CASE 
          WHEN i <= 5 THEN 'Chapter ' || i || ': Introduction'
          ELSE 'Chapter ' || i || ': The Journey Continues'
        END,
        'This is the content of chapter ' || i || '. ' ||
        CASE 
          WHEN i <= novel_record.free_chapters THEN 'This chapter is free to read!'
          ELSE 'This is a premium chapter. Unlock with coins to continue reading.'
        END || E'\n\n' ||
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. ' ||
        'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        500 + floor(random() * 1000)::INTEGER,
        i <= novel_record.free_chapters,
        CASE WHEN i <= novel_record.free_chapters THEN 0 ELSE novel_record.chapter_price END
      );
    END LOOP;
    
    RAISE NOTICE 'Created % chapters for novel: %', novel_record.total_chapters, novel_record.title;
  END LOOP;
END $$;

-- Verify the seeded data
SELECT 
  'Novels' as table_name,
  COUNT(*) as row_count
FROM novels
UNION ALL
SELECT 
  'Chapters' as table_name,
  COUNT(*) as row_count
FROM chapters;

-- Show summary
SELECT 
  n.title,
  n.genre,
  n.total_chapters,
  COUNT(c.id) as created_chapters,
  COUNT(CASE WHEN c.is_free THEN 1 END) as free_chapters,
  COUNT(CASE WHEN NOT c.is_free THEN 1 END) as paid_chapters
FROM novels n
LEFT JOIN chapters c ON n.id = c.novel_id
GROUP BY n.id, n.title, n.genre, n.total_chapters
ORDER BY n.id;
