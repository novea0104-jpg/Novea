-- =====================================================
-- FITUR PILIHAN EDITOR - Kelola novel yang tampil di home
-- Copy-paste ke Supabase > SQL Editor > RUN
-- =====================================================

-- Tabel untuk menyimpan novel pilihan editor
CREATE TABLE IF NOT EXISTS editors_choice (
    id SERIAL PRIMARY KEY,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    added_by INTEGER NOT NULL REFERENCES users(id),
    display_order INTEGER DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(novel_id)
);

-- Matikan RLS agar bisa akses dari app
ALTER TABLE editors_choice DISABLE ROW LEVEL SECURITY;

-- Index untuk ordering
CREATE INDEX IF NOT EXISTS idx_editors_choice_order ON editors_choice(display_order ASC);

-- Function untuk menambah novel ke pilihan editor
CREATE OR REPLACE FUNCTION add_to_editors_choice(
    p_admin_id INTEGER,
    p_novel_id INTEGER,
    p_display_order INTEGER DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_role TEXT;
BEGIN
    -- Check if user is admin/editor
    SELECT role INTO v_admin_role FROM users WHERE id = p_admin_id;
    
    IF v_admin_role NOT IN ('editor', 'co_admin', 'super_admin') THEN
        RETURN '{"success":false,"error":"Tidak memiliki izin"}'::json;
    END IF;
    
    -- Check if novel exists
    IF NOT EXISTS (SELECT 1 FROM novels WHERE id = p_novel_id) THEN
        RETURN '{"success":false,"error":"Novel tidak ditemukan"}'::json;
    END IF;
    
    -- Check if already in editors choice
    IF EXISTS (SELECT 1 FROM editors_choice WHERE novel_id = p_novel_id) THEN
        RETURN '{"success":false,"error":"Novel sudah ada di Pilihan Editor"}'::json;
    END IF;
    
    -- Add to editors choice
    INSERT INTO editors_choice (novel_id, added_by, display_order)
    VALUES (p_novel_id, p_admin_id, p_display_order);
    
    RETURN '{"success":true}'::json;
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function untuk menghapus novel dari pilihan editor
CREATE OR REPLACE FUNCTION remove_from_editors_choice(
    p_admin_id INTEGER,
    p_novel_id INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_role TEXT;
BEGIN
    -- Check if user is admin/editor
    SELECT role INTO v_admin_role FROM users WHERE id = p_admin_id;
    
    IF v_admin_role NOT IN ('editor', 'co_admin', 'super_admin') THEN
        RETURN '{"success":false,"error":"Tidak memiliki izin"}'::json;
    END IF;
    
    -- Remove from editors choice
    DELETE FROM editors_choice WHERE novel_id = p_novel_id;
    
    RETURN '{"success":true}'::json;
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function untuk update urutan tampilan
CREATE OR REPLACE FUNCTION update_editors_choice_order(
    p_admin_id INTEGER,
    p_novel_id INTEGER,
    p_new_order INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_role TEXT;
BEGIN
    -- Check if user is admin/editor
    SELECT role INTO v_admin_role FROM users WHERE id = p_admin_id;
    
    IF v_admin_role NOT IN ('editor', 'co_admin', 'super_admin') THEN
        RETURN '{"success":false,"error":"Tidak memiliki izin"}'::json;
    END IF;
    
    -- Update order
    UPDATE editors_choice SET display_order = p_new_order WHERE novel_id = p_novel_id;
    
    RETURN '{"success":true}'::json;
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION add_to_editors_choice(INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_from_editors_choice(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_editors_choice_order(INTEGER, INTEGER, INTEGER) TO authenticated;

SELECT 'DONE! Tabel editors_choice sudah dibuat.' as result;
