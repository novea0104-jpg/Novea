import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { SocialLinks } from '@/types/models';

// Supabase credentials
// NOTE: These are PUBLIC keys (anon key is safe to expose in client-side code)
// Row Level Security (RLS) in Supabase protects your data even with exposed anon key
const supabaseUrl = 'https://aqhoqcyespikebuatbmp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxaG9xY3llc3Bpa2VidWF0Ym1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Mzg3ODksImV4cCI6MjA3OTIxNDc4OX0.YpzzzAwEewbwDihxZ9d-mTZJzoxN8mGQC-z_nd-ecUY';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials! Check Replit Secrets configuration.');
}

// Custom storage adapter for React Native using AsyncStorage
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  },
};

// Create Supabase client with proper storage for React Native
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
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

// Save reading progress to Supabase
export async function saveReadingProgress(
  userId: number,
  novelId: number,
  chapterId: number,
  progress: number = 0
): Promise<boolean> {
  try {
    const { data: existing } = await supabase
      .from('reading_progress')
      .select('id')
      .eq('user_id', userId)
      .eq('novel_id', novelId)
      .single();

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('reading_progress')
        .update({
          chapter_id: chapterId,
          progress,
          last_read_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating reading progress:', error);
        return false;
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('reading_progress')
        .insert({
          user_id: userId,
          novel_id: novelId,
          chapter_id: chapterId,
          progress,
          last_read_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error inserting reading progress:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in saveReadingProgress:', error);
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

// Helper function to get view counts for multiple novels at once
export async function getBulkNovelViewCounts(novelIds: number[]): Promise<Map<number, number>> {
  const viewCountsMap = new Map<number, number>();
  if (novelIds.length === 0) return viewCountsMap;
  
  try {
    const { data: viewsData, error } = await supabase
      .from('novel_views')
      .select('novel_id')
      .in('novel_id', novelIds);

    if (error) {
      console.error('Error fetching bulk view counts:', error);
      return viewCountsMap;
    }

    (viewsData || []).forEach((view: any) => {
      const currentCount = viewCountsMap.get(view.novel_id) || 0;
      viewCountsMap.set(view.novel_id, currentCount + 1);
    });

    return viewCountsMap;
  } catch (error) {
    console.error('Error in getBulkNovelViewCounts:', error);
    return viewCountsMap;
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

// ========== CHAPTER LIKES FUNCTIONS ==========

// Toggle like for a chapter
export async function toggleChapterLike(userId: number, chapterId: number, novelId: number): Promise<{ isLiked: boolean; error?: string }> {
  try {
    const { data: existing } = await supabase
      .from('chapter_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('chapter_id', chapterId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('chapter_likes')
        .delete()
        .eq('user_id', userId)
        .eq('chapter_id', chapterId);

      if (error) throw error;
      return { isLiked: false };
    } else {
      const { error } = await supabase
        .from('chapter_likes')
        .insert({ user_id: userId, chapter_id: chapterId, novel_id: novelId });

      if (error) throw error;
      return { isLiked: true };
    }
  } catch (error: any) {
    console.error('Error toggling chapter like:', error);
    return { isLiked: false, error: error.message };
  }
}

// Check if user liked a chapter
export async function checkUserLikedChapter(userId: number, chapterId: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('chapter_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('chapter_id', chapterId)
      .single();

    return !!data && !error;
  } catch (error) {
    return false;
  }
}

// Get like count for a single chapter
export async function getChapterLikeCount(chapterId: number): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('chapter_likes')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapterId);

    if (error) {
      console.error('Error getting chapter like count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getChapterLikeCount:', error);
    return 0;
  }
}

// Get total likes count for all chapters of a novel
export async function getNovelChapterLikesCount(novelId: number): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('chapter_likes')
      .select('*', { count: 'exact', head: true })
      .eq('novel_id', novelId);

    if (error) {
      console.error('Error getting novel chapter likes count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getNovelChapterLikesCount:', error);
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
  socialLinks?: SocialLinks;
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
      .select('id, name, email, bio, avatar_url, role, created_at, social_links')
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
      socialLinks: data.social_links || undefined,
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

// ==================== TIMELINE POSTS ====================

export interface TimelinePost {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string | null;
  userRole: string;
  content: string;
  imageUrl: string | null;
  novelId: number | null;
  novelTitle?: string;
  novelCover?: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface TimelinePostComment {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string | null;
  userRole: string;
  content: string;
  parentId: number | null;
  createdAt: string;
  replies?: TimelinePostComment[];
  replyCount?: number;
}

// Get timeline feed - PUBLIC: all users can see all posts
export async function getTimelineFeed(
  currentUserId: number | null,
  limit: number = 500,
  offset: number = 0
): Promise<TimelinePost[]> {
  try {
    // Fetch ALL posts - no filtering, timeline is public
    const { data, error } = await supabase
      .from('timeline_posts')
      .select(`
        *,
        user:user_id (id, name, avatar_url, role),
        novel:novel_id (id, title, cover_url)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching timeline:', error);
      return [];
    }

    const posts = data || [];

    // Get liked posts for current user
    let likedPostIds = new Set<number>();
    if (currentUserId) {
      const { data: likesData } = await supabase
        .from('timeline_post_likes')
        .select('post_id')
        .eq('user_id', currentUserId);
      likedPostIds = new Set((likesData || []).map(l => l.post_id));
    }

    // Get actual comment counts from comments table (more reliable than denormalized count)
    const postIds = posts.map((p: any) => p.id);
    const commentCountsMap = new Map<number, number>();
    
    if (postIds.length > 0) {
      const { data: commentsData } = await supabase
        .from('timeline_post_comments')
        .select('post_id')
        .in('post_id', postIds);
      
      // Count comments per post
      (commentsData || []).forEach((c: any) => {
        const current = commentCountsMap.get(c.post_id) || 0;
        commentCountsMap.set(c.post_id, current + 1);
      });
    }

    return posts.map((post: any) => ({
      id: post.id,
      userId: post.user_id,
      userName: post.user?.name || 'Pengguna',
      userAvatar: post.user?.avatar_url,
      userRole: post.user?.role || 'pembaca',
      content: post.content,
      imageUrl: post.image_url,
      novelId: post.novel_id,
      novelTitle: post.novel?.title,
      novelCover: post.novel?.cover_url,
      likesCount: post.likes_count || 0,
      commentsCount: commentCountsMap.get(post.id) || 0,
      isLiked: likedPostIds.has(post.id),
      createdAt: post.created_at,
    }));
  } catch (error) {
    console.error('Error in getTimelineFeed:', error);
    return [];
  }
}

// Get all posts by a specific user (for profile page)
export async function getUserTimelinePosts(
  profileUserId: number,
  currentUserId: number | null
): Promise<TimelinePost[]> {
  try {
    const { data, error } = await supabase
      .from('timeline_posts')
      .select(`
        *,
        user:user_id (id, name, avatar_url, role),
        novel:novel_id (id, title, cover_url)
      `)
      .eq('user_id', profileUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user posts:', error);
      return [];
    }

    // Get liked posts for current user
    let likedPostIds = new Set<number>();
    if (currentUserId) {
      const { data: likesData } = await supabase
        .from('timeline_post_likes')
        .select('post_id')
        .eq('user_id', currentUserId);
      likedPostIds = new Set((likesData || []).map(l => l.post_id));
    }

    // Get comment counts
    const postIds = (data || []).map((p: any) => p.id);
    const commentCountsMap = new Map<number, number>();
    
    if (postIds.length > 0) {
      const { data: commentsData } = await supabase
        .from('timeline_post_comments')
        .select('post_id')
        .in('post_id', postIds);
      
      (commentsData || []).forEach((c: any) => {
        const current = commentCountsMap.get(c.post_id) || 0;
        commentCountsMap.set(c.post_id, current + 1);
      });
    }

    return (data || []).map((post: any) => ({
      id: post.id,
      userId: post.user_id,
      userName: post.user?.name || 'Pengguna',
      userAvatar: post.user?.avatar_url,
      userRole: post.user?.role || 'pembaca',
      content: post.content,
      imageUrl: post.image_url,
      novelId: post.novel_id,
      novelTitle: post.novel?.title,
      novelCover: post.novel?.cover_url,
      likesCount: post.likes_count || 0,
      commentsCount: commentCountsMap.get(post.id) || 0,
      isLiked: likedPostIds.has(post.id),
      createdAt: post.created_at,
    }));
  } catch (error) {
    console.error('Error in getUserTimelinePosts:', error);
    return [];
  }
}

// Create a new timeline post
export async function createTimelinePost(
  userId: number,
  content: string,
  imageUrl?: string,
  novelId?: number
): Promise<{ success: boolean; postId?: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('timeline_posts')
      .insert({
        user_id: userId,
        content: content.trim(),
        image_url: imageUrl || null,
        novel_id: novelId || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return { success: false, error: 'Gagal membuat postingan' };
    }

    return { success: true, postId: data.id };
  } catch (error) {
    console.error('Error in createTimelinePost:', error);
    return { success: false, error: 'Terjadi kesalahan' };
  }
}

// Delete a timeline post
export async function deleteTimelinePost(
  postId: number,
  userId: number,
  userRole?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user owns this post
    const { data: post, error: checkError } = await supabase
      .from('timeline_posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (checkError || !post) {
      return { success: false, error: 'Postingan tidak ditemukan' };
    }

    // Admin roles can delete any post
    const adminRoles = ['admin', 'co_admin', 'editor', 'super_admin'];
    const isAdmin = userRole && adminRoles.includes(userRole);
    
    if (post.user_id !== userId && !isAdmin) {
      return { success: false, error: 'Kamu tidak bisa menghapus postingan orang lain' };
    }

    const { error } = await supabase
      .from('timeline_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('Error deleting post:', error);
      return { success: false, error: 'Gagal menghapus postingan' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteTimelinePost:', error);
    return { success: false, error: 'Terjadi kesalahan' };
  }
}

// Toggle like on a timeline post
export async function toggleTimelinePostLike(
  userId: number,
  postId: number
): Promise<{ isLiked: boolean; likesCount: number; error?: string }> {
  try {
    // Check if already liked
    const { data: existing } = await supabase
      .from('timeline_post_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single();

    if (existing) {
      // Unlike
      await supabase
        .from('timeline_post_likes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      // Update likes count
      await supabase.rpc('decrement_post_likes', { post_id: postId });
    } else {
      // Like
      await supabase
        .from('timeline_post_likes')
        .insert({ user_id: userId, post_id: postId });

      // Update likes count
      await supabase.rpc('increment_post_likes', { post_id: postId });
    }

    // Get updated likes count
    const { data: post } = await supabase
      .from('timeline_posts')
      .select('likes_count')
      .eq('id', postId)
      .single();

    return {
      isLiked: !existing,
      likesCount: post?.likes_count || 0,
    };
  } catch (error) {
    console.error('Error in toggleTimelinePostLike:', error);
    return { isLiked: false, likesCount: 0, error: 'Gagal menyimpan like' };
  }
}

// Get comments for a post
export async function getTimelinePostComments(postId: number): Promise<TimelinePostComment[]> {
  try {
    const { data, error } = await supabase
      .from('timeline_post_comments')
      .select(`
        *,
        user:user_id (id, name, avatar_url, role)
      `)
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting comments:', error);
      return [];
    }

    // Get replies for all comments
    const { data: repliesData } = await supabase
      .from('timeline_post_comments')
      .select(`
        *,
        user:user_id (id, name, avatar_url, role)
      `)
      .eq('post_id', postId)
      .not('parent_id', 'is', null)
      .order('created_at', { ascending: true });

    const repliesMap = new Map<number, TimelinePostComment[]>();
    (repliesData || []).forEach((reply: any) => {
      const parentId = reply.parent_id;
      const existing = repliesMap.get(parentId) || [];
      existing.push({
        id: reply.id,
        userId: reply.user_id,
        userName: reply.user?.name || 'Pengguna',
        userAvatar: reply.user?.avatar_url,
        userRole: reply.user?.role || 'pembaca',
        content: reply.content,
        parentId: reply.parent_id,
        createdAt: reply.created_at,
      });
      repliesMap.set(parentId, existing);
    });

    return (data || []).map((comment: any) => {
      const replies = repliesMap.get(comment.id) || [];
      return {
        id: comment.id,
        userId: comment.user_id,
        userName: comment.user?.name || 'Pengguna',
        userAvatar: comment.user?.avatar_url,
        userRole: comment.user?.role || 'pembaca',
        content: comment.content,
        parentId: comment.parent_id,
        createdAt: comment.created_at,
        replies,
        replyCount: replies.length,
      };
    });
  } catch (error) {
    console.error('Error in getTimelinePostComments:', error);
    return [];
  }
}

// Add comment to a post
export async function addTimelinePostComment(
  userId: number,
  postId: number,
  content: string,
  parentId?: number
): Promise<{ success: boolean; commentId?: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('timeline_post_comments')
      .insert({
        user_id: userId,
        post_id: postId,
        content: content.trim(),
        parent_id: parentId || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      return { success: false, error: 'Gagal mengirim komentar' };
    }

    // Update comments count
    await supabase.rpc('increment_post_comments', { post_id: postId });

    return { success: true, commentId: data.id };
  } catch (error) {
    console.error('Error in addTimelinePostComment:', error);
    return { success: false, error: 'Terjadi kesalahan' };
  }
}

// Delete comment
export async function deleteTimelinePostComment(
  commentId: number,
  userId: number,
  postId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user owns this comment
    const { data: comment, error: checkError } = await supabase
      .from('timeline_post_comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (checkError || !comment) {
      return { success: false, error: 'Komentar tidak ditemukan' };
    }

    if (comment.user_id !== userId) {
      return { success: false, error: 'Kamu tidak bisa menghapus komentar orang lain' };
    }

    const { error } = await supabase
      .from('timeline_post_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return { success: false, error: 'Gagal menghapus komentar' };
    }

    // Update comments count
    await supabase.rpc('decrement_post_comments', { post_id: postId });

    return { success: true };
  } catch (error) {
    console.error('Error in deleteTimelinePostComment:', error);
    return { success: false, error: 'Terjadi kesalahan' };
  }
}

// ==================== PRIVATE MESSAGES ====================

export interface PMConversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  participants: PMParticipant[];
  unreadCount: number;
}

export interface PMParticipant {
  id: number;
  conversationId: string;
  userId: number;
  userName: string;
  userAvatar: string | null;
  userRole: string;
  lastReadAt: string | null;
  joinedAt: string;
}

export interface PMMessage {
  id: number;
  conversationId: string;
  senderId: number;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  createdAt: string;
  isOwn: boolean;
}

// Get all conversations for a user (optimized - batch queries)
export async function getConversations(userId: number): Promise<PMConversation[]> {
  try {
    // Get all conversation IDs where user is participant
    const { data: participantData, error: partError } = await supabase
      .from('pm_participants')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId);

    if (partError || !participantData || participantData.length === 0) {
      return [];
    }

    const conversationIds = participantData.map(p => p.conversation_id);
    const lastReadMap = new Map(participantData.map(p => [p.conversation_id, p.last_read_at]));

    // Batch fetch all data in parallel
    const [convResult, participantsResult, messagesResult] = await Promise.all([
      // Get conversations
      supabase
        .from('pm_conversations')
        .select('*')
        .in('id', conversationIds)
        .order('last_message_at', { ascending: false }),
      // Get all participants for these conversations
      supabase
        .from('pm_participants')
        .select(`
          *,
          user:user_id (id, name, avatar_url, role)
        `)
        .in('conversation_id', conversationIds),
      // Get all messages for unread counting (only sender_id and created_at needed)
      supabase
        .from('pm_messages')
        .select('conversation_id, sender_id, created_at')
        .in('conversation_id', conversationIds)
        .neq('sender_id', userId),
    ]);

    if (convResult.error || !convResult.data) {
      console.error('Error fetching conversations:', convResult.error);
      return [];
    }

    const convData = convResult.data;
    const allParticipants = participantsResult.data || [];
    const allMessages = messagesResult.data || [];

    // Calculate unread counts per conversation in memory
    const unreadCounts: Record<string, number> = {};
    for (const msg of allMessages) {
      const lastRead = lastReadMap.get(msg.conversation_id);
      const isUnread = !lastRead || new Date(msg.created_at) > new Date(lastRead);
      if (isUnread) {
        unreadCounts[msg.conversation_id] = (unreadCounts[msg.conversation_id] || 0) + 1;
      }
    }

    // Map conversations with pre-fetched data
    return convData.map((conv: any) => {
      const participants = allParticipants
        .filter((p: any) => p.conversation_id === conv.id)
        .map((p: any) => ({
          id: p.id,
          conversationId: p.conversation_id,
          userId: p.user_id,
          userName: p.user?.name || 'Pengguna',
          userAvatar: p.user?.avatar_url,
          userRole: p.user?.role || 'pembaca',
          lastReadAt: p.last_read_at,
          joinedAt: p.joined_at,
        }));

      return {
        id: conv.id,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        lastMessageAt: conv.last_message_at,
        lastMessagePreview: conv.last_message_preview,
        participants,
        unreadCount: unreadCounts[conv.id] || 0,
      };
    });
  } catch (error) {
    console.error('Error in getConversations:', error);
    return [];
  }
}

// Get or create a conversation between two users
export async function getOrCreateConversation(
  userId1: number,
  userId2: number
): Promise<{ conversationId: string | null; error?: string }> {
  try {
    // Check if conversation already exists between these two users
    const { data: existingParticipants } = await supabase
      .from('pm_participants')
      .select('conversation_id')
      .eq('user_id', userId1);

    if (existingParticipants && existingParticipants.length > 0) {
      const convIds = existingParticipants.map(p => p.conversation_id);
      
      // Check if user2 is in any of these conversations
      const { data: sharedConv } = await supabase
        .from('pm_participants')
        .select('conversation_id')
        .eq('user_id', userId2)
        .in('conversation_id', convIds);

      if (sharedConv && sharedConv.length > 0) {
        // Found existing conversation
        return { conversationId: sharedConv[0].conversation_id };
      }
    }

    // Create new conversation
    const { data: newConv, error: convError } = await supabase
      .from('pm_conversations')
      .insert({ created_by: userId1 })
      .select('id')
      .single();

    if (convError || !newConv) {
      console.error('Error creating conversation:', convError);
      return { conversationId: null, error: 'Gagal membuat percakapan' };
    }

    // Add both participants
    const { error: partError } = await supabase
      .from('pm_participants')
      .insert([
        { conversation_id: newConv.id, user_id: userId1 },
        { conversation_id: newConv.id, user_id: userId2 },
      ]);

    if (partError) {
      console.error('Error adding participants:', partError);
      // Clean up conversation
      await supabase.from('pm_conversations').delete().eq('id', newConv.id);
      return { conversationId: null, error: 'Gagal menambahkan peserta' };
    }

    return { conversationId: newConv.id };
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    return { conversationId: null, error: 'Terjadi kesalahan' };
  }
}

// Get messages for a conversation
export async function getMessages(
  conversationId: string,
  currentUserId: number,
  limit: number = 50,
  before?: string
): Promise<PMMessage[]> {
  try {
    let query = supabase
      .from('pm_messages')
      .select(`
        *,
        sender:sender_id (id, name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return (data || []).reverse().map((msg: any) => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      senderName: msg.sender?.name || 'Pengguna',
      senderAvatar: msg.sender?.avatar_url,
      content: msg.content,
      createdAt: msg.created_at,
      isOwn: msg.sender_id === currentUserId,
    }));
  } catch (error) {
    console.error('Error in getMessages:', error);
    return [];
  }
}

// Send a message
export async function sendMessage(
  conversationId: string,
  senderId: number,
  body: string
): Promise<{ success: boolean; message?: PMMessage; error?: string }> {
  try {
    // Verify sender is participant
    const { data: participant } = await supabase
      .from('pm_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', senderId)
      .single();

    if (!participant) {
      return { success: false, error: 'Kamu bukan peserta percakapan ini' };
    }

    // Get sender info
    const { data: sender } = await supabase
      .from('users')
      .select('name, avatar_url')
      .eq('id', senderId)
      .single();

    // Insert message
    const { data: newMsg, error: msgError } = await supabase
      .from('pm_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: body.trim(),
      })
      .select('*')
      .single();

    if (msgError || !newMsg) {
      console.error('Error sending message:', msgError);
      return { success: false, error: 'Gagal mengirim pesan' };
    }

    // Update sender's last_read_at
    await supabase
      .from('pm_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', senderId);

    return {
      success: true,
      message: {
        id: newMsg.id,
        conversationId: newMsg.conversation_id,
        senderId: newMsg.sender_id,
        senderName: sender?.name || 'Pengguna',
        senderAvatar: sender?.avatar_url,
        content: newMsg.content,
        createdAt: newMsg.created_at,
        isOwn: true,
      },
    };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return { success: false, error: 'Terjadi kesalahan' };
  }
}

// Mark conversation as read
export async function markConversationRead(
  conversationId: string,
  userId: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('pm_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    console.error('Error in markConversationRead:', error);
    return false;
  }
}

// Get total unread message count for a user
export async function getTotalUnreadCount(userId: number): Promise<number> {
  try {
    const conversations = await getConversations(userId);
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  } catch (error) {
    console.error('Error in getTotalUnreadCount:', error);
    return 0;
  }
}

// Search users for new conversation
export async function searchUsersForPM(
  query: string,
  currentUserId: number,
  limit: number = 20
): Promise<{ id: number; name: string; avatarUrl: string | null; role: string }[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, avatar_url, role')
      .neq('id', currentUserId)
      .ilike('name', `%${query}%`)
      .limit(limit);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return (data || []).map((u: any) => ({
      id: u.id,
      name: u.name,
      avatarUrl: u.avatar_url,
      role: u.role || 'pembaca',
    }));
  } catch (error) {
    console.error('Error in searchUsersForPM:', error);
    return [];
  }
}

// ============================================
// ADMIN FUNCTIONS
// ============================================

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  coinBalance: number;
  isBanned: boolean;
  createdAt: string;
  novelsCount?: number;
}

export interface AdminNovel {
  id: number;
  title: string;
  authorId: number;
  authorName: string;
  genre: string;
  status: string;
  isPublished: boolean;
  viewCount: number;
  likesCount: number;
  chaptersCount: number;
  createdAt: string;
  coverUrl: string | null;
}

export interface AdminStats {
  totalUsers: number;
  totalNovels: number;
  totalChapters: number;
  totalViews: number;
  newUsersToday: number;
  newNovelsToday: number;
  totalCoinsPurchased: number;
  totalChapterSales: number;
  platformRevenue: number; // Total revenue in IDR
}

// Get all users for admin (excludes super_admin users for security)
export async function getAllUsersAdmin(
  adminRole: string,
  page: number = 1,
  limit: number = 20,
  searchQuery?: string
): Promise<{ users: AdminUser[]; total: number }> {
  try {
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' })
      .neq('role', 'super_admin'); // Hide super_admin users from list

    if (searchQuery && searchQuery.trim()) {
      query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Error fetching users:', error);
      return { users: [], total: 0 };
    }

    const users: AdminUser[] = (data || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      avatarUrl: u.avatar_url,
      role: u.role || 'pembaca',
      coinBalance: u.coin_balance || 0,
      isBanned: u.is_banned || false,
      createdAt: u.created_at,
    }));

    return { users, total: count || 0 };
  } catch (error) {
    console.error('Error in getAllUsersAdmin:', error);
    return { users: [], total: 0 };
  }
}

// Ban/unban user (for Co Admin and Super Admin)
export async function toggleUserBan(
  adminId: string,
  adminRole: string,
  userId: string,
  ban: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if admin has permission
    if (adminRole !== 'super_admin' && adminRole !== 'co_admin') {
      return { success: false, error: 'Tidak memiliki izin' };
    }

    // Get target user's role
    const { data: targetUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    // Co Admin cannot ban Super Admin
    if (adminRole === 'co_admin' && targetUser?.role === 'super_admin') {
      return { success: false, error: 'Tidak dapat melakukan aksi pada Super Admin' };
    }

    const { error } = await supabase
      .from('users')
      .update({ is_banned: ban })
      .eq('id', userId);

    if (error) {
      console.error('Error toggling user ban:', error);
      return { success: false, error: 'Gagal mengubah status ban' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in toggleUserBan:', error);
    return { success: false, error: 'Terjadi kesalahan' };
  }
}

// Delete user (Super Admin only)
export async function deleteUser(
  adminRole: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Only Super Admin can delete users
    if (adminRole !== 'super_admin') {
      return { success: false, error: 'Hanya Super Admin yang dapat menghapus user' };
    }

    // Get target user's role
    const { data: targetUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    // Cannot delete Super Admin
    if (targetUser?.role === 'super_admin') {
      return { success: false, error: 'Tidak dapat menghapus Super Admin' };
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: 'Gagal menghapus user' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteUser:', error);
    return { success: false, error: 'Terjadi kesalahan' };
  }
}

// Change user role
export async function changeUserRole(
  adminId: string,
  adminRole: string,
  userId: string,
  newRole: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check permissions
    if (adminRole !== 'super_admin' && adminRole !== 'co_admin') {
      return { success: false, error: 'Tidak memiliki izin' };
    }

    // SECURITY: No one can promote to super_admin via admin dashboard
    if (newRole === 'super_admin') {
      return { success: false, error: 'Promosi ke Super Admin tidak diizinkan' };
    }

    // Get target user's current role
    const { data: targetUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    // Cannot modify Super Admin users
    if (targetUser?.role === 'super_admin') {
      return { success: false, error: 'Tidak dapat mengubah role Super Admin' };
    }

    // Co Admin restrictions
    if (adminRole === 'co_admin') {
      // Cannot promote to Co Admin (only Super Admin can)
      if (newRole === 'co_admin') {
        return { success: false, error: 'Hanya Super Admin yang dapat mempromosikan ke Co Admin' };
      }
    }

    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      console.error('Error changing user role:', error);
      return { success: false, error: 'Gagal mengubah role' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in changeUserRole:', error);
    return { success: false, error: 'Terjadi kesalahan' };
  }
}

// Get all novels for admin (optimized - batch queries instead of N+1)
export async function getAllNovelsAdmin(
  page: number = 1,
  limit: number = 20,
  searchQuery?: string
): Promise<{ novels: AdminNovel[]; total: number }> {
  try {
    let query = supabase
      .from('novels')
      .select('*', { count: 'exact' });

    if (searchQuery && searchQuery.trim()) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Error fetching novels:', error);
      return { novels: [], total: 0 };
    }

    if (!data || data.length === 0) {
      return { novels: [], total: count || 0 };
    }

    const novelIds = data.map((n: any) => n.id);
    const authorIds = [...new Set(data.map((n: any) => n.author_id).filter(Boolean))];

    // Batch fetch all related data in parallel
    const [authorsResult, chaptersResult, viewsResult, likesResult] = await Promise.all([
      // Fetch all authors at once
      supabase.from('users').select('id, name').in('id', authorIds),
      // Fetch chapter counts per novel
      supabase.from('chapters').select('novel_id').in('novel_id', novelIds),
      // Fetch view counts per novel  
      supabase.from('novel_views').select('novel_id').in('novel_id', novelIds),
      // Fetch like counts per novel
      supabase.from('novel_likes').select('novel_id').in('novel_id', novelIds),
    ]);

    // Build lookup maps
    const authorMap = new Map((authorsResult.data || []).map((a: any) => [a.id, a.name]));
    
    const chapterCounts: Record<number, number> = {};
    (chaptersResult.data || []).forEach((c: any) => {
      chapterCounts[c.novel_id] = (chapterCounts[c.novel_id] || 0) + 1;
    });
    
    const viewCounts: Record<number, number> = {};
    (viewsResult.data || []).forEach((v: any) => {
      viewCounts[v.novel_id] = (viewCounts[v.novel_id] || 0) + 1;
    });
    
    const likeCounts: Record<number, number> = {};
    (likesResult.data || []).forEach((l: any) => {
      likeCounts[l.novel_id] = (likeCounts[l.novel_id] || 0) + 1;
    });

    // Map novels with pre-fetched data
    const novels: AdminNovel[] = data.map((n: any) => ({
      id: n.id,
      title: n.title,
      authorId: n.author_id,
      authorName: authorMap.get(n.author_id) || 'Unknown',
      genre: n.genre || '',
      status: n.status || 'ongoing',
      isPublished: n.is_published !== false,
      viewCount: viewCounts[n.id] || n.total_reads || 0,
      likesCount: likeCounts[n.id] || 0,
      chaptersCount: chapterCounts[n.id] || 0,
      createdAt: n.created_at,
      coverUrl: n.cover_url || null,
    }));

    return { novels, total: count || 0 };
  } catch (error) {
    console.error('Error in getAllNovelsAdmin:', error);
    return { novels: [], total: 0 };
  }
}

// Delete novel (for all admin roles: editor, co_admin, super_admin)
export async function deleteNovelAdmin(
  novelId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[deleteNovelAdmin] Starting delete for novelId:', novelId);
    
    // Get all chapter IDs for this novel first
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('id')
      .eq('novel_id', novelId);
    
    if (chaptersError) {
      console.error('[deleteNovelAdmin] Error fetching chapters:', chaptersError);
    }
    
    const chapterIds = (chapters || []).map((c: any) => c.id);
    console.log('[deleteNovelAdmin] Found chapters:', chapterIds);

    // Delete chapter-related data if there are chapters
    if (chapterIds.length > 0) {
      // Delete unlocked chapters
      const { error: e1 } = await supabase.from('unlocked_chapters').delete().in('chapter_id', chapterIds);
      if (e1) console.error('[deleteNovelAdmin] Error deleting unlocked_chapters:', e1);

      // Delete chapter comments
      const { error: e2 } = await supabase.from('chapter_comments').delete().in('chapter_id', chapterIds);
      if (e2) console.error('[deleteNovelAdmin] Error deleting chapter_comments:', e2);
      
      // Delete chapter likes
      const { error: e3 } = await supabase.from('chapter_likes').delete().in('chapter_id', chapterIds);
      if (e3) console.error('[deleteNovelAdmin] Error deleting chapter_likes:', e3);
    }

    // Delete all chapters
    const { error: e4 } = await supabase.from('chapters').delete().eq('novel_id', novelId);
    if (e4) console.error('[deleteNovelAdmin] Error deleting chapters:', e4);

    // Delete novel genres
    const { error: e5 } = await supabase.from('novel_genres').delete().eq('novel_id', novelId);
    if (e5) console.error('[deleteNovelAdmin] Error deleting novel_genres:', e5);

    // Delete novel views
    const { error: e6 } = await supabase.from('novel_views').delete().eq('novel_id', novelId);
    if (e6) console.error('[deleteNovelAdmin] Error deleting novel_views:', e6);

    // Delete novel likes
    const { error: e7 } = await supabase.from('novel_likes').delete().eq('novel_id', novelId);
    if (e7) console.error('[deleteNovelAdmin] Error deleting novel_likes:', e7);

    // Delete reading progress
    const { error: e8 } = await supabase.from('reading_progress').delete().eq('novel_id', novelId);
    if (e8) console.error('[deleteNovelAdmin] Error deleting reading_progress:', e8);

    // Delete novel reviews (first delete review_replies)
    const { data: reviews } = await supabase.from('novel_reviews').select('id').eq('novel_id', novelId);
    if (reviews && reviews.length > 0) {
      const reviewIds = reviews.map((r: any) => r.id);
      const { error: e9a } = await supabase.from('review_replies').delete().in('review_id', reviewIds);
      if (e9a) console.error('[deleteNovelAdmin] Error deleting review_replies:', e9a);
    }
    const { error: e9 } = await supabase.from('novel_reviews').delete().eq('novel_id', novelId);
    if (e9) console.error('[deleteNovelAdmin] Error deleting novel_reviews:', e9);

    // Delete from editors choice
    const { error: e10 } = await supabase.from('editors_choice').delete().eq('novel_id', novelId);
    if (e10) console.error('[deleteNovelAdmin] Error deleting editors_choice:', e10);

    // Delete novel tags
    const { error: e11 } = await supabase.from('novel_tags').delete().eq('novel_id', novelId);
    if (e11) console.error('[deleteNovelAdmin] Error deleting novel_tags:', e11);

    // Delete user library entries
    const { error: e12 } = await supabase.from('user_library').delete().eq('novel_id', novelId);
    if (e12) console.error('[deleteNovelAdmin] Error deleting user_library:', e12);
    
    // Delete following novels
    const { error: e13 } = await supabase.from('following_novels').delete().eq('novel_id', novelId);
    if (e13) console.error('[deleteNovelAdmin] Error deleting following_novels:', e13);
    
    // Delete coin transactions related to novel chapters
    const { error: e14 } = await supabase.from('coin_transactions').delete().eq('novel_id', novelId);
    if (e14) console.error('[deleteNovelAdmin] Error deleting coin_transactions:', e14);

    console.log('[deleteNovelAdmin] All related data deleted, now deleting novel...');

    // Delete the novel
    const { data, error } = await supabase
      .from('novels')
      .delete()
      .eq('id', novelId)
      .select();

    console.log('[deleteNovelAdmin] Delete result:', { data, error });

    if (error) {
      console.error('[deleteNovelAdmin] Error deleting novel:', JSON.stringify(error, null, 2));
      return { success: false, error: `Gagal menghapus novel: ${error.message}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[deleteNovelAdmin] Exception:', error);
    return { success: false, error: `Terjadi kesalahan: ${error.message}` };
  }
}

// Toggle novel publish status
export async function toggleNovelPublishAdmin(
  novelId: number,
  isPublished: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[toggleNovelPublishAdmin] Called with:', { novelId, isPublished });
    
    const { data, error } = await supabase
      .from('novels')
      .update({ is_published: isPublished })
      .eq('id', novelId)
      .select();

    console.log('[toggleNovelPublishAdmin] Result:', { data, error });

    if (error) {
      console.error('[toggleNovelPublishAdmin] Supabase error:', JSON.stringify(error, null, 2));
      return { success: false, error: `Gagal mengubah status novel: ${error.message}` };
    }

    if (!data || data.length === 0) {
      console.error('[toggleNovelPublishAdmin] No rows updated');
      return { success: false, error: 'Novel tidak ditemukan atau tidak ada perubahan' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[toggleNovelPublishAdmin] Exception:', error);
    return { success: false, error: `Terjadi kesalahan: ${error.message}` };
  }
}

// Get admin dashboard stats
export async function getAdminStats(): Promise<AdminStats> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const [
      { count: totalUsers },
      { count: totalNovels },
      { count: totalChapters },
      { count: totalViews },
      { count: newUsersToday },
      { count: newNovelsToday },
      coinPurchaseData,
      chapterSalesData,
      manualStats,
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('novels').select('*', { count: 'exact', head: true }),
      supabase.from('chapters').select('*', { count: 'exact', head: true }),
      supabase.from('novel_views').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', todayStr),
      supabase.from('novels').select('*', { count: 'exact', head: true }).gte('created_at', todayStr),
      supabase.from('coin_transactions').select('amount').eq('type', 'purchase'),
      supabase.from('coin_transactions').select('amount').eq('type', 'unlock_chapter'),
      supabase.from('platform_stats').select('*').eq('id', 1).single(),
    ]);

    // Calculate total coins purchased (positive amounts from purchases)
    let totalCoinsPurchased = (coinPurchaseData.data || []).reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
    
    // Calculate total chapter sales (negative amounts spent on chapters, convert to positive)
    const totalChapterSales = (chapterSalesData.data || []).reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
    
    // Platform revenue: total coins purchased (1 Novoin = Rp 1,000)
    let platformRevenue = Math.floor(totalCoinsPurchased * 1000);

    // Override with manual stats if available
    if (manualStats.data) {
      if (manualStats.data.total_coins_sold !== null && manualStats.data.total_coins_sold !== undefined) {
        totalCoinsPurchased = manualStats.data.total_coins_sold;
      }
      if (manualStats.data.platform_revenue !== null && manualStats.data.platform_revenue !== undefined) {
        platformRevenue = manualStats.data.platform_revenue;
      }
    }

    return {
      totalUsers: totalUsers || 0,
      totalNovels: totalNovels || 0,
      totalChapters: totalChapters || 0,
      totalViews: totalViews || 0,
      newUsersToday: newUsersToday || 0,
      newNovelsToday: newNovelsToday || 0,
      totalCoinsPurchased,
      totalChapterSales,
      platformRevenue,
    };
  } catch (error) {
    console.error('Error in getAdminStats:', error);
    return {
      totalUsers: 0,
      totalNovels: 0,
      totalChapters: 0,
      totalViews: 0,
      newUsersToday: 0,
      newNovelsToday: 0,
      totalCoinsPurchased: 0,
      totalChapterSales: 0,
      platformRevenue: 0,
    };
  }
}

// Admin chapter interface
export interface AdminChapter {
  id: number;
  novelId: number;
  chapterNumber: number;
  title: string;
  content: string;
  isFree: boolean;
  createdAt: string;
}

// Get chapters for admin (by novel)
export async function getChaptersAdmin(
  novelId: number
): Promise<AdminChapter[]> {
  try {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('novel_id', novelId)
      .order('chapter_number', { ascending: true });

    if (error) {
      console.error('Error fetching chapters:', error);
      return [];
    }

    return (data || []).map(c => ({
      id: c.id,
      novelId: c.novel_id,
      chapterNumber: c.chapter_number,
      title: c.title,
      content: c.content,
      isFree: c.is_free,
      createdAt: c.created_at,
    }));
  } catch (error) {
    console.error('Error in getChaptersAdmin:', error);
    return [];
  }
}

// Update novel admin
export async function updateNovelAdmin(
  novelId: number,
  updates: { title?: string; synopsis?: string; genre?: string; status?: string; coinPerChapter?: number; coverUrl?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[updateNovelAdmin] Called with:', { novelId, updates });
    
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.synopsis !== undefined) updateData.synopsis = updates.synopsis;
    if (updates.genre !== undefined) updateData.genre = updates.genre;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.coinPerChapter !== undefined) updateData.coin_per_chapter = updates.coinPerChapter;
    if (updates.coverUrl !== undefined) updateData.cover_url = updates.coverUrl;

    const { data, error } = await supabase
      .from('novels')
      .update(updateData)
      .eq('id', novelId)
      .select();

    console.log('[updateNovelAdmin] Result:', { data, error });

    if (error) {
      console.error('[updateNovelAdmin] Supabase error:', JSON.stringify(error, null, 2));
      return { success: false, error: `Gagal mengupdate novel: ${error.message}` };
    }

    if (!data || data.length === 0) {
      console.error('[updateNovelAdmin] No rows updated');
      return { success: false, error: 'Novel tidak ditemukan atau tidak ada perubahan' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[updateNovelAdmin] Exception:', error);
    return { success: false, error: `Terjadi kesalahan: ${error.message}` };
  }
}

// Update chapter admin
export async function updateChapterAdmin(
  chapterId: number,
  updates: { title?: string; content?: string; isFree?: boolean }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[updateChapterAdmin] Called with:', { chapterId, updates: { ...updates, content: updates.content ? `${updates.content.substring(0, 50)}...` : undefined } });
    
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.isFree !== undefined) updateData.is_free = updates.isFree;

    const { data, error } = await supabase
      .from('chapters')
      .update(updateData)
      .eq('id', chapterId)
      .select();

    console.log('[updateChapterAdmin] Result:', { rowsUpdated: data?.length || 0, error });

    if (error) {
      console.error('[updateChapterAdmin] Supabase error:', JSON.stringify(error, null, 2));
      return { success: false, error: `Gagal mengupdate chapter: ${error.message}` };
    }

    if (!data || data.length === 0) {
      console.error('[updateChapterAdmin] No rows updated');
      return { success: false, error: 'Chapter tidak ditemukan atau tidak ada perubahan' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[updateChapterAdmin] Exception:', error);
    return { success: false, error: `Terjadi kesalahan: ${error.message}` };
  }
}

// Delete chapter admin
export async function deleteChapterAdmin(
  chapterId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[deleteChapterAdmin] Called with:', { chapterId });
    
    // Delete related data first (order matters for foreign key constraints)
    await supabase.from('reading_progress').delete().eq('chapter_id', chapterId);
    await supabase.from('unlocked_chapters').delete().eq('chapter_id', chapterId);
    await supabase.from('chapter_comments').delete().eq('chapter_id', chapterId);
    await supabase.from('chapter_likes').delete().eq('chapter_id', chapterId);
    
    const { data, error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', chapterId)
      .select();

    console.log('[deleteChapterAdmin] Result:', { rowsDeleted: data?.length || 0, error });

    if (error) {
      console.error('[deleteChapterAdmin] Supabase error:', JSON.stringify(error, null, 2));
      return { success: false, error: `Gagal menghapus chapter: ${error.message}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[deleteChapterAdmin] Exception:', error);
    return { success: false, error: `Terjadi kesalahan: ${error.message}` };
  }
}

// ==================== NOTIFICATIONS ====================

export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  novelId: number | null;
  chapterId: number | null;
  timelinePostId: number | null;
  actorId: number | null;
  actorName?: string;
  actorAvatar?: string;
  createdAt: string;
}

export async function getNotifications(userId: number, limit = 50): Promise<Notification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:actor_id (name, avatar_url)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return (data || []).map((n: any) => ({
      id: n.id,
      userId: n.user_id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.is_read,
      novelId: n.novel_id,
      chapterId: n.chapter_id,
      timelinePostId: n.timeline_post_id,
      actorId: n.actor_id,
      actorName: n.actor?.name,
      actorAvatar: n.actor?.avatar_url,
      createdAt: n.created_at,
    }));
  } catch (error) {
    console.error('Error in getNotifications:', error);
    return [];
  }
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUnreadNotificationCount:', error);
    return 0;
  }
}

export async function markNotificationAsRead(notificationId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    return false;
  }
}

export async function markAllNotificationsAsRead(userId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    return false;
  }
}

export async function createNotification(
  userId: number,
  type: string,
  title: string,
  message: string,
  options?: {
    novelId?: number;
    chapterId?: number;
    timelinePostId?: number;
    actorId?: number;
    reviewId?: number;
    commentId?: number;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        novel_id: options?.novelId,
        chapter_id: options?.chapterId,
        timeline_post_id: options?.timelinePostId,
        actor_id: options?.actorId,
        review_id: options?.reviewId,
        comment_id: options?.commentId,
      });

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in createNotification:', error);
    return false;
  }
}

