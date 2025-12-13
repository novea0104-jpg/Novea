'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, User } from '@/lib/supabase';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single();
      
      if (profile) {
        const userData = {
          id: profile.id.toString(),
          name: profile.name,
          email: profile.email,
          isWriter: profile.is_writer,
          role: profile.role || 'pembaca',
          coinBalance: profile.coin_balance,
          avatarUrl: profile.avatar_url,
          bio: profile.bio,
        };
        setUser(userData);
        setName(profile.name);
        setBio(profile.bio || '');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('users')
        .update({ name, bio })
        .eq('id', parseInt(user.id));

      if (error) throw error;

      setUser({ ...user, name, bio });
      setEditing(false);
      setMessage('Profil berhasil diperbarui!');
    } catch (err: any) {
      setMessage('Gagal menyimpan: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpgradeToWriter() {
    if (!user || user.role !== 'pembaca') return;
    
    try {
      const { data, error } = await supabase.rpc('upgrade_user_to_writer');
      if (error) throw error;
      
      setUser({
        ...user,
        role: 'penulis',
        isWriter: true,
      });
      setMessage('Selamat! Kamu sekarang adalah Penulis Novea!');
    } catch (err: any) {
      setMessage('Gagal upgrade: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p>Memuat...</p>
      </div>
    );
  }

  if (!user) return null;

  const roleLabel: Record<string, string> = {
    pembaca: 'Pembaca',
    penulis: 'Penulis',
    editor: 'Editor',
    co_admin: 'Co-Admin',
    super_admin: 'Super Admin',
  };

  return (
    <>
      <header className="header">
        <div className="container header-content">
          <Link href="/" className="logo">Novea</Link>
          <nav className="nav-links">
            <Link href="/profile" className="nav-link active">Profil</Link>
            <Link href="/novels" className="nav-link">Novel Saya</Link>
          </nav>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>
        <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div style={{ flex: 1 }}>
              {editing ? (
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama"
                />
              ) : (
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>{user.name}</h1>
              )}
              <p className="text-secondary">{user.email}</p>
              <span className={`badge badge-${user.role === 'penulis' ? 'penulis' : 'pembaca'}`}>
                {roleLabel[user.role] || user.role}
              </span>
            </div>
          </div>

          {editing ? (
            <div className="form-group">
              <label className="label">Bio</label>
              <textarea
                className="input textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ceritakan tentang dirimu..."
                rows={4}
              />
            </div>
          ) : (
            user.bio && (
              <p className="text-secondary mb-6">{user.bio}</p>
            )
          )}

          <div className="flex gap-2 mb-4">
            <div className="card" style={{ flex: 1, textAlign: 'center', padding: 16 }}>
              <p style={{ fontSize: 24, fontWeight: 700 }}>{user.coinBalance}</p>
              <p className="text-muted" style={{ fontSize: 14 }}>Novoin</p>
            </div>
          </div>

          {message && (
            <p className={message.includes('Gagal') ? 'error-text mb-4' : 'success-text mb-4'}>
              {message}
            </p>
          )}

          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                <button onClick={() => { setEditing(false); setName(user.name); setBio(user.bio || ''); }} className="btn btn-secondary">
                  Batal
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="btn btn-secondary">
                  Edit Profil
                </button>
                {user.role === 'pembaca' && (
                  <button onClick={handleUpgradeToWriter} className="btn btn-primary">
                    Menjadi Penulis
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
