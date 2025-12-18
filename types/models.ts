export type Genre = "Romance" | "Fantasy" | "Thriller" | "Mystery" | "Adventure" | "Sci-Fi" | "Drama" | "Horror" | "Comedy" | "Action" | "Chicklit" | "Teenlit" | "Apocalypse" | "Pernikahan" | "Sistem" | "Urban" | "Fanfiction";

export type NovelStatus = "On-Going" | "Completed";

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export type UserRole = 'pembaca' | 'penulis' | 'editor' | 'co_admin' | 'super_admin';

export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'telegram' | 'twitter' | 'youtube';

export interface SocialLink {
  url: string;
  handle: string;
}

export type SocialLinks = Partial<Record<SocialPlatform, SocialLink>>;

export interface User {
  id: string;
  name: string;
  email: string;
  isWriter: boolean;
  role: UserRole;
  coinBalance: number;
  silverBalance: number;
  avatarUrl?: string;
  bio?: string;
  lastClaimDate?: string;
  claimStreak: number;
  socialLinks?: SocialLinks;
}

export interface Novel {
  id: string;
  title: string;
  author: string;
  authorId: string;
  coverImage: string;
  genre: Genre;
  status: NovelStatus;
  rating: number;
  ratingCount: number;
  synopsis: string;
  coinPerChapter: number;
  freeChapters: number;
  totalChapters: number;
  followers: number;
  totalLikes: number;
  isFollowing?: boolean;
  createdAt: Date;
  lastUpdated: Date;
}

export interface Chapter {
  id: string;
  novelId: string;
  chapterNumber: number;
  title: string;
  content: string;
  isFree: boolean;
  isUnlocked?: boolean;
  publishedAt: Date;
  wordCount: number;
  price: number;
}

export interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  bonus: number;
  isPopular?: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  novelId?: string;
  type: "new_chapter" | "system" | "promotion";
  isRead: boolean;
  createdAt: Date;
}

export interface ReadingProgress {
  novelId: string;
  chapterId: string;
  progress: number;
  lastRead: Date;
}

export interface WriterStats {
  totalReaders: number;
  totalEarnings: number;
  pendingWithdrawal: number;
}
