'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, Novel, Chapter } from '@/lib/supabase';
import Link from 'next/link';

export default function ChaptersPage() {
  const router = useRouter();
  const params = useParams();
  const novelId = params.id as string;
  
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [novelId]);

  async function loadData() {
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

      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .eq('novel_id', novelId)
        .order('chapter_number', { ascending: true });

      setChapters(chaptersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteChapter(chapterId: number) {
    if (!confirm('Yakin ingin menghapus bab ini?')) return;

    try {
      await supabase.from('chapters').delete().eq('id', chapterId);
      setChapters(chapters.filter(c => c.id !== chapterId));
      
      if (novel) {
        await supabase
          .from('novels')
          .update({ total_chapters: chapters.length - 1 })
          .eq('id', novel.id);
      }
    } catch (error) {
      console.error('Error deleting chapter:', error);
      alert('Gagal menghapus bab');
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Memuat...</p>
      </div>
    );
  }

  if (!novel) return null;

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
        <Link href="/novels" className="text-secondary" style={{ display: 'block', marginBottom: 16 }}>
          &larr; Kembali ke Novel Saya
        </Link>

        <div className="card mb-6">
          <div className="flex gap-4 items-center">
            {novel.cover_image ? (
              <img
                src={novel.cover_image}
                alt={novel.title}
                style={{ width: 80, height: 120, borderRadius: 8, objectFit: 'cover' }}
              />
            ) : (
              <div style={{ width: 80, height: 120, borderRadius: 8, background: '#2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 32 }}>N</span>
              </div>
            )}
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700 }}>{novel.title}</h1>
              <p className="text-muted">{novel.genre} | {novel.status}</p>
              <p className="text-secondary" style={{ marginTop: 4 }}>{chapters.length} Bab</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 style={{ fontSize: 20, fontWeight: 600 }}>Daftar Bab</h2>
          <Link href={`/novels/${novelId}/chapters/new`} className="btn btn-primary">
            + Bab Baru
          </Link>
        </div>

        {chapters.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <p className="text-secondary mb-4">Novel ini belum punya bab.</p>
            <Link href={`/novels/${novelId}/chapters/new`} className="btn btn-primary">
              Tulis Bab Pertama
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {chapters.map((chapter) => (
              <div key={chapter.id} className="card" style={{ padding: 16 }}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>
                      Bab {chapter.chapter_number}: {chapter.title}
                    </h3>
                    <p className="text-muted" style={{ fontSize: 13 }}>
                      {chapter.word_count} kata | {chapter.is_free ? 'Gratis' : `${chapter.price} Novoin`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/novels/${novelId}/chapters/${chapter.id}/edit`}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: 13 }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteChapter(chapter.id)}
                      className="btn btn-danger"
                      style={{ padding: '6px 12px', fontSize: 13 }}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
