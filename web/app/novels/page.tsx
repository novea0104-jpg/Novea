'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Novel } from '@/lib/supabase';
import Link from 'next/link';

export default function NovelsPage() {
  const router = useRouter();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    loadNovels();
  }, []);

  async function loadNovels() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', session.user.email)
        .single();

      if (!profile) {
        router.push('/login');
        return;
      }

      if (profile.role === 'pembaca') {
        router.push('/profile');
        return;
      }

      setUserId(profile.id);

      const { data: novelsData } = await supabase
        .from('novels')
        .select('*')
        .eq('author_id', profile.id)
        .order('created_at', { ascending: false });

      setNovels(novelsData || []);
    } catch (error) {
      console.error('Error loading novels:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(novelId: number) {
    if (!confirm('Yakin ingin menghapus novel ini?')) return;

    try {
      await supabase.from('chapters').delete().eq('novel_id', novelId);
      await supabase.from('novels').delete().eq('id', novelId);
      setNovels(novels.filter(n => n.id !== novelId));
    } catch (error) {
      console.error('Error deleting novel:', error);
      alert('Gagal menghapus novel');
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Memuat...</p>
      </div>
    );
  }

  return (
    <>
      <header className="header">
        <div className="container header-content">
          <Link href="/" className="logo">Novea</Link>
          <nav className="nav-links">
            <Link href="/profile" className="nav-link">Profil</Link>
            <Link href="/novels" className="nav-link active">Novel Saya</Link>
          </nav>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div className="flex justify-between items-center mb-6">
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>Novel Saya</h1>
          <Link href="/novels/new" className="btn btn-primary">
            + Novel Baru
          </Link>
        </div>

        {novels.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <p className="text-secondary mb-4">Kamu belum punya novel.</p>
            <Link href="/novels/new" className="btn btn-primary">
              Buat Novel Pertamamu
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap-4">
            {novels.map((novel) => (
              <div key={novel.id} className="card">
                <div style={{ display: 'flex', gap: 16 }}>
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
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{novel.title}</h3>
                    <p className="text-muted" style={{ fontSize: 14, marginBottom: 8 }}>
                      {novel.genre} | {novel.status}
                    </p>
                    <p className="text-secondary" style={{ fontSize: 13 }}>
                      {novel.total_chapters || 0} Bab
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Link href={`/novels/${novel.id}/chapters`} className="btn btn-secondary" style={{ flex: 1, padding: '8px 12px', fontSize: 14 }}>
                    Kelola Bab
                  </Link>
                  <button onClick={() => handleDelete(novel.id)} className="btn btn-danger" style={{ padding: '8px 12px', fontSize: 14 }}>
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
