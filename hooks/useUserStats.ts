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
      // Query by user_id matching user from database by email
      // This aligns with RLS policies that use email matching
      const userId = parseInt(user.id);

      // First verify the user exists and get their actual database ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (userError) {
        console.error('Error fetching user ID:', userError);
        setStats({ novelsRead: 0, chaptersRead: 0, dayStreak: 0 });
        return;
      }

      const dbUserId = userData.id;

      // Get unique novels read from reading_progress
      const { data: novelsData, error: novelsError } = await supabase
        .from('reading_progress')
        .select('novel_id')
        .eq('user_id', dbUserId);

      if (novelsError) throw novelsError;

      const uniqueNovels = new Set(novelsData?.map((item) => item.novel_id) || []);
      const novelsRead = uniqueNovels.size;

      // Get total chapters read from reading_progress
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('reading_progress')
        .select('chapter_id')
        .eq('user_id', dbUserId);

      if (chaptersError) throw chaptersError;

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
      console.error('Error fetching user stats:', error);
      setStats({ novelsRead: 0, chaptersRead: 0, dayStreak: 0 });
    } finally {
      setIsLoading(false);
    }
  }

  return { stats, isLoading, refetch: fetchUserStats };
}
