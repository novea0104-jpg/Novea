import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Novel, Chapter } from "@/types/models";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface ReadingHistoryItem {
  novelId: string;
  lastReadAt: Date;
}

interface AppContextType {
  novels: Novel[];
  followingNovels: Set<string>;
  likedNovels: Set<string>;
  readingHistory: ReadingHistoryItem[];
  unlockedChapters: Set<string>;
  isLoading: boolean;
  toggleFollow: (novelId: string) => Promise<void>;
  toggleLike: (novelId: string) => Promise<void>;
  unlockChapter: (chapterId: string, cost: number) => Promise<boolean>;
  searchNovels: (query: string) => Novel[];
  filterNovelsByGenre: (genre: string) => Novel[];
  getChaptersForNovel: (novelId: string) => Promise<Chapter[]>;
  getChapter: (chapterId: string) => Promise<Chapter | null>;
  refreshNovels: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [followingNovels, setFollowingNovels] = useState<Set<string>>(new Set());
  const [likedNovels, setLikedNovels] = useState<Set<string>>(new Set());
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>([]);
  const [unlockedChapters, setUnlockedChapters] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    try {
      setIsLoading(true);

      // Fetch all novels from Supabase
      const { data: novelsData, error: novelsError } = await supabase
        .from('novels')
        .select('*')
        .order('created_at', { ascending: false });

      if (novelsError) throw novelsError;

      const novelIds = (novelsData || []).map(n => n.id);
      const ratingCountsMap = new Map<number, number>();
      const viewCountsMap = new Map<number, number>();

      if (novelIds.length > 0) {
        // Fetch view counts from novel_views table
        const { data: viewsData } = await supabase
          .from('novel_views')
          .select('novel_id')
          .in('novel_id', novelIds);

        if (viewsData) {
          viewsData.forEach((view: any) => {
            const currentCount = viewCountsMap.get(view.novel_id) || 0;
            viewCountsMap.set(view.novel_id, currentCount + 1);
          });
        }

        // Fetch rating counts from novel_reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('novel_reviews')
          .select('novel_id')
          .in('novel_id', novelIds);

        if (!reviewsError && reviewsData) {
          reviewsData.forEach(review => {
            const currentCount = ratingCountsMap.get(review.novel_id) || 0;
            ratingCountsMap.set(review.novel_id, currentCount + 1);
          });
        }

        // Fetch novel likes counts
        const novelLikesMap = new Map<number, number>();
        const { data: novelLikesData } = await supabase
          .from('novel_likes')
          .select('novel_id')
          .in('novel_id', novelIds);

        if (novelLikesData) {
          novelLikesData.forEach(like => {
            const currentCount = novelLikesMap.get(like.novel_id) || 0;
            novelLikesMap.set(like.novel_id, currentCount + 1);
          });
        }

        // Fetch chapter likes counts
        const chapterLikesMap = new Map<number, number>();
        const { data: chapterLikesData } = await supabase
          .from('chapter_likes')
          .select('novel_id')
          .in('novel_id', novelIds);

        if (chapterLikesData) {
          chapterLikesData.forEach(like => {
            const currentCount = chapterLikesMap.get(like.novel_id) || 0;
            chapterLikesMap.set(like.novel_id, currentCount + 1);
          });
        }

        // Store maps for later use in novel mapping
        (globalThis as any).__novelLikesMap = novelLikesMap;
        (globalThis as any).__chapterLikesMap = chapterLikesMap;
        (globalThis as any).__viewCountsMap = viewCountsMap;
      }

      // Fetch user-specific data if logged in
      let followingSet = new Set<string>();
      let likedSet = new Set<string>();
      let unlockedSet = new Set<string>();
      let historyList: ReadingHistoryItem[] = [];

      if (user) {
        // Fetch following novels
        const { data: followingData, error: followingError } = await supabase
          .from('following_novels')
          .select('novel_id')
          .eq('user_id', parseInt(user.id));

        if (!followingError && followingData) {
          followingSet = new Set(followingData.map(f => f.novel_id.toString()));
        }

        // Fetch liked novels
        const { data: likedData, error: likedError } = await supabase
          .from('novel_likes')
          .select('novel_id')
          .eq('user_id', parseInt(user.id));

        if (!likedError && likedData) {
          likedSet = new Set(likedData.map(l => l.novel_id.toString()));
        }

        // Fetch reading history (novels user has read)
        const { data: historyData, error: historyError } = await supabase
          .from('reading_progress')
          .select('novel_id, last_read_at')
          .eq('user_id', parseInt(user.id))
          .order('last_read_at', { ascending: false });

        if (!historyError && historyData) {
          // Get unique novels with latest read time
          const uniqueNovels = new Map<string, Date>();
          historyData.forEach(h => {
            const novelId = h.novel_id.toString();
            if (!uniqueNovels.has(novelId)) {
              uniqueNovels.set(novelId, new Date(h.last_read_at));
            }
          });
          historyList = Array.from(uniqueNovels.entries()).map(([novelId, lastReadAt]) => ({
            novelId,
            lastReadAt,
          }));
        }

        // Fetch unlocked chapters
        const { data: unlockedData, error: unlockedError } = await supabase
          .from('unlocked_chapters')
          .select('chapter_id')
          .eq('user_id', parseInt(user.id));

        if (!unlockedError && unlockedData) {
          unlockedSet = new Set(unlockedData.map(u => u.chapter_id.toString()));
        }

        setFollowingNovels(followingSet);
        setLikedNovels(likedSet);
        setReadingHistory(historyList);
        setUnlockedChapters(unlockedSet);
      } else {
        // Clear user-specific data when logged out
        setFollowingNovels(new Set());
        setLikedNovels(new Set());
        setReadingHistory([]);
        setUnlockedChapters(new Set());
      }

      // Get maps from global storage
      const novelLikesMap = (globalThis as any).__novelLikesMap || new Map<number, number>();
      const chapterLikesMap = (globalThis as any).__chapterLikesMap || new Map<number, number>();
      const globalViewCountsMap = (globalThis as any).__viewCountsMap || new Map<number, number>();

      // Convert API novels to app Novel type
      const convertedNovels: Novel[] = (novelsData || []).map(apiNovel => ({
        id: apiNovel.id.toString(),
        title: apiNovel.title,
        author: apiNovel.author,
        authorId: apiNovel.author_id?.toString() || "0",
        coverImage: apiNovel.cover_url || "",
        genre: apiNovel.genre as any,
        status: apiNovel.status as any,
        rating: apiNovel.rating,
        ratingCount: ratingCountsMap.get(apiNovel.id) || 0,
        synopsis: apiNovel.description,
        coinPerChapter: apiNovel.chapter_price,
        freeChapters: apiNovel.free_chapters,
        totalChapters: apiNovel.total_chapters,
        followers: globalViewCountsMap.get(apiNovel.id) || viewCountsMap.get(apiNovel.id) || 0,
        totalLikes: (novelLikesMap.get(apiNovel.id) || 0) + (chapterLikesMap.get(apiNovel.id) || 0),
        isFollowing: followingSet.has(apiNovel.id.toString()),
        createdAt: new Date(apiNovel.created_at),
        lastUpdated: new Date(apiNovel.updated_at),
      }));

      setNovels(convertedNovels);
    } catch (error) {
      console.error("Error loading app data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleFollow(novelId: string) {
    if (!user) {
      throw new Error("Must be logged in to follow novels");
    }

    const isCurrentlyFollowing = followingNovels.has(novelId);
    const newFollowing = new Set(followingNovels);

    if (isCurrentlyFollowing) {
      // Unfollow: Delete from following_novels
      const { error } = await supabase
        .from('following_novels')
        .delete()
        .eq('user_id', parseInt(user.id))
        .eq('novel_id', parseInt(novelId));

      if (error) throw error;
      newFollowing.delete(novelId);
    } else {
      // Follow: Insert into following_novels
      const { error } = await supabase
        .from('following_novels')
        .insert({
          user_id: parseInt(user.id),
          novel_id: parseInt(novelId),
        });

      if (error) throw error;
      newFollowing.add(novelId);
    }

    setFollowingNovels(newFollowing);

    // Update novels array to reflect new isFollowing state
    setNovels(prevNovels =>
      prevNovels.map(novel =>
        novel.id === novelId
          ? { ...novel, isFollowing: !isCurrentlyFollowing }
          : novel
      )
    );
  }

  async function toggleLike(novelId: string) {
    if (!user) {
      throw new Error("Must be logged in to like novels");
    }

    const isCurrentlyLiked = likedNovels.has(novelId);
    const newLiked = new Set(likedNovels);

    if (isCurrentlyLiked) {
      // Unlike: Delete from novel_likes
      const { error } = await supabase
        .from('novel_likes')
        .delete()
        .eq('user_id', parseInt(user.id))
        .eq('novel_id', parseInt(novelId));

      if (error) throw error;
      newLiked.delete(novelId);
    } else {
      // Like: Insert into novel_likes
      const { error } = await supabase
        .from('novel_likes')
        .insert({
          user_id: parseInt(user.id),
          novel_id: parseInt(novelId),
        });

      if (error) throw error;
      newLiked.add(novelId);
    }

    setLikedNovels(newLiked);
  }

  async function unlockChapter(chapterId: string, cost: number): Promise<boolean> {
    if (!user) {
      throw new Error("Silakan masuk terlebih dahulu");
    }

    try {
      // Check if user has enough coins locally first
      if (user.coinBalance < cost) {
        throw new Error("Koin tidak cukup");
      }

      // Call secure RPC function to handle all unlock operations
      const { data, error } = await supabase.rpc('unlock_chapter_secure', {
        p_user_id: parseInt(user.id),
        p_chapter_id: parseInt(chapterId),
        p_cost: cost,
      });

      if (error) {
        console.error('RPC error:', error);
        throw new Error(error.message || 'Gagal membuka chapter');
      }

      // Check RPC result
      if (!data?.success) {
        throw new Error(data?.error || 'Gagal membuka chapter');
      }

      // Refresh user data to get updated coin balance from database
      await refreshUser();

      // Update local unlocked chapters
      const newUnlocked = new Set(unlockedChapters);
      newUnlocked.add(chapterId);
      setUnlockedChapters(newUnlocked);

      return true;
    } catch (error: any) {
      console.error("Error unlocking chapter:", error);
      throw error;
    }
  }

  function searchNovels(query: string): Novel[] {
    const lowerQuery = query.toLowerCase();
    return novels.filter(
      (novel) =>
        novel.title.toLowerCase().includes(lowerQuery) ||
        novel.author.toLowerCase().includes(lowerQuery) ||
        novel.genre.toLowerCase().includes(lowerQuery)
    );
  }

  function filterNovelsByGenre(genre: string): Novel[] {
    return novels.filter((novel) => novel.genre === genre);
  }

  async function getChaptersForNovel(novelId: string): Promise<Chapter[]> {
    try {
      const { data: chaptersData, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('novel_id', parseInt(novelId))
        .order('chapter_number', { ascending: true });

      if (error) throw error;

      // Convert to app Chapter type
      const chapters: Chapter[] = (chaptersData || []).map(ch => ({
        id: ch.id.toString(),
        novelId: ch.novel_id.toString(),
        chapterNumber: ch.chapter_number,
        title: ch.title,
        content: ch.content,
        wordCount: ch.word_count,
        isFree: ch.is_free,
        publishedAt: new Date(ch.published_at),
        price: ch.price || 0,
      }));

      return chapters;
    } catch (error) {
      console.error("Error fetching chapters:", error);
      return [];
    }
  }

  async function getChapter(chapterId: string): Promise<Chapter | null> {
    try {
      const { data: chapterData, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', parseInt(chapterId))
        .single();

      if (error) throw error;
      if (!chapterData) return null;

      const chapter: Chapter = {
        id: chapterData.id.toString(),
        novelId: chapterData.novel_id.toString(),
        chapterNumber: chapterData.chapter_number,
        title: chapterData.title,
        content: chapterData.content,
        wordCount: chapterData.word_count,
        isFree: chapterData.is_free,
        publishedAt: new Date(chapterData.published_at),
        price: chapterData.price || 0,
      };

      return chapter;
    } catch (error) {
      console.error("Error fetching chapter:", error);
      return null;
    }
  }

  async function refreshNovels(): Promise<void> {
    await loadData();
  }

  return (
    <AppContext.Provider
      value={{
        novels,
        followingNovels,
        likedNovels,
        readingHistory,
        unlockedChapters,
        isLoading,
        toggleFollow,
        toggleLike,
        unlockChapter,
        searchNovels,
        filterNovelsByGenre,
        getChaptersForNovel,
        getChapter,
        refreshNovels,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
