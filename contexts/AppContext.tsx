import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Novel } from "@/types/models";
import { storage } from "@/utils/storage";
import { mockNovels } from "@/utils/mockData";

interface AppContextType {
  novels: Novel[];
  followingNovels: Set<string>;
  unlockedChapters: Set<string>;
  toggleFollow: (novelId: string) => Promise<void>;
  unlockChapter: (chapterId: string, cost: number) => Promise<boolean>;
  searchNovels: (query: string) => Novel[];
  filterNovelsByGenre: (genre: string) => Novel[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [novels] = useState<Novel[]>(mockNovels);
  const [followingNovels, setFollowingNovels] = useState<Set<string>>(new Set());
  const [unlockedChapters, setUnlockedChapters] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const following = await storage.getFollowingNovels();
    const unlocked = await storage.getUnlockedChapters();
    setFollowingNovels(following);
    setUnlockedChapters(unlocked);
  }

  async function toggleFollow(novelId: string) {
    const isFollowing = await storage.toggleFollowNovel(novelId);
    const newFollowing = new Set(followingNovels);
    
    if (isFollowing) {
      newFollowing.add(novelId);
    } else {
      newFollowing.delete(novelId);
    }
    
    setFollowingNovels(newFollowing);
  }

  async function unlockChapter(chapterId: string, cost: number): Promise<boolean> {
    await storage.unlockChapter(chapterId);
    const newUnlocked = new Set(unlockedChapters);
    newUnlocked.add(chapterId);
    setUnlockedChapters(newUnlocked);
    return true;
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
