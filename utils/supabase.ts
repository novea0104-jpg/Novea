import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Supabase credentials
// NOTE: These are PUBLIC keys (anon key is safe to expose in client-side code)
// Row Level Security (RLS) in Supabase protects your data even with exposed anon key
const supabaseUrl = 'https://aqhoqcyespikebuatbmp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxaG9xY3llc3Bpa2VidWF0Ym1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mzg3ODksImV4cCI6MjA3OTIxNDc4OX0.YpzzzAwEewbwDihxZ9d-mTZJzoxN8mGQC-z_nd-ecUY';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials! Check Replit Secrets configuration.');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function to track novel view
export async function trackNovelView(userId: number, novelId: number): Promise<boolean> {
  try {
    // Try to insert a view record (will fail silently if already exists due to UNIQUE constraint)
    const { error } = await supabase
      .from('novel_views')
      .insert({ user_id: userId, novel_id: novelId });

    // If there's a unique constraint error, it means user already viewed this novel
    // That's fine - we just return true (view already counted)
    if (error && !error.message.includes('duplicate key')) {
      console.error('Error tracking novel view:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in trackNovelView:', error);
    return false;
  }
}

// Helper function to get view count for a novel
export async function getNovelViewCount(novelId: number): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('novel_views')
      .select('*', { count: 'exact', head: true })
      .eq('novel_id', novelId);

    if (error) {
      console.error('Error getting novel view count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getNovelViewCount:', error);
    return 0;
  }
}

// Helper function to toggle like for a novel
export async function toggleNovelLike(userId: number, novelId: number): Promise<{ isLiked: boolean; error?: string }> {
  try {
    const { data: existing } = await supabase
      .from('novel_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('novel_id', novelId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('novel_likes')
        .delete()
        .eq('user_id', userId)
        .eq('novel_id', novelId);

      if (error) throw error;
      return { isLiked: false };
    } else {
      const { error } = await supabase
        .from('novel_likes')
        .insert({ user_id: userId, novel_id: novelId });

      if (error) throw error;
      return { isLiked: true };
    }
  } catch (error: any) {
    console.error('Error toggling novel like:', error);
    return { isLiked: false, error: error.message };
  }
}

// Helper function to check if user liked a novel
export async function checkUserLikedNovel(userId: number, novelId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('novel_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('novel_id', novelId)
      .single();

    return !!data && !error;
  } catch (error) {
    return false;
  }
}

// Helper function to get like count for a novel
export async function getNovelLikeCount(novelId: number): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('novel_likes')
      .select('*', { count: 'exact', head: true })
      .eq('novel_id', novelId);

    if (error) {
      console.error('Error getting novel like count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getNovelLikeCount:', error);
    return 0;
  }
}

// Helper function to get follow count for a novel
export async function getNovelFollowCount(novelId: number): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('following_novels')
      .select('*', { count: 'exact', head: true })
      .eq('novel_id', novelId);

    if (error) {
      console.error('Error getting novel follow count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getNovelFollowCount:', error);
    return 0;
  }
}

// Helper function to get user's liked novels
export async function getUserLikedNovels(userId: number): Promise<Set<string>> {
  try {
    const { data, error } = await supabase
      .from('novel_likes')
      .select('novel_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting user liked novels:', error);
      return new Set();
    }

    return new Set((data || []).map(item => item.novel_id.toString()));
  } catch (error) {
    console.error('Error in getUserLikedNovels:', error);
    return new Set();
  }
}

