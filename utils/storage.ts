import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, ReadingProgress } from "@/types/models";

const KEYS = {
  USER: "@novea_user",
  COIN_BALANCE: "@novea_coin_balance",
  UNLOCKED_CHAPTERS: "@novea_unlocked_chapters",
  FOLLOWING_NOVELS: "@novea_following_novels",
  READING_PROGRESS: "@novea_reading_progress",
  NOTIFICATIONS_READ: "@novea_notifications_read",
};

export const storage = {
  async getUser(): Promise<User | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  },

  async setUser(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error("Error setting user:", error);
    }
  },

  async clearUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.USER);
    } catch (error) {
      console.error("Error clearing user:", error);
    }
  },

  async getCoinBalance(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(KEYS.COIN_BALANCE);
      return data ? parseInt(data, 10) : 0;
    } catch (error) {
      console.error("Error getting coin balance:", error);
      return 0;
    }
  },

  async setCoinBalance(balance: number): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.COIN_BALANCE, balance.toString());
    } catch (error) {
      console.error("Error setting coin balance:", error);
    }
  },

  async getUnlockedChapters(): Promise<Set<string>> {
    try {
      const data = await AsyncStorage.getItem(KEYS.UNLOCKED_CHAPTERS);
      return data ? new Set(JSON.parse(data)) : new Set();
    } catch (error) {
      console.error("Error getting unlocked chapters:", error);
      return new Set();
    }
  },

  async unlockChapter(chapterId: string): Promise<void> {
    try {
      const unlocked = await this.getUnlockedChapters();
      unlocked.add(chapterId);
      await AsyncStorage.setItem(
        KEYS.UNLOCKED_CHAPTERS,
        JSON.stringify(Array.from(unlocked))
      );
    } catch (error) {
      console.error("Error unlocking chapter:", error);
    }
  },

  async getFollowingNovels(): Promise<Set<string>> {
    try {
      const data = await AsyncStorage.getItem(KEYS.FOLLOWING_NOVELS);
      return data ? new Set(JSON.parse(data)) : new Set();
    } catch (error) {
      console.error("Error getting following novels:", error);
      return new Set();
    }
  },

  async toggleFollowNovel(novelId: string): Promise<boolean> {
    try {
      const following = await this.getFollowingNovels();
      const isFollowing = following.has(novelId);
      
      if (isFollowing) {
        following.delete(novelId);
      } else {
        following.add(novelId);
      }
      
      await AsyncStorage.setItem(
        KEYS.FOLLOWING_NOVELS,
        JSON.stringify(Array.from(following))
      );
      
      return !isFollowing;
    } catch (error) {
      console.error("Error toggling follow novel:", error);
      return false;
    }
  },

  async getReadingProgress(): Promise<ReadingProgress[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.READING_PROGRESS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting reading progress:", error);
      return [];
    }
  },

  async updateReadingProgress(progress: ReadingProgress): Promise<void> {
    try {
      const allProgress = await this.getReadingProgress();
      const index = allProgress.findIndex((p) => p.novelId === progress.novelId);
      
      if (index >= 0) {
        allProgress[index] = progress;
      } else {
        allProgress.push(progress);
      }
      
      await AsyncStorage.setItem(KEYS.READING_PROGRESS, JSON.stringify(allProgress));
    } catch (error) {
      console.error("Error updating reading progress:", error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  },
};
