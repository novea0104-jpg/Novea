import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, ReadingProgress } from "@/types/models";

const KEYS = {
  USER: "@novea_user",
  COIN_BALANCE: "@novea_coin_balance",
  UNLOCKED_CHAPTERS: "@novea_unlocked_chapters",
  FOLLOWING_NOVELS: "@novea_following_novels",
  READING_PROGRESS: "@novea_reading_progress",
  NOTIFICATIONS_READ: "@novea_notifications_read",
  USERS_DB: "@novea_users_database",
};

interface StoredUser {
  email: string;
  password: string;
  name: string;
  id: string;
  isWriter: boolean;
  coinBalance: number;
  createdAt: string;
}

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

  async clearSession(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(KEYS.USER),
        AsyncStorage.removeItem(KEYS.COIN_BALANCE),
        AsyncStorage.removeItem(KEYS.UNLOCKED_CHAPTERS),
        AsyncStorage.removeItem(KEYS.FOLLOWING_NOVELS),
        AsyncStorage.removeItem(KEYS.READING_PROGRESS),
        AsyncStorage.removeItem(KEYS.NOTIFICATIONS_READ),
      ]);
    } catch (error) {
      console.error("Error clearing session:", error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  },

  // Multi-user authentication
  async getUsersDatabase(): Promise<StoredUser[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USERS_DB);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting users database:", error);
      return [];
    }
  },

  async saveUserToDatabase(user: StoredUser): Promise<void> {
    try {
      const users = await this.getUsersDatabase();
      users.push(user);
      await AsyncStorage.setItem(KEYS.USERS_DB, JSON.stringify(users));
    } catch (error) {
      console.error("Error saving user to database:", error);
      throw new Error("Failed to create account");
    }
  },

  async findUserByEmail(email: string): Promise<StoredUser | null> {
    try {
      const users = await this.getUsersDatabase();
      return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
    } catch (error) {
      console.error("Error finding user by email:", error);
      return null;
    }
  },

  async validateCredentials(email: string, password: string): Promise<StoredUser | null> {
    try {
      const user = await this.findUserByEmail(email);
      if (user && user.password === password) {
        return user;
      }
      return null;
    } catch (error) {
      console.error("Error validating credentials:", error);
      return null;
    }
  },

  async updateUserInDatabase(userId: string, updates: Partial<StoredUser>): Promise<void> {
    try {
      const users = await this.getUsersDatabase();
      const index = users.findIndex(u => u.id === userId);
      
      if (index >= 0) {
        users[index] = { ...users[index], ...updates };
        await AsyncStorage.setItem(KEYS.USERS_DB, JSON.stringify(users));
      }
    } catch (error) {
      console.error("Error updating user in database:", error);
      throw new Error("Failed to update user");
    }
  },
};