// Database types (auto-generated by Supabase, but we define manually for now)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          email: string;
          name: string;
          is_writer: boolean;
          coin_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          email: string;
          name: string;
          is_writer?: boolean;
          coin_balance?: number;
        };
        Update: {
          email?: string;
          name?: string;
          is_writer?: boolean;
          coin_balance?: number;
        };
      };
      novels: {
        Row: {
          id: number;
          title: string;
          author: string;
          author_id: number | null;
          genre: string;
          description: string;
          cover_url: string | null;
          status: string;
          rating: number;
          total_chapters: number;
          free_chapters: number;
          chapter_price: number;
          total_reads: number;
          created_at: string;
          updated_at: string;
        };
      };
      chapters: {
        Row: {
          id: number;
          novel_id: number;
          chapter_number: number;
          title: string;
          content: string;
          word_count: number;
          is_free: boolean;
          price: number;
          published_at: string;
          created_at: string;
          updated_at: string;
        };
      };
      reading_progress: {
        Row: {
          id: number;
          user_id: number;
          novel_id: number;
          chapter_id: number;
          progress: number;
          last_read_at: string;
        };
      };
      unlocked_chapters: {
        Row: {
          id: number;
          user_id: number;
          chapter_id: number;
          novel_id: number;
          unlocked_at: string;
        };
      };
      following_novels: {
        Row: {
          id: number;
          user_id: number;
          novel_id: number;
          followed_at: string;
        };
      };
      coin_transactions: {
        Row: {
          id: number;
          user_id: number;
          amount: number;
          type: string;
          description: string | null;
          metadata: any;
          created_at: string;
        };
      };
      novel_views: {
        Row: {
          id: number;
          user_id: number;
          novel_id: number;
          viewed_at: string;
        };
        Insert: {
          user_id: number;
          novel_id: number;
        };
      };
      novel_reviews: {
        Row: {
          id: number;
          user_id: number;
          novel_id: number;
          rating: number;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: number;
          novel_id: number;
          rating: number;
          comment?: string | null;
        };
        Update: {
          rating?: number;
          comment?: string | null;
        };
      };
    };
  };
}

// Review types
export interface NovelReview {
  id: number;
  userId: number;
  novelId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  userName?: string;
  userAvatar?: string;
  userRole?: string;
  replies?: ReviewReply[];
}

// Review reply types
export interface ReviewReply {
  id: number;
  reviewId: number;
  userId: number;
  content: string;
  createdAt: string;
  userName?: string;
  userAvatar?: string;
  userRole?: string;
}

// Get reviews for a novel
export async function getNovelReviews(novelId: number): Promise<NovelReview[]> {
  try {
    const { data, error } = await supabase
      .from('novel_reviews')
      .select(`
        *,
        users:user_id (name, avatar_url, role)
      `)
      .eq('novel_id', novelId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting novel reviews:', error);
      return [];
    }

    return (data || []).map((review: any) => ({
      id: review.id,
      userId: review.user_id,
      novelId: review.novel_id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      userName: review.users?.name || 'Pengguna',
      userAvatar: review.users?.avatar_url,
      userRole: review.users?.role || 'Pembaca',
    }));
  } catch (error) {
    console.error('Error in getNovelReviews:', error);
    return [];
  }
}

// Get user's review for a novel
export async function getUserReview(userId: number, novelId: number): Promise<NovelReview | null> {
  try {
    const { data, error } = await supabase
      .from('novel_reviews')
      .select('*')
      .eq('user_id', userId)
      .eq('novel_id', novelId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      console.error('Error getting user review:', error);
      return null;
    }

    return data ? {
      id: data.id,
      userId: data.user_id,
      novelId: data.novel_id,
      rating: data.rating,
      comment: data.comment,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } : null;
  } catch (error) {
    console.error('Error in getUserReview:', error);
    return null;
  }
}

// Submit or update a review
export async function submitReview(
  userId: number,
  novelId: number,
  rating: number,
  comment?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user already has a review
    const existingReview = await getUserReview(userId, novelId);

    if (existingReview) {
      // Update existing review
      const { error } = await supabase
        .from('novel_reviews')
        .update({
          rating,
          comment: comment || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingReview.id);

      if (error) {
        console.error('Error updating review:', error);
        return { success: false, error: 'Gagal mengupdate ulasan' };
      }
    } else {
      // Insert new review
      const { error } = await supabase
        .from('novel_reviews')
        .insert({
          user_id: userId,
          novel_id: novelId,
          rating,
          comment: comment || null,
        });

      if (error) {
        console.error('Error inserting review:', error);
        return { success: false, error: 'Gagal menyimpan ulasan' };
      }
    }

    // Update novel's average rating
    await updateNovelAverageRating(novelId);

    return { success: true };
  } catch (error) {
    console.error('Error in submitReview:', error);
    return { success: false, error: 'Terjadi kesalahan' };
  }
}

