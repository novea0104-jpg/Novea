import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types/models";
import { storage } from "@/utils/storage";

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
      const savedUser = await storage.getUser();
      if (savedUser) {
        const coinBalance = await storage.getCoinBalance();
        setUser({ ...savedUser, coinBalance });
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function signup(email: string, password: string, name: string) {
    // Check if user already exists
    const existingUser = await storage.findUserByEmail(email);
    if (existingUser) {
      throw new Error("An account with this email already exists");
    }

    // Create new user
    const newStoredUser = {
      id: `user-${Date.now()}`,
      email,
      password, // In production, this should be hashed
      name,
      isWriter: false,
      coinBalance: 100, // Welcome bonus
      createdAt: new Date().toISOString(),
    };

    await storage.saveUserToDatabase(newStoredUser);

    // Log the user in
    const newUser: User = {
      id: newStoredUser.id,
      name: newStoredUser.name,
      email: newStoredUser.email,
      isWriter: false,
      coinBalance: 100,
    };

    await storage.setUser(newUser);
    await storage.setCoinBalance(100);
    setUser(newUser);
  }

  async function login(email: string, password: string) {
    const storedUser = await storage.validateCredentials(email, password);
    
    if (!storedUser) {
      throw new Error("Invalid email or password");
    }

    const user: User = {
      id: storedUser.id,
      name: storedUser.name,
      email: storedUser.email,
      isWriter: storedUser.isWriter,
      coinBalance: storedUser.coinBalance,
    };
    
    await storage.setUser(user);
    await storage.setCoinBalance(storedUser.coinBalance);
    setUser(user);
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