export async function deleteNotification(notificationId: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    return false;
  }
}

// =====================================================
// EDITORS CHOICE FUNCTIONS
// =====================================================

export interface EditorsChoiceNovel {
  id: number;
  novelId: number;
  title: string;
  authorName: string;
  coverUrl: string | null;
  genre: string;
  viewCount: number;
  likesCount: number;
  displayOrder: number;
  addedAt: string;
  addedBy: string;
}

export async function getEditorsChoiceNovels(): Promise<EditorsChoiceNovel[]> {
  try {
    // Fetch editors choice entries
    const { data: choicesData, error: choicesError } = await supabase
      .from('editors_choice')
      .select('id, novel_id, display_order, added_at, added_by')
      .order('display_order', { ascending: true });

    if (choicesError) {
      console.error('Error fetching editors choice:', choicesError);
      return [];
    }

    if (!choicesData || choicesData.length === 0) {
      return [];
    }

    const novelIds = choicesData.map(c => c.novel_id);
    const adminIds = [...new Set(choicesData.map(c => c.added_by).filter(Boolean))];

    // Fetch novels data with total_reads
    const { data: novelsData } = await supabase
      .from('novels')
      .select('id, title, cover_url, genre, author_id, total_reads')
      .in('id', novelIds);

    // Fetch likes counts
    const { data: likesData } = await supabase
      .from('novel_likes')
      .select('novel_id')
      .in('novel_id', novelIds);

    const likesCounts: Record<number, number> = {};
    (likesData || []).forEach((l: any) => {
      likesCounts[l.novel_id] = (likesCounts[l.novel_id] || 0) + 1;
    });

    // Fetch author names
    const authorIds = [...new Set((novelsData || []).map(n => n.author_id).filter(Boolean))];
    const { data: authors } = await supabase
      .from('users')
      .select('id, name')
      .in('id', [...authorIds, ...adminIds]);
    
    const userMap = new Map((authors || []).map(a => [a.id, a.name]));
    const novelsMap = new Map((novelsData || []).map(n => [n.id, n]));

    return choicesData.map((item: any) => {
      const novel = novelsMap.get(item.novel_id);
      return {
        id: item.id,
        novelId: item.novel_id,
        title: novel?.title || '',
        authorName: userMap.get(novel?.author_id) || 'Unknown',
        coverUrl: novel?.cover_url || null,
        genre: novel?.genre || '',
        viewCount: novel?.total_reads || 0,
        likesCount: likesCounts[item.novel_id] || 0,
        displayOrder: item.display_order,
        addedAt: item.added_at,
        addedBy: userMap.get(item.added_by) || 'Admin',
      };
    });
  } catch (error) {
    console.error('Error in getEditorsChoiceNovels:', error);
    return [];
  }
}