// Delete a review
export async function deleteReview(reviewId: number, novelId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('novel_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      console.error('Error deleting review:', error);
      return false;
    }

    // Update novel's average rating
    await updateNovelAverageRating(novelId);

    return true;
  } catch (error) {
    console.error('Error in deleteReview:', error);
    return false;
  }
}

// Update novel's average rating
async function updateNovelAverageRating(novelId: number): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('novel_reviews')
      .select('rating')
      .eq('novel_id', novelId);

    if (error) {
      console.error('Error getting ratings:', error);
      return;
    }

    if (!data || data.length === 0) {
      // No reviews, set rating to 0
      await supabase
        .from('novels')
        .update({ rating: 0 })
        .eq('id', novelId);
      return;
    }

    const avgRating = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
    const roundedRating = Math.round(avgRating * 10) / 10;

    await supabase
      .from('novels')
      .update({ rating: roundedRating })
      .eq('id', novelId);
  } catch (error) {
    console.error('Error updating novel rating:', error);
  }
}

// Get rating stats for a novel
export async function getNovelRatingStats(novelId: number): Promise<{
  averageRating: number;
  totalReviews: number;
  distribution: { [key: number]: number };
}> {
  try {
    const { data, error } = await supabase
      .from('novel_reviews')
      .select('rating')
      .eq('novel_id', novelId);

    if (error || !data) {
      return { averageRating: 0, totalReviews: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    data.forEach(r => {
      sum += r.rating;
      distribution[r.rating as 1 | 2 | 3 | 4 | 5]++;
    });

    const averageRating = data.length > 0 ? Math.round((sum / data.length) * 10) / 10 : 0;

    return {
      averageRating,
      totalReviews: data.length,
      distribution,
    };
  } catch (error) {
    console.error('Error in getNovelRatingStats:', error);
    return { averageRating: 0, totalReviews: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }
}

// Get replies for all reviews of a novel (batch fetch to avoid N+1)
export async function getReviewRepliesForNovel(novelId: number): Promise<Map<number, ReviewReply[]>> {
  try {
    const { data, error } = await supabase
      .from('review_replies')
      .select(`
        *,
        users:user_id (name, avatar_url, role),
        novel_reviews!inner (novel_id)
      `)
      .eq('novel_reviews.novel_id', novelId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting review replies:', error);
      return new Map();
    }

    const repliesMap = new Map<number, ReviewReply[]>();
    
    (data || []).forEach((reply: any) => {
      const reviewReply: ReviewReply = {
        id: reply.id,
        reviewId: reply.review_id,
        userId: reply.user_id,
        content: reply.content,
        createdAt: reply.created_at,
        userName: reply.users?.name || 'Pengguna',
        userAvatar: reply.users?.avatar_url,
        userRole: reply.users?.role || 'Pembaca',
      };
      
      const existing = repliesMap.get(reply.review_id) || [];
      existing.push(reviewReply);
      repliesMap.set(reply.review_id, existing);
    });

    return repliesMap;
  } catch (error) {
    console.error('Error in getReviewRepliesForNovel:', error);
    return new Map();
  }
}

// Submit a reply to a review
export async function submitReviewReply(
  reviewId: number,
  userId: number,
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('review_replies')
      .insert({
        review_id: reviewId,
        user_id: userId,
        content: content.trim(),
      });

    if (error) {
      console.error('Error submitting reply:', error);
      return { success: false, error: 'Gagal mengirim balasan' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in submitReviewReply:', error);
    return { success: false, error: 'Terjadi kesalahan' };
  }
}

// Delete a reply (only owner can delete)
export async function deleteReviewReply(
  replyId: number,
  userId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // First check if user owns this reply
    const { data: reply, error: checkError } = await supabase
      .from('review_replies')
      .select('user_id')
      .eq('id', replyId)
      .single();

    if (checkError || !reply) {
      return { success: false, error: 'Balasan tidak ditemukan' };
    }

    if (reply.user_id !== userId) {
      return { success: false, error: 'Kamu tidak bisa menghapus balasan orang lain' };
    }

    const { error } = await supabase
      .from('review_replies')
      .delete()
      .eq('id', replyId);

    if (error) {
      console.error('Error deleting reply:', error);
      return { success: false, error: 'Gagal menghapus balasan' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteReviewReply:', error);
    return { success: false, error: 'Terjadi kesalahan' };
  }
}

// ==================== PUBLIC USER PROFILE ====================

export interface PublicUserProfile {
  id: number;
  name: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

export interface UserNovel {
  id: number;
  title: string;
  coverUrl: string | null;
  genre: string;
  status: string;
  rating: number;
  totalChapters: number;
  totalReads: number;
}

// Get public user profile by ID
export async function getUserById(userId: number): Promise<PublicUserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, bio, avatar_url, role, created_at')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Error getting user by ID:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      bio: data.bio,
      avatarUrl: data.avatar_url,
      role: data.role || 'Pembaca',
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Error in getUserById:', error);
    return null;
  }
}

// Get novels by author (user) ID
export async function getUserNovels(userId: number): Promise<UserNovel[]> {
  try {
    const { data, error } = await supabase
      .from('novels')
      .select('id, title, cover_url, genre, status, rating, total_chapters, total_reads')
      .eq('author_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user novels:', error);
      return [];
    }

    return (data || []).map((novel: any) => ({
      id: novel.id,
      title: novel.title,
      coverUrl: novel.cover_url,
      genre: novel.genre,
      status: novel.status,
      rating: novel.rating || 0,
      totalChapters: novel.total_chapters || 0,
      totalReads: novel.total_reads || 0,
    }));
  } catch (error) {
    console.error('Error in getUserNovels:', error);
    return [];
  }
}

// ==================== USER FOLLOW SYSTEM ====================

export interface FollowStats {
  followersCount: number;
  followingCount: number;
}

export interface FollowUser {
  id: number;
  name: string;
  avatarUrl: string | null;
  role: string;
}

// Get follow stats for a user
export async function getUserFollowStats(userId: number): Promise<FollowStats> {
  try {
    const [followersResult, followingResult] = await Promise.all([
      supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId),
      supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId),
    ]);

    return {
      followersCount: followersResult.count || 0,
      followingCount: followingResult.count || 0,
    };
  } catch (error) {
    console.error('Error in getUserFollowStats:', error);
    return { followersCount: 0, followingCount: 0 };
  }
}

// Check if current user follows target user
export async function isFollowing(followerId: number, followingId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    return !error && !!data;
  } catch (error) {
    return false;
  }
}

