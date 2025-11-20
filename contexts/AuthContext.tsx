import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi, setCurrentUserId, User as ApiUser } from "@/utils/api";
import { User } from "@/types/models";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleWriterMode: () => Promise<void>;
  updateCoinBalance: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      // Try to load user ID from AsyncStorage (session persistence)
      const userIdStr = await AsyncStorage.getItem("@novea_user_id");
      if (userIdStr) {
        const userId = parseInt(userIdStr, 10);
        setCurrentUserId(userId);

        // Fetch fresh user data from backend
        const apiUser = await authApi.getMe();
        const user: User = {
          id: apiUser.id.toString(),
          name: apiUser.name,
          email: apiUser.email,
          isWriter: apiUser.isWriter,
          coinBalance: apiUser.coinBalance,
        };
        setUser(user);
      }
    } catch (error) {
      console.error("Error loading user:", error);
      // Clear invalid session
      await AsyncStorage.removeItem("@novea_user_id");
      setCurrentUserId(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function signup(email: string, password: string, name: string) {
    // Call backend signup API
    const apiUser = await authApi.signup(email, password, name);

    // Store user ID locally for session persistence
    await AsyncStorage.setItem("@novea_user_id", apiUser.id.toString());
    setCurrentUserId(apiUser.id);

    // Update local state
    const newUser: User = {
      id: apiUser.id.toString(),
      name: apiUser.name,
      email: apiUser.email,
      isWriter: apiUser.isWriter,
      coinBalance: apiUser.coinBalance,
    };
    setUser(newUser);
  }

  async function login(email: string, password: string) {
    // Call backend login API
    const apiUser = await authApi.login(email, password);

    // Store user ID locally for session persistence
    await AsyncStorage.setItem("@novea_user_id", apiUser.id.toString());
    setCurrentUserId(apiUser.id);

    // Update local state
    const user: User = {
      id: apiUser.id.toString(),
      name: apiUser.name,
      email: apiUser.email,
      isWriter: apiUser.isWriter,
      coinBalance: apiUser.coinBalance,
    };
    setUser(user);
  }

  async function logout() {
    // Clear local session
    await AsyncStorage.removeItem("@novea_user_id");
    setCurrentUserId(null);
    setUser(null);
  }

  async function toggleWriterMode() {
    if (!user) return;
    
    const newIsWriter = !user.isWriter;
    
    // Update via backend API - send both fields to avoid NULL in NOT NULL columns
    const apiUser = await authApi.updateMe({ 
      isWriter: newIsWriter,
      coinBalance: user.coinBalance, // Include current balance
    });
    
    // Update local state
    const updatedUser: User = {
      id: apiUser.id.toString(),
      name: apiUser.name,
      email: apiUser.email,
      isWriter: apiUser.isWriter,
      coinBalance: apiUser.coinBalance,
    };
    setUser(updatedUser);
  }

  async function updateCoinBalance(amount: number) {
    if (!user) return;
    
    const newBalance = user.coinBalance + amount;
    
    // Update via backend API - send both fields to avoid NULL in NOT NULL columns
    const apiUser = await authApi.updateMe({ 
      coinBalance: newBalance,
      isWriter: user.isWriter, // Include current writer mode
    });
    
    // Update local state
    const updatedUser: User = {
      id: apiUser.id.toString(),
      name: apiUser.name,
      email: apiUser.email,
      isWriter: apiUser.isWriter,
      coinBalance: apiUser.coinBalance,
    };
    setUser(updatedUser);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        toggleWriterMode,
        updateCoinBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
