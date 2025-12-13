import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aqhoqcyespikebuatbmp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxaG9xY3llc3Bpa2VidWF0Ym1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mzg3ODksImV4cCI6MjA3OTIxNDc4OX0.YpzzzAwEewbwDihxZ9d-mTZJzoxN8mGQC-z_nd-ecUY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type UserRole = 'pembaca' | 'penulis' | 'editor' | 'co_admin' | 'super_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  isWriter: boolean;
  role: UserRole;
  coinBalance: number;
  avatarUrl?: string;
  bio?: string;
}

export interface Novel {
  id: number;
  title: string;
  author_id: number;
  author_name?: string;
  cover_image?: string;
  genre: string;
  status: string;
  synopsis: string;
  coin_per_chapter: number;
  free_chapters: number;
  total_chapters: number;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: number;
  novel_id: number;
  chapter_number: number;
  title: string;
  content: string;
  is_free: boolean;
  published_at: string;
  word_count: number;
  price: number;
}