export async function addToEditorsChoice(
  adminId: number,
  novelId: number,
  displayOrder: number = 0
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('add_to_editors_choice', {
      p_admin_id: adminId,
      p_novel_id: novelId,
      p_display_order: displayOrder
    });

    if (error) {
      console.error('Error adding to editors choice:', error);
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string };
  } catch (error: any) {
    console.error('Error in addToEditorsChoice:', error);
    return { success: false, error: error.message };
  }
}

export async function removeFromEditorsChoice(
  adminId: number,
  novelId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('remove_from_editors_choice', {
      p_admin_id: adminId,
      p_novel_id: novelId
    });

    if (error) {
      console.error('Error removing from editors choice:', error);
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string };
  } catch (error: any) {
    console.error('Error in removeFromEditorsChoice:', error);
    return { success: false, error: error.message };
  }
}

export async function updateEditorsChoiceOrder(
  adminId: number,
  novelId: number,
  newOrder: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('update_editors_choice_order', {
      p_admin_id: adminId,
      p_novel_id: novelId,
      p_new_order: newOrder
    });

    if (error) {
      console.error('Error updating editors choice order:', error);
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string };
  } catch (error: any) {
    console.error('Error in updateEditorsChoiceOrder:', error);
    return { success: false, error: error.message };
  }
}

