import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Novel } from "@/types/models";
import { novelsApi, chaptersApi, userDataApi } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";

interface AppContextType {
  novels: Novel[];
  followingNovels: Set<string>;
  unlockedChapters: Set<string>;
  isLoading: boolean;
  toggleFollow: (novelId: string) => Promise<void>;
  unlockChapter: (chapterId: string, cost: number) => Promise<boolean>;
  searchNovels: (query: string) => Novel[];
  filterNovelsByGenre: (genre: string) => Novel[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [followingNovels, setFollowingNovels] = useState<Set<string>>(new Set());
  const [unlockedChapters, setUnlockedChapters] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    try {
      setIsLoading(true);

      // Fetch novels first (store temporarily)
      const novelsData = await novelsApi.getAll();

      // Fetch user-specific data if logged in
      let followingSet = new Set<string>();
      let unlockedSet = new Set<string>();

      if (user) {
        const [followingIds, unlockedIds] = await Promise.all([
          userDataApi.getFollowing(),
          userDataApi.getUnlockedChapters(),
        ]);
        
        followingSet = new Set(followingIds.map(id => id.toString()));
        unlockedSet = new Set(unlockedIds.map(id => id.toString()));
        
        setFollowingNovels(followingSet);
        setUnlockedChapters(unlockedSet);
      } else {
        // Clear user-specific data when logged out
        setFollowingNovels(new Set());
        setUnlockedChapters(new Set());
      }

      // NOW convert novels with FRESH following data
      const convertedNovels: Novel[] = novelsData.map(apiNovel => ({
        id: apiNovel.id.toString(),
        title: apiNovel.title,
        author: apiNovel.author,
        authorId: apiNovel.authorId?.toString() || "0",
        coverImage: apiNovel.coverUrl || "",
        genre: apiNovel.genre as any,
        status: apiNovel.status as any,
        rating: apiNovel.rating,
        ratingCount: 0, // Backend doesn't track this yet
        synopsis: apiNovel.description,
        coinPerChapter: apiNovel.chapterPrice,
        totalChapters: apiNovel.totalChapters,
        followers: apiNovel.totalReads,
        isFollowing: followingSet.has(apiNovel.id.toString()), // Use FRESH data
        lastUpdated: new Date(), // Backend doesn't expose timestamps yet
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

    // Call backend API
    const result = await novelsApi.follow(parseInt(novelId, 10));
    
    // Update following Set
    const newFollowing = new Set(followingNovels);
    if (result.isFollowing) {
      newFollowing.add(novelId);
    } else {
      newFollowing.delete(novelId);
    }
    setFollowingNovels(newFollowing);

    // Update novels array to reflect new isFollowing state
    setNovels(prevNovels => 
      prevNovels.map(novel => 
        novel.id === novelId 
          ? { ...novel, isFollowing: result.isFollowing }
          : novel
      )
    );
  }

  async function unlockChapter(chapterId: string, cost: number): Promise<boolean> {
    if (!user) {
      throw new Error("Must be logged in to unlock chapters");
    }

    try {
      // Call backend API to unlock chapter (deducts coins and returns new balance)
      const result = await chaptersApi.unlock(parseInt(chapterId, 10));
      
      // Update local unlocked chapters
      const newUnlocked = new Set(unlockedChapters);
      newUnlocked.add(chapterId);
      setUnlockedChapters(newUnlocked);
      
      // Note: Backend already deducted coins
      // AuthContext should refresh user data via GET /auth/me to get new balance
      // Or we could call updateCoinBalance(-cost) here, but that would double-deduct
      // For now, rely on AuthContext refreshing when needed
      
      return true;
    } catch (error) {
      console.error("Error unlocking chapter:", error);
      return false;
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

  return (
    <AppContext.Provider
      value={{
        novels,
        followingNovels,
        unlockedChapters,
        isLoading,
        toggleFollow,
        unlockChapter,
        searchNovels,
        filterNovelsByGenre,
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
