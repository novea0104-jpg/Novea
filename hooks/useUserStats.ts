import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface UserStats {
  novelsRead: number;
  chaptersRead: number;
  dayStreak: number;
}

export function useUserStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    novelsRead: 0,
    chaptersRead: 0,
    dayStreak: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStats({ novelsRead: 0, chaptersRead: 0, dayStreak: 0 });
      setIsLoading(false);
      return;
    }

    fetchUserStats();
  }, [user]);

  async function fetchUserStats() {
    if (!user) return;

    setIsLoading(true);

    try {
      // Get database user ID from AuthContext (already loaded from users table)
      // user.id is the INTEGER id from our users table, NOT the Supabase Auth UUID
      const dbUserId = parseInt(user.id);
      
      if (isNaN(dbUserId)) {
        console.error('Invalid user ID:', user.id);
        setStats({ novelsRead: 0, chaptersRead: 0, dayStreak: 0 });
        setIsLoading(false);
        return;
      }
      
      console.log('Fetching stats for user ID:', dbUserId);

      // Get unique novels read from reading_progress
      const { data: novelsData, error: novelsError } = await supabase
        .from('reading_progress')
        .select('novel_id')
        .eq('user_id', dbUserId);

      if (novelsError) {
        // Silently handle error - RLS might be blocking
        setStats({ novelsRead: 0, chaptersRead: 0, dayStreak: 0 });
        setIsLoading(false);
        return;
      }

      const uniqueNovels = new Set(novelsData?.map((item) => item.novel_id) || []);
      const novelsRead = uniqueNovels.size;

      // Get total chapters read from reading_progress
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('reading_progress')
        .select('chapter_id')
        .eq('user_id', dbUserId);

      if (chaptersError) {
        // Silently handle error - RLS might be blocking
        setStats({ novelsRead, chaptersRead: 0, dayStreak: 0 });
        setIsLoading(false);
        return;
      }

      const chaptersRead = chaptersData?.length || 0;

      // Calculate day streak (for now, return 0 - will implement later)
      // TODO: Implement streak calculation based on last_read_at timestamps
      const dayStreak = 0;

      setStats({
        novelsRead,
        chaptersRead,
        dayStreak,
      });
    } catch (error) {
      // Silently handle error - don't spam console
      setStats({ novelsRead: 0, chaptersRead: 0, dayStreak: 0 });
    } finally {
      setIsLoading(false);
    }
  }

  return { stats, isLoading, refetch: fetchUserStats };
}
