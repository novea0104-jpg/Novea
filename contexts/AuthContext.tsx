import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types/models";
import { storage } from "@/utils/storage";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
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
      const savedUser = await storage.getUser();
      if (savedUser) {
        const coinBalance = await storage.getCoinBalance();
        setUser({ ...savedUser, coinBalance });
      } else {
        const defaultUser: User = {
          id: "user-1",
          name: "Demo User",
          email: "demo@novea.app",
          isWriter: false,
          coinBalance: 100,
        };
        await storage.setUser(defaultUser);
        await storage.setCoinBalance(100);
        setUser(defaultUser);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const newUser: User = {
      id: "user-1",
      name: email.split("@")[0],
      email,
      isWriter: false,
      coinBalance: 100,
    };
    
    await storage.setUser(newUser);
    await storage.setCoinBalance(100);
    setUser(newUser);
  }

  async function logout() {
    await storage.clearAll();
    setUser(null);
  }

  async function toggleWriterMode() {
    if (!user) return;
    
    const updatedUser = { ...user, isWriter: !user.isWriter };
    await storage.setUser(updatedUser);
    setUser(updatedUser);
  }

  async function updateCoinBalance(amount: number) {
    if (!user) return;
    
    const newBalance = user.coinBalance + amount;
    await storage.setCoinBalance(newBalance);
    setUser({ ...user, coinBalance: newBalance });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
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
