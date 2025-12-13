'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const GENRES = ['Romance', 'Fantasy', 'Thriller', 'Mystery', 'Adventure', 'Drama', 'Comedy', 'Horror', 'Sci-Fi', 'Slice of Life'];
const STATUSES = ['On-Going', 'Completed'];

export default function NewNovelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState('');
  
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [genre, setGenre] = useState('Romance');
  const [status, setStatus] = useState('On-Going');
  const [coinPerChapter, setCoinPerChapter] = useState(5);
  const [freeChapters, setFreeChapters] = useState(3);
  const [coverUrl, setCoverUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('users')
      .select('id, name, role')
      .eq('email', session.user.email)
      .single();

    if (!profile || profile.role === 'pembaca') {
      router.push('/profile');
      return;
    }

    setUserId(profile.id);
    setUserName(profile.name);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    setError('');

    try {
      const { data, error: insertError } = await supabase
        .from('novels')
        .insert({
          title,
          synopsis,
          genre,
          status,
          author_id: userId,
          author_name: userName,
          cover_image: coverUrl || null,
          coin_per_chapter: coinPerChapter,
          free_chapters: freeChapters,
          total_chapters: 0,
          rating: 0,
          rating_count: 0,
          followers: 0,
          total_likes: 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/novels/${data.id}/chapters`);
    } catch (err: any) {
      setError(err.message || 'Gagal membuat novel');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="header">
        <div className="container header-content">
          <Link href="/" className="logo">Novea</Link>
          <nav className="nav-links">
            <Link href="/profile" className="nav-link">Profil</Link>
            <Link href="/novels" className="nav-link">Novel Saya</Link>
          </nav>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Link href="/novels" className="text-secondary" style={{ display: 'block', marginBottom: 16 }}>
            &larr; Kembali ke Novel Saya
          </Link>

          <div className="card">
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Buat Novel Baru</h1>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Judul Novel *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Masukkan judul novel"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Sinopsis *</label>
                <textarea
                  className="input textarea"
                  placeholder="Ceritakan tentang novelmu..."
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  required
                  rows={5}
                />
              </div>

              <div className="form-group">
                <label className="label">URL Cover (opsional)</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://example.com/cover.jpg"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="label">Genre</label>
                  <select className="select" value={genre} onChange={(e) => setGenre(e.target.value)}>
                    {GENRES.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Status</label>
                  <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="label">Harga per Bab (Novoin)</label>
                  <input
                    type="number"
                    className="input"
                    min={0}
                    value={coinPerChapter}
                    onChange={(e) => setCoinPerChapter(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Bab Gratis</label>
                  <input
                    type="number"
                    className="input"
                    min={0}
                    value={freeChapters}
                    onChange={(e) => setFreeChapters(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              {error && <p className="error-text mb-4">{error}</p>}

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Buat Novel'}
                </button>
                <Link href="/novels" className="btn btn-secondary">
                  Batal
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
