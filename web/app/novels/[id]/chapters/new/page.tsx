'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, Novel } from '@/lib/supabase';
import Link from 'next/link';

export default function NewChapterPage() {
  const router = useRouter();
  const params = useParams();
  const novelId = params.id as string;
  
  const [novel, setNovel] = useState<Novel | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [error, setError] = useState('');
  const [nextChapterNumber, setNextChapterNumber] = useState(1);

  useEffect(() => {
    checkAuth();
  }, [novelId]);

  async function checkAuth() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('email', session.user.email)
        .single();

      if (!profile) {
        router.push('/login');
        return;
      }

      const { data: novelData } = await supabase
        .from('novels')
        .select('*')
        .eq('id', novelId)
        .eq('author_id', profile.id)
        .single();

      if (!novelData) {
        router.push('/novels');
        return;
      }

      setNovel(novelData);

      const { data: lastChapter } = await supabase
        .from('chapters')
        .select('chapter_number')
        .eq('novel_id', novelId)
        .order('chapter_number', { ascending: false })
        .limit(1)
        .single();

      setNextChapterNumber(lastChapter ? lastChapter.chapter_number + 1 : 1);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setCheckingAuth(false);
    }
  }

  function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!novel) return;

    setLoading(true);
    setError('');

    try {
      const wordCount = countWords(content);
      const price = isFree ? 0 : novel.coin_per_chapter;

      const { error: insertError } = await supabase
        .from('chapters')
        .insert({
          novel_id: parseInt(novelId),
          chapter_number: nextChapterNumber,
          title,
          content,
          is_free: isFree || nextChapterNumber <= novel.free_chapters,
          word_count: wordCount,
          price,
          published_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      await supabase
        .from('novels')
        .update({ 
          total_chapters: nextChapterNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', novel.id);

      router.push(`/novels/${novelId}/chapters`);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan bab');
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Memuat...</p>
      </div>
    );
  }

  if (!novel) return null;

  const wordCount = countWords(content);

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
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Link href={`/novels/${novelId}/chapters`} className="text-secondary" style={{ display: 'block', marginBottom: 16 }}>
            &larr; Kembali ke {novel.title}
          </Link>

          <div className="card">
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              Tulis Bab Baru
            </h1>
            <p className="text-secondary mb-6">
              Bab {nextChapterNumber} untuk "{novel.title}"
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Judul Bab *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Masukkan judul bab"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">
                  Konten Bab * 
                  <span className="text-muted" style={{ fontWeight: 400, marginLeft: 8 }}>
                    ({wordCount} kata)
                  </span>
                </label>
                <textarea
                  className="input"
                  placeholder="Tulis konten bab di sini..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  style={{ minHeight: 400, fontFamily: 'Georgia, serif', lineHeight: 1.8 }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={(e) => setIsFree(e.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                  <span>Jadikan bab ini gratis</span>
                </label>
                {nextChapterNumber <= novel.free_chapters && !isFree && (
                  <p className="text-muted" style={{ marginTop: 4, fontSize: 13 }}>
                    Bab ini akan otomatis gratis (bab ke-{nextChapterNumber} dari {novel.free_chapters} bab gratis)
                  </p>
                )}
              </div>

              {error && <p className="error-text mb-4">{error}</p>}

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Publikasikan Bab'}
                </button>
                <Link href={`/novels/${novelId}/chapters`} className="btn btn-secondary">
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