// Follow a user
export async function followUser(
  followerId: number,
  followingId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    if (followerId === followingId) {
      return { success: false, error: 'Kamu tidak bisa follow diri sendiri' };
    }

    const { error } = await supabase
      .from('user_follows')
      .insert({
        follower_id: followerId,
        following_id: followingId,
      });

    if (error) {
      if (error.message.includes('duplicate')) {
        return { success: true }; // Already following
      }
      console.error('Error following user:', error);
      return { success: false, error: 'Gagal follow pengguna' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in followUser:', error);
    return { success: false, error: 'Terjadi kesalahan' };
  }
}

// Unfollow a user
export async function unfollowUser(
  followerId: number,
  followingId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      console.error('Error unfollowing user:', error);
      return { success: false, error: 'Gagal unfollow pengguna' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in unfollowUser:', error);
    return { success: false, error: 'Terjadi kesalahan' };
  }
}

// Get followers list
export async function getFollowers(userId: number): Promise<FollowUser[]> {
  try {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        follower:follower_id (id, name, avatar_url, role)
      `)
      .eq('following_id', userId);

    if (error) {
      console.error('Error getting followers:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.follower.id,
      name: item.follower.name,
      avatarUrl: item.follower.avatar_url,
      role: item.follower.role || 'Pembaca',
    }));
  } catch (error) {
    console.error('Error in getFollowers:', error);
    return [];
  }
}

// Get following list
export async function getFollowing(userId: number): Promise<FollowUser[]> {
  try {
    const { data, error } = await supabase
      .from('user_follows')
      .select(`
        following:following_id (id, name, avatar_url, role)
      `)
      .eq('follower_id', userId);

    if (error) {
      console.error('Error getting following:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.following.id,
      name: item.following.name,
      avatarUrl: item.following.avatar_url,
      role: item.following.role || 'Pembaca',
    }));
  } catch (error) {
    console.error('Error in getFollowing:', error);
    return [];
  }
}
