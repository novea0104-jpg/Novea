import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/utils/supabase";
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

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user.email!);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function loadUser() {
    try {
      // Check if user session exists in Supabase Auth
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await loadUserProfile(session.user.email!);
      }
    } catch (error) {
      console.error("Error loading user:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUserProfile(email: string) {
    try {
      // Fetch user profile from users table using email
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;

      if (userProfile) {
        const user: User = {
          id: userProfile.id.toString(),
          name: userProfile.name,
          email: userProfile.email,
          isWriter: userProfile.is_writer,
          coinBalance: userProfile.coin_balance,
        };
        setUser(user);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  }

  async function signup(email: string, password: string, name: string) {
    // Step 1: Create auth user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Signup failed");

    // Step 2: Create user profile in users table (uses auto-increment ID)
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        email,
        name,
        is_writer: false,
        coin_balance: 100,
      })
      .select()
      .single();

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      console.error("Profile creation failed, cleaning up auth user:", profileError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    // Step 3: Update local state
    const newUser: User = {
      id: userProfile.id.toString(),
      name: userProfile.name,
      email: userProfile.email,
      isWriter: userProfile.is_writer,
      coinBalance: userProfile.coin_balance,
    };
    setUser(newUser);
  }

  async function login(email: string, password: string) {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Login failed");

    // Load user profile from users table
    await loadUserProfile(email);
  }

  async function logout() {
    // Sign out from Supabase Auth
    await supabase.auth.signOut();
    setUser(null);
  }

  async function toggleWriterMode() {
    if (!user) return;
    
    const newIsWriter = !user.isWriter;
    
    // Update user profile in Supabase
    const { data, error } = await supabase
      .from('users')
      .update({ is_writer: newIsWriter })
      .eq('id', parseInt(user.id))
      .select()
      .single();

    if (error) throw error;

    // Update local state
    const updatedUser: User = {
      id: data.id.toString(),
      name: data.name,
      email: data.email,
      isWriter: data.is_writer,
      coinBalance: data.coin_balance,
    };
    setUser(updatedUser);
  }

  async function updateCoinBalance(amount: number) {
    if (!user) return;
    
    const newBalance = user.coinBalance + amount;
    
    // Update coin balance in Supabase
    const { data, error } = await supabase
      .from('users')
      .update({ coin_balance: newBalance })
      .eq('id', parseInt(user.id))
      .select()
      .single();

    if (error) throw error;

    // Update local state
    const updatedUser: User = {
      id: data.id.toString(),
      name: data.name,
      email: data.email,
      isWriter: data.is_writer,
      coinBalance: data.coin_balance,
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