export async function searchNovelsForEditorsChoice(
  searchQuery: string,
  excludeIds: number[] = []
): Promise<{ id: number; title: string; authorName: string; coverUrl: string | null }[]> {
  try {
    // First, get existing editors choice novel IDs to exclude
    const { data: existingChoices } = await supabase
      .from('editors_choice')
      .select('novel_id');
    
    const existingNovelIds = (existingChoices || []).map(c => c.novel_id);
    const allExcludeIds = [...new Set([...excludeIds, ...existingNovelIds])];

    // Simple query without complex joins for speed
    let query = supabase
      .from('novels')
      .select('id, title, cover_url, author_id')
      .ilike('title', `%${searchQuery}%`)
      .limit(10);

    if (allExcludeIds.length > 0) {
      query = query.not('id', 'in', `(${allExcludeIds.join(',')})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching novels:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch author names separately for speed
    const authorIds = [...new Set(data.map(n => n.author_id).filter(Boolean))];
    const { data: authors } = await supabase
      .from('users')
      .select('id, name')
      .in('id', authorIds);
    
    const authorMap = new Map((authors || []).map(a => [a.id, a.name]));

    return data.map((n: any) => ({
      id: n.id,
      title: n.title,
      authorName: authorMap.get(n.author_id) || 'Unknown',
      coverUrl: n.cover_url,
    }));
  } catch (error) {
    console.error('Error in searchNovelsForEditorsChoice:', error);
    return [];
  }
}

export async function getEditorsChoiceForHome(): Promise<{
  id: string;
  title: string;
  authorName: string;
  authorId: number;
  coverUrl: string | null;
  genre: string;
  description: string;
  rating: number;
  totalReads: number;
  totalChapters: number;
  freeChapters: number;
  chapterPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}[]> {
  try {
    // First get the editors choice novel IDs
    const { data: choicesData, error: choicesError } = await supabase
      .from('editors_choice')
      .select('novel_id')
      .order('display_order', { ascending: true })
      .limit(20);

    if (choicesError) {
      console.error('Error fetching editors choice:', choicesError);
      return [];
    }

    if (!choicesData || choicesData.length === 0) {
      return [];
    }

    const novelIds = choicesData.map(c => c.novel_id);

    // Fetch novels data - only use columns that exist in Supabase
    const { data: novelsData, error: novelsError } = await supabase
      .from('novels')
      .select('id, title, cover_url, genre, description, rating, total_reads, author_id, status, created_at, updated_at')
      .in('id', novelIds);

    if (novelsError || !novelsData) {
      console.error('Error fetching novels for editors choice:', novelsError);
      return [];
    }

    // Fetch author names separately
    const authorIds = [...new Set(novelsData.map(n => n.author_id).filter(Boolean))];
    const { data: authors } = await supabase
      .from('users')
      .select('id, name')
      .in('id', authorIds);
    
    const authorMap = new Map((authors || []).map(a => [a.id, a.name]));

    // Fetch chapter counts
    const { data: chaptersData } = await supabase
      .from('chapters')
      .select('novel_id')
      .in('novel_id', novelIds);

    const chapterCounts: Record<number, number> = {};
    (chaptersData || []).forEach((c: any) => {
      chapterCounts[c.novel_id] = (chapterCounts[c.novel_id] || 0) + 1;
    });

    // Fetch view counts from novel_views table
    const { data: viewsData } = await supabase
      .from('novel_views')
      .select('novel_id')
      .in('novel_id', novelIds);

    const viewCounts: Record<number, number> = {};
    (viewsData || []).forEach((v: any) => {
      viewCounts[v.novel_id] = (viewCounts[v.novel_id] || 0) + 1;
    });

    // Maintain the order from editors_choice
    const novelsMap = new Map(novelsData.map(n => [n.id, n]));
    
    return novelIds
      .map(novelId => novelsMap.get(novelId))
      .filter(Boolean)
      .map((novel: any) => ({
        id: String(novel.id),
        title: novel.title,
        authorName: authorMap.get(novel.author_id) || 'Unknown',
        authorId: novel.author_id,
        coverUrl: novel.cover_url,
        genre: novel.genre || '',
        description: novel.description || '',
        rating: novel.rating || 0,
        totalReads: viewCounts[novel.id] || novel.total_reads || 0,
        totalChapters: chapterCounts[novel.id] || 0,
        freeChapters: 0,
        chapterPrice: 0,
        status: novel.status || 'ongoing',
        createdAt: novel.created_at,
        updatedAt: novel.updated_at,
      }));
  } catch (error) {
    console.error('Error in getEditorsChoiceForHome:', error);
    return [];
  }
}

// =====================================================
// FEATURED AUTHORS FUNCTIONS
// =====================================================

export interface FeaturedAuthor {
  id: number;
  authorId: number;
  name: string;
  avatarUrl: string | null;
  followersCount: number;
  followingCount: number;
  novelCount: number;
  displayOrder: number;
  addedAt: string;
}

export async function getFeaturedAuthors(): Promise<FeaturedAuthor[]> {
  try {
    const { data: featuredData, error: featuredError } = await supabase
      .from('featured_authors')
      .select('id, author_id, display_order, created_at')
      .order('display_order', { ascending: true });

    if (featuredError) {
      console.error('Error fetching featured authors:', featuredError);
      return [];
    }

    if (!featuredData || featuredData.length === 0) {
      return [];
    }

    const authorIds = featuredData.map(f => f.author_id);

    // Batch fetch all related data in parallel
    const [authorsResult, followersResult, followingResult, novelsResult] = await Promise.all([
      supabase.from('users').select('id, name, avatar_url').in('id', authorIds),
      supabase.from('user_follows').select('following_id').in('following_id', authorIds),
      supabase.from('user_follows').select('follower_id').in('follower_id', authorIds),
      supabase.from('novels').select('author_id').in('author_id', authorIds),
    ]);

    const authorsData = authorsResult.data || [];
    
    const followersCounts: Record<number, number> = {};
    (followersResult.data || []).forEach((f: any) => {
      followersCounts[f.following_id] = (followersCounts[f.following_id] || 0) + 1;
    });

    const followingCounts: Record<number, number> = {};
    (followingResult.data || []).forEach((f: any) => {
      followingCounts[f.follower_id] = (followingCounts[f.follower_id] || 0) + 1;
    });

    const novelCounts: Record<number, number> = {};
    (novelsResult.data || []).forEach((n: any) => {
      if (n.author_id) {
        novelCounts[n.author_id] = (novelCounts[n.author_id] || 0) + 1;
      }
    });

    const authorsMap = new Map(authorsData.map((a: any) => [a.id, a]));

    return featuredData.map((item: any) => {
      const author = authorsMap.get(item.author_id);
      return {
        id: item.id,
        authorId: item.author_id,
        name: author?.name || 'Unknown',
        avatarUrl: author?.avatar_url || null,
        followersCount: followersCounts[item.author_id] || 0,
        followingCount: followingCounts[item.author_id] || 0,
        novelCount: novelCounts[item.author_id] || 0,
        displayOrder: item.display_order,
        addedAt: item.created_at,
      };
    });
  } catch (error) {
    console.error('Error in getFeaturedAuthors:', error);
    return [];
  }
}

export async function addToFeaturedAuthors(
  adminId: number,
  authorId: number,
  displayOrder: number = 1
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('add_to_featured_authors', {
      p_added_by: adminId,
      p_author_id: authorId,
      p_display_order: displayOrder
    });

    if (error) {
      console.error('Error adding to featured authors:', error);
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string };
  } catch (error: any) {
    console.error('Error in addToFeaturedAuthors:', error);
    return { success: false, error: error.message };
  }
}

export async function removeFromFeaturedAuthors(
  authorId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('remove_from_featured_authors', {
      p_author_id: authorId
    });

    if (error) {
      console.error('Error removing from featured authors:', error);
      return { success: false, error: error.message };
    }

    return data as { success: boolean; error?: string };
  } catch (error: any) {
    console.error('Error in removeFromFeaturedAuthors:', error);
    return { success: false, error: error.message };
  }
}

export async function searchAuthorsForFeatured(
  searchQuery: string
): Promise<{ id: number; name: string; avatarUrl: string | null; novelCount: number }[]> {
  try {
    // Get already featured author IDs
    const { data: featuredData } = await supabase
      .from('featured_authors')
      .select('author_id');

    const excludeIds = (featuredData || []).map((f: any) => f.author_id);

    // Search writers
    let query = supabase
      .from('users')
      .select('id, name, avatar_url')
      .eq('is_writer', true)
      .ilike('name', `%${searchQuery}%`)
      .limit(20);

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error searching authors:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Get novel counts
    const authorIds = data.map(a => a.id);
    const { data: novelsData } = await supabase
      .from('novels')
      .select('author_id')
      .in('author_id', authorIds)
      .eq('is_published', true);

    const novelCounts: Record<number, number> = {};
    (novelsData || []).forEach((n: any) => {
      novelCounts[n.author_id] = (novelCounts[n.author_id] || 0) + 1;
    });

    return data.map((a: any) => ({
      id: a.id,
      name: a.name,
      avatarUrl: a.avatar_url,
      novelCount: novelCounts[a.id] || 0,
    }));
  } catch (error) {
    console.error('Error in searchAuthorsForFeatured:', error);
    return [];
  }
}

// ========== TAG FUNCTIONS ==========

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export async function fetchAllTags(): Promise<Tag[]> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('id, name, slug')
      .order('name');

    if (error) {
      console.error('Error fetching tags:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchAllTags:', error);
    return [];
  }
}

export async function searchTags(query: string): Promise<Tag[]> {
  try {
    if (!query.trim()) {
      return fetchAllTags();
    }

    const { data, error } = await supabase
      .from('tags')
      .select('id, name, slug')
      .ilike('name', `%${query}%`)
      .order('name')
      .limit(20);

    if (error) {
      console.error('Error searching tags:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in searchTags:', error);
    return [];
  }
}

export async function getNovelTags(novelId: number): Promise<Tag[]> {
  try {
    const { data, error } = await supabase
      .from('novel_tags')
      .select(`
        tags:tag_id (id, name, slug)
      `)
      .eq('novel_id', novelId);

    if (error) {
      console.error('Error getting novel tags:', error);
      return [];
    }

    return (data || [])
      .map((item: any) => item.tags)
      .filter((tag: Tag | null) => tag !== null) as Tag[];
  } catch (error) {
    console.error('Error in getNovelTags:', error);
    return [];
  }
}

export async function saveNovelTags(
  novelId: number,
  tagIds: number[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete existing tags for this novel
    const { error: deleteError } = await supabase
      .from('novel_tags')
      .delete()
      .eq('novel_id', novelId);

    if (deleteError) {
      console.error('Error deleting existing novel tags:', deleteError);
      return { success: false, error: deleteError.message };
    }

    // Insert new tags
    if (tagIds.length > 0) {
      const inserts = tagIds.map(tagId => ({
        novel_id: novelId,
        tag_id: tagId,
      }));

      const { error: insertError } = await supabase
        .from('novel_tags')
        .insert(inserts);

      if (insertError) {
        console.error('Error inserting novel tags:', insertError);
        return { success: false, error: insertError.message };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in saveNovelTags:', error);
    return { success: false, error: error.message };
  }
}

// ==================== NEWS (Admin News) ====================

export interface NewsItem {
  id: number;
  authorId: number;
  authorName: string;
  authorAvatar: string | null;
  authorRole: string;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getAllAdminNews(): Promise<NewsItem[]> {
  try {
    const { data, error } = await supabase
      .from('admin_news')
      .select(`
        id,
        title,
        content,
        image_url,
        created_at,
        updated_at,
        author:users!admin_news_author_id_fkey (
          id,
          name,
          avatar_url,
          role
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all admin news:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      authorId: item.author?.id || 0,
      authorName: item.author?.name || 'Unknown',
      authorAvatar: item.author?.avatar_url || null,
      authorRole: item.author?.role || 'editor',
      title: item.title,
      content: item.content,
      imageUrl: item.image_url,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error in getAllAdminNews:', error);
    return [];
  }
}

export async function getAdminNews(authorId: number): Promise<NewsItem[]> {
  try {
    const { data, error } = await supabase
      .from('admin_news')
      .select(`
        id,
        title,
        content,
        image_url,
        created_at,
        updated_at,
        author:users!admin_news_author_id_fkey (
          id,
          name,
          avatar_url,
          role
        )
      `)
      .eq('author_id', authorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin news:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      authorId: item.author?.id || authorId,
      authorName: item.author?.name || 'Unknown',
      authorAvatar: item.author?.avatar_url || null,
      authorRole: item.author?.role || 'editor',
      title: item.title,
      content: item.content,
      imageUrl: item.image_url,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('Error in getAdminNews:', error);
    return [];
  }
}

export async function createAdminNews(
  authorId: number,
  title: string,
  content: string,
  imageUrl?: string
): Promise<{ success: boolean; newsId?: number; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('admin_news')
      .insert({
        author_id: authorId,
        title,
        content,
        image_url: imageUrl || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating admin news:', error);
      return { success: false, error: error.message };
    }

    return { success: true, newsId: data.id };
  } catch (error: any) {
    console.error('Error in createAdminNews:', error);
    return { success: false, error: error.message };
  }
}

export async function updateAdminNews(
  newsId: number,
  authorId: number,
  updates: { title?: string; content?: string; imageUrl?: string | null }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;

    const { error } = await supabase
      .from('admin_news')
      .update(updateData)
      .eq('id', newsId)
      .eq('author_id', authorId);

    if (error) {
      console.error('Error updating admin news:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in updateAdminNews:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteAdminNews(
  newsId: number,
  authorId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('admin_news')
      .delete()
      .eq('id', newsId)
      .eq('author_id', authorId);

    if (error) {
      console.error('Error deleting admin news:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteAdminNews:', error);
    return { success: false, error: error.message };
  }
}

// ==================== NEWS COMMENTS ====================

export interface NewsComment {
  id: number;
  newsId: number;
  userId: number;
  userName: string;
  userAvatar: string | null;
  userRole: string;
  parentId: number | null;
  content: string;
  createdAt: string;
  replies?: NewsComment[];
}

export async function getNewsComments(newsId: number): Promise<NewsComment[]> {
  try {
    const { data, error } = await supabase
      .from('news_comments')
      .select(`
        id,
        news_id,
        user_id,
        parent_id,
        content,
        created_at,
        user:users!news_comments_user_id_fkey (
          id,
          name,
          avatar_url,
          role
        )
      `)
      .eq('news_id', newsId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching news comments:', error);
      return [];
    }

    const comments: NewsComment[] = (data || []).map((item: any) => ({
      id: item.id,
      newsId: item.news_id,
      userId: item.user?.id || item.user_id,
      userName: item.user?.name || 'Unknown',
      userAvatar: item.user?.avatar_url || null,
      userRole: item.user?.role || 'Pembaca',
      parentId: item.parent_id,
      content: item.content,
      createdAt: item.created_at,
      replies: [],
    }));

    const rootComments: NewsComment[] = [];
    const commentMap = new Map<number, NewsComment>();

    comments.forEach(comment => {
      commentMap.set(comment.id, comment);
    });

    comments.forEach(comment => {
      if (comment.parentId === null) {
        rootComments.push(comment);
      } else {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          if (!parent.replies) parent.replies = [];
          parent.replies.push(comment);
        }
      }
    });

    return rootComments;
  } catch (error) {
    console.error('Error in getNewsComments:', error);
    return [];
  }
}

export async function submitNewsComment(
  newsId: number,
  userId: number,
  content: string,
  parentId?: number
): Promise<{ success: boolean; comment?: NewsComment; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('news_comments')
      .insert({
        news_id: newsId,
        user_id: userId,
        content: content,
        parent_id: parentId || null,
      })
      .select(`
        id,
        news_id,
        user_id,
        parent_id,
        content,
        created_at
      `)
      .single();

    if (error) {
      console.error('Error submitting news comment:', error);
      return { success: false, error: error.message };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('name, avatar_url, role')
      .eq('id', userId)
      .single();

    const comment: NewsComment = {
      id: data.id,
      newsId: data.news_id,
      userId: data.user_id,
      userName: userData?.name || 'Unknown',
      userAvatar: userData?.avatar_url || null,
      userRole: userData?.role || 'Pembaca',
      parentId: data.parent_id,
      content: data.content,
      createdAt: data.created_at,
      replies: [],
    };

    return { success: true, comment };
  } catch (error: any) {
    console.error('Error in submitNewsComment:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteNewsComment(
  commentId: number,
  userId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('news_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting news comment:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in deleteNewsComment:', error);
    return { success: false, error: error.message };
  }
}

// ==================== COLLECTION NOVELS ====================

export interface CollectionNovel {
  id: number;
  title: string;
  coverUrl: string | null;
  authorId: number;
  authorName: string;
  genre: string;
  status: string;
  rating: number;
  totalReads: number;
  totalLikes: number;
  totalReviews: number;
  createdAt: string;
}

export async function getMostLikedNovels(limit: number = 20): Promise<CollectionNovel[]> {
  try {
    const { data: likesData, error: likesError } = await supabase
      .from('novel_likes')
      .select('novel_id');

    if (likesError) {
      console.error('Error fetching novel likes:', likesError);
      return [];
    }

    const likeCounts: Record<number, number> = {};
    (likesData || []).forEach((item: any) => {
      likeCounts[item.novel_id] = (likeCounts[item.novel_id] || 0) + 1;
    });

    const sortedNovelIds = Object.entries(likeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id]) => parseInt(id));

    if (sortedNovelIds.length === 0) return [];

    const { data: novelsData, error: novelsError } = await supabase
      .from('novels')
      .select('id, title, cover_url, author_id, genre, status, rating, created_at')
      .in('id', sortedNovelIds);

    if (novelsError) {
      console.error('Error fetching novels:', novelsError);
      return [];
    }

    const authorIds = [...new Set((novelsData || []).map((n: any) => n.author_id).filter(Boolean))];
    const [{ data: authors }, viewCountsMap] = await Promise.all([
      supabase.from('users').select('id, name').in('id', authorIds),
      getBulkNovelViewCounts(sortedNovelIds)
    ]);
    
    const authorMap = new Map((authors || []).map((a: any) => [a.id, a.name]));
    const novelMap = new Map((novelsData || []).map((n: any) => [n.id, n]));
    
    return sortedNovelIds
      .filter(id => novelMap.has(id))
      .map(id => {
        const novel = novelMap.get(id)!;
        return {
          id: novel.id,
          title: novel.title,
          coverUrl: novel.cover_url,
          authorId: novel.author_id,
          authorName: authorMap.get(novel.author_id) || 'Unknown',
          genre: novel.genre || '',
          status: novel.status || 'ongoing',
          rating: novel.rating || 0,
          totalReads: viewCountsMap.get(novel.id) || 0,
          totalLikes: likeCounts[id] || 0,
          totalReviews: 0,
          createdAt: novel.created_at,
        };
      });
  } catch (error) {
    console.error('Error in getMostLikedNovels:', error);
    return [];
  }
}

export async function getMostReviewedNovels(limit: number = 20): Promise<CollectionNovel[]> {
  try {
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('novel_reviews')
      .select('novel_id');

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return [];
    }

    const reviewCounts: Record<number, number> = {};
    (reviewsData || []).forEach((item: any) => {
      reviewCounts[item.novel_id] = (reviewCounts[item.novel_id] || 0) + 1;
    });

    const sortedNovelIds = Object.entries(reviewCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id]) => parseInt(id));

    if (sortedNovelIds.length === 0) return [];

    const { data: novelsData, error: novelsError } = await supabase
      .from('novels')
      .select('id, title, cover_url, author_id, genre, status, rating, created_at')
      .in('id', sortedNovelIds);

    if (novelsError) {
      console.error('Error fetching novels:', novelsError);
      return [];
    }

    const authorIds = [...new Set((novelsData || []).map((n: any) => n.author_id).filter(Boolean))];
    const [{ data: authors }, viewCountsMap] = await Promise.all([
      supabase.from('users').select('id, name').in('id', authorIds),
      getBulkNovelViewCounts(sortedNovelIds)
    ]);
    
    const authorMap = new Map((authors || []).map((a: any) => [a.id, a.name]));
    const novelMap = new Map((novelsData || []).map((n: any) => [n.id, n]));
    
    return sortedNovelIds
      .filter(id => novelMap.has(id))
      .map(id => {
        const novel = novelMap.get(id)!;
        return {
          id: novel.id,
          title: novel.title,
          coverUrl: novel.cover_url,
          authorId: novel.author_id,
          authorName: authorMap.get(novel.author_id) || 'Unknown',
          genre: novel.genre || '',
          status: novel.status || 'ongoing',
          rating: novel.rating || 0,
          totalReads: viewCountsMap.get(novel.id) || 0,
          totalLikes: 0,
          totalReviews: reviewCounts[id] || 0,
          createdAt: novel.created_at,
        };
      });
  } catch (error) {
    console.error('Error in getMostReviewedNovels:', error);
    return [];
  }
}

export async function getCompletedNovelsByViews(limit: number = 20): Promise<CollectionNovel[]> {
  try {
    const { data, error } = await supabase
      .from('novels')
      .select('id, title, cover_url, author_id, genre, status, rating, created_at')
      .eq('status', 'completed')
      .limit(limit * 2);

    if (error) {
      console.error('Error fetching completed novels:', error);
      return [];
    }

    const novelIds = (data || []).map((n: any) => n.id);
    const authorIds = [...new Set((data || []).map((n: any) => n.author_id).filter(Boolean))];
    
    const [{ data: authors }, viewCountsMap] = await Promise.all([
      supabase.from('users').select('id, name').in('id', authorIds),
      getBulkNovelViewCounts(novelIds)
    ]);
    
    const authorMap = new Map((authors || []).map((a: any) => [a.id, a.name]));

    return (data || [])
      .map((novel: any) => ({
        id: novel.id,
        title: novel.title,
        coverUrl: novel.cover_url,
        authorId: novel.author_id,
        authorName: authorMap.get(novel.author_id) || 'Unknown',
        genre: novel.genre || '',
        status: novel.status || 'completed',
        rating: novel.rating || 0,
        totalReads: viewCountsMap.get(novel.id) || 0,
        totalLikes: 0,
        totalReviews: 0,
        createdAt: novel.created_at,
      }))
      .sort((a, b) => b.totalReads - a.totalReads)
      .slice(0, limit);
  } catch (error) {
    console.error('Error in getCompletedNovelsByViews:', error);
    return [];
  }
}

export async function getRecentlyUpdatedNovels(limit: number = 20): Promise<CollectionNovel[]> {
  try {
    const { data: chaptersData, error: chaptersError } = await supabase
      .from('chapters')
      .select('novel_id, updated_at')
      .order('updated_at', { ascending: false });

    if (chaptersError) {
      console.error('Error fetching chapters:', chaptersError);
      return [];
    }

    const novelLatestUpdate: Record<number, string> = {};
    (chaptersData || []).forEach((ch: any) => {
      if (!novelLatestUpdate[ch.novel_id]) {
        novelLatestUpdate[ch.novel_id] = ch.updated_at;
      }
    });

    const sortedNovelIds = Object.entries(novelLatestUpdate)
      .sort(([, a], [, b]) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, limit)
      .map(([id]) => parseInt(id));

    if (sortedNovelIds.length === 0) return [];

    const { data: novelsData, error: novelsError } = await supabase
      .from('novels')
      .select('id, title, cover_url, author_id, genre, status, rating, created_at')
      .in('id', sortedNovelIds);

    if (novelsError) {
      console.error('Error fetching novels:', novelsError);
      return [];
    }

    const authorIds = [...new Set((novelsData || []).map((n: any) => n.author_id).filter(Boolean))];
    const novelIds = (novelsData || []).map((n: any) => n.id);
    
    const [{ data: authors }, viewCountsMap] = await Promise.all([
      supabase.from('users').select('id, name').in('id', authorIds),
      getBulkNovelViewCounts(novelIds)
    ]);
    
    const authorMap = new Map((authors || []).map((a: any) => [a.id, a.name]));
    const novelMap = new Map((novelsData || []).map((n: any) => [n.id, n]));

    return sortedNovelIds
      .filter(id => novelMap.has(id))
      .map(id => {
        const novel = novelMap.get(id)!;
        return {
          id: novel.id,
          title: novel.title,
          coverUrl: novel.cover_url,
          authorId: novel.author_id,
          authorName: authorMap.get(novel.author_id) || 'Unknown',
          genre: novel.genre || '',
          status: novel.status || 'ongoing',
          rating: novel.rating || 0,
          totalReads: viewCountsMap.get(novel.id) || 0,
          totalLikes: 0,
          totalReviews: 0,
          createdAt: novel.created_at,
        };
      });
  } catch (error) {
    console.error('Error in getRecentlyUpdatedNovels:', error);
    return [];
  }
}

export async function getNovelsByGenres(genreSlugs: string[], limit: number = 20): Promise<CollectionNovel[]> {
  try {
    const { data: genresData, error: genresError } = await supabase
      .from('genres')
      .select('id, slug')
      .in('slug', genreSlugs);

    if (genresError) {
      console.error('Error fetching genres:', genresError);
      return [];
    }

    const genreIds = (genresData || []).map((g: any) => g.id);
    
    if (genreIds.length === 0) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('novels')
        .select('id, title, cover_url, author_id, genre, status, rating, created_at')
        .or(genreSlugs.map(slug => `genre.ilike.%${slug}%`).join(','))
        .limit(limit * 2);

      if (fallbackError) {
        console.error('Error fetching novels by genre name:', fallbackError);
        return [];
      }

      const novelIds = (fallbackData || []).map((n: any) => n.id);
      const authorIds = [...new Set((fallbackData || []).map((n: any) => n.author_id).filter(Boolean))];
      const [{ data: authors }, viewCountsMap] = await Promise.all([
        supabase.from('users').select('id, name').in('id', authorIds),
        getBulkNovelViewCounts(novelIds)
      ]);
      
      const authorMap = new Map((authors || []).map((a: any) => [a.id, a.name]));

      return (fallbackData || [])
        .map((novel: any) => ({
          id: novel.id,
          title: novel.title,
          coverUrl: novel.cover_url,
          authorId: novel.author_id,
          authorName: authorMap.get(novel.author_id) || 'Unknown',
          genre: novel.genre || '',
          status: novel.status || 'ongoing',
          rating: novel.rating || 0,
          totalReads: viewCountsMap.get(novel.id) || 0,
          totalLikes: 0,
          totalReviews: 0,
          createdAt: novel.created_at,
        }))
        .sort((a, b) => b.totalReads - a.totalReads)
        .slice(0, limit);
    }

    const { data: novelGenresData, error: novelGenresError } = await supabase
      .from('novel_genres')
      .select('novel_id')
      .in('genre_id', genreIds);

    if (novelGenresError) {
      console.error('Error fetching novel_genres:', novelGenresError);
      return [];
    }

    const novelIds = [...new Set((novelGenresData || []).map((item: any) => item.novel_id))];
    
    if (novelIds.length === 0) return [];

    const { data: novelsData, error: novelsError } = await supabase
      .from('novels')
      .select('id, title, cover_url, author_id, genre, status, rating, created_at')
      .in('id', novelIds)
      .limit(limit * 2);

    if (novelsError) {
      console.error('Error fetching novels:', novelsError);
      return [];
    }

    const fetchedNovelIds = (novelsData || []).map((n: any) => n.id);
    const authorIds = [...new Set((novelsData || []).map((n: any) => n.author_id).filter(Boolean))];
    const [{ data: authors }, viewCountsMap] = await Promise.all([
      supabase.from('users').select('id, name').in('id', authorIds),
      getBulkNovelViewCounts(fetchedNovelIds)
    ]);
    
    const authorMap = new Map((authors || []).map((a: any) => [a.id, a.name]));

    return (novelsData || [])
      .map((novel: any) => ({
        id: novel.id,
        title: novel.title,
        coverUrl: novel.cover_url,
        authorId: novel.author_id,
        authorName: authorMap.get(novel.author_id) || 'Unknown',
        genre: novel.genre || '',
        status: novel.status || 'ongoing',
        rating: novel.rating || 0,
        totalReads: viewCountsMap.get(novel.id) || 0,
        totalLikes: 0,
        totalReviews: 0,
        createdAt: novel.created_at,
      }))
      .sort((a, b) => b.totalReads - a.totalReads)
      .slice(0, limit);
  } catch (error) {
    console.error('Error in getNovelsByGenres:', error);
    return [];
  }
}

// ============================================
// MANUAL PLATFORM STATS (Owner Only)
// ============================================

export interface ManualPlatformStats {
  id: number;
  totalCoinsSold: number;
  platformRevenue: number;
  updatedAt: string;
  updatedBy: string | null;
}

// Get manual platform stats (for owner override)
export async function getManualPlatformStats(): Promise<ManualPlatformStats | null> {
  try {
    const { data, error } = await supabase
      .from('platform_stats')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      totalCoinsSold: data.total_coins_sold || 0,
      platformRevenue: data.platform_revenue || 0,
      updatedAt: data.updated_at,
      updatedBy: data.updated_by,
    };
  } catch (error) {
    console.error('Error in getManualPlatformStats:', error);
    return null;
  }
}

// Upsert manual platform stats (owner only)
export async function upsertManualPlatformStats(
  totalCoinsSold: number,
  platformRevenue: number,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('platform_stats')
      .upsert({
        id: 1,
        total_coins_sold: totalCoinsSold,
        platform_revenue: platformRevenue,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      }, { onConflict: 'id' });

    if (error) {
      console.error('Error upserting platform stats:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in upsertManualPlatformStats:', error);
    return { success: false, error: error.message };
  }
}
