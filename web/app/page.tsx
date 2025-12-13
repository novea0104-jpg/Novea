'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, User } from '@/lib/supabase';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('email', session.user.email)
          .single();
        
        if (profile) {
          setUser({
            id: profile.id.toString(),
            name: profile.name,
            email: profile.email,
            isWriter: profile.is_writer,
            role: profile.role || 'pembaca',
            coinBalance: profile.coin_balance,
            avatarUrl: profile.avatar_url,
            bio: profile.bio,
          });
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
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
            {user ? (
              <>
                <Link href="/profile" className="nav-link">Profil</Link>
                <Link href="/novels" className="nav-link">Novel Saya</Link>
                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px' }}>
                  Keluar
                </button>
              </>
            ) : (
              <Link href="/login" className="btn btn-primary" style={{ padding: '8px 16px' }}>
                Masuk
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 60, paddingBottom: 60 }}>
        {user ? (
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>
              Selamat datang, {user.name}!
            </h1>
            <p className="text-secondary mb-8">
              Kelola novel dan bab kamu dari dashboard web Novea.
            </p>
            
            <div className="flex gap-4">
              <Link href="/profile" className="btn btn-secondary">
                Lihat Profil
              </Link>
              <Link href="/novels" className="btn btn-primary">
                Kelola Novel
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', paddingTop: 100 }}>
            <h1 style={{ fontSize: 48, fontWeight: 700, marginBottom: 16 }}>
              <span style={{ background: 'linear-gradient(135deg, #8B5CF6, #EC4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Novea Indonesia
              </span>
            </h1>
            <p className="text-secondary" style={{ fontSize: 18, marginBottom: 32 }}>
              Platform untuk penulis mengelola novel dan bab dari web.
            </p>
            <Link href="/login" className="btn btn-primary" style={{ fontSize: 18, padding: '16px 32px' }}>
              Masuk untuk Mulai
            </Link>
          </div>
        )}
      </main>
    </>
  );
}
