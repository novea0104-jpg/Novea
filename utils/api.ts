/**
 * API Client for Novea Backend
 * Handles all HTTP requests to the Express backend server
 */

// Determine API base URL based on environment
const getApiBaseUrl = () => {
  // Priority 1: Use explicit API URL from environment variable
  // For Expo Go on physical devices, set EXPO_PUBLIC_API_URL to Replit HTTPS tunnel
  // Example: https://your-repl-name.replit.app/api (port 3000 mapped to external 3003)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Priority 2: Web preview - backend on localhost:3000
  if (typeof window !== 'undefined') {
    return 'http://localhost:3000/api';
  }

  // Priority 3: Fallback for native (Expo Go) - use localhost
  // Note: This will only work in simulators/emulators
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

interface ApiError {
  error: string;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  isWriter: boolean;
  coinBalance: number;
}

export interface Novel {
  id: number;
  title: string;
  author: string;
  authorId: number | null;
  genre: string;
  description: string;
  coverUrl: string | null;
  status: string;
  rating: number;
  totalChapters: number;
  freeChapters: number;
  chapterPrice: number;
  totalReads: number;
  chapters?: Chapter[];
}

export interface Chapter {
  id: number;
  novelId: number;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  isFree: boolean;
  price: number;
}

// Store userId in memory for API requests
let currentUserId: number | null = null;

export function setCurrentUserId(userId: number | null) {
  currentUserId = userId;
}

export function getCurrentUserId(): number | null {
  return currentUserId;
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add user ID to headers if available
  if (currentUserId !== null) {
    (headers as Record<string, string>)['x-user-id'] = currentUserId.toString();
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }

  return data;
}

/**
 * Auth API
 */
export const authApi = {
  async signup(email: string, password: string, name: string): Promise<User> {
    const response = await apiFetch<{ user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    return response.user;
  },

  async login(email: string, password: string): Promise<User> {
    const response = await apiFetch<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response.user;
  },

  async getMe(): Promise<User> {
    const response = await apiFetch<{ user: User }>('/auth/me');
    return response.user;
  },

  async updateMe(updates: Partial<Pick<User, 'isWriter' | 'coinBalance'>>): Promise<User> {
    const response = await apiFetch<{ user: User }>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return response.user;
  },
};

/**
 * Novels API
 */
export const novelsApi = {
  async getAll(): Promise<Novel[]> {
    const response = await apiFetch<{ novels: Novel[] }>('/novels');
    return response.novels;
  },

  async getById(id: number): Promise<Novel> {
    const response = await apiFetch<{ novel: Novel }>(`/novels/${id}`);
    return response.novel;
  },

  async follow(novelId: number): Promise<{ isFollowing: boolean }> {
    return await apiFetch(`/novels/${novelId}/follow`, {
      method: 'POST',
    });
  },
};

/**
 * Chapters API
 */
export const chaptersApi = {
  async getById(id: number): Promise<{ chapter: Chapter; isUnlocked: boolean }> {
    return await apiFetch(`/chapters/${id}`);
  },

  async unlock(chapterId: number): Promise<{ coinBalance: number }> {
    return await apiFetch(`/chapters/${chapterId}/unlock`, {
      method: 'POST',
    });
  },
};

/**
 * User Data API
 */
export const userDataApi = {
  async getUnlockedChapters(): Promise<number[]> {
    const response = await apiFetch<{ unlockedChapters: Array<{ chapterId: number }> }>(
      '/user/unlocked-chapters'
    );
    return response.unlockedChapters.map(uc => uc.chapterId);
  },

  async getFollowing(): Promise<number[]> {
    const response = await apiFetch<{ following: Array<{ novelId: number }> }>(
      '/user/following'
    );
    return response.following.map(f => f.novelId);
  },

  async getReadingProgress(): Promise<any[]> {
    const response = await apiFetch<{ progress: any[] }>('/user/reading-progress');
    return response.progress;
  },

  async updateReadingProgress(novelId: number, chapterId: number, progress: number): Promise<void> {
    await apiFetch('/reading-progress', {
      method: 'POST',
      body: JSON.stringify({ novelId, chapterId, progress }),
    });
  },
};
