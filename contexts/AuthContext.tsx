import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/utils/supabase";
import { User } from "@/types/models";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  upgradeToWriter: () => Promise<void>;
  updateCoinBalance: (amount: number) => Promise<void>;
  updateProfile: (updates: { name?: string; bio?: string; avatarUrl?: string }) => Promise<void>;
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
          role: (userProfile.role || 'pembaca') as any,
          coinBalance: userProfile.coin_balance,
          avatarUrl: userProfile.avatar_url || undefined,
          bio: userProfile.bio || undefined,
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
      role: (userProfile.role || 'pembaca') as any,
      coinBalance: userProfile.coin_balance,
      avatarUrl: userProfile.avatar_url || undefined,
      bio: userProfile.bio || undefined,
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
    try {
      // Sign out from Supabase Auth
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  }

  async function upgradeToWriter() {
    if (!user) return;
    
    // Only upgrade if user is currently 'pembaca'
    if (user.role !== 'pembaca') return;
    
    // Call secure database function to upgrade role
    // This bypasses RLS restrictions for safe role upgrades
    const { data, error } = await supabase.rpc('upgrade_user_to_writer');

    if (error) {
      console.error('Error upgrading to writer:', error);
      throw error;
    }

    // Update local state with returned user data
    const updatedUser: User = {
      id: data.id.toString(),
      name: data.name,
      email: data.email,
      isWriter: data.is_writer,
      role: data.role as any,
      coinBalance: data.coin_balance,
      avatarUrl: data.avatar_url || undefined,
      bio: data.bio || undefined,
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
      role: (data.role || 'pembaca') as any,
      coinBalance: data.coin_balance,
      avatarUrl: data.avatar_url || undefined,
      bio: data.bio || undefined,
    };
    setUser(updatedUser);
  }

  async function updateProfile(updates: { name?: string; bio?: string; avatarUrl?: string }) {
    if (!user) return;

    // Build update object with snake_case for database
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

    // Update profile in Supabase
    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', parseInt(user.id))
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw error;
    }

    // Update local state
    const updatedUser: User = {
      id: data.id.toString(),
      name: data.name,
      email: data.email,
      isWriter: data.is_writer,
      role: (data.role || 'pembaca') as any,
      coinBalance: data.coin_balance,
      avatarUrl: data.avatar_url || undefined,
      bio: data.bio || undefined,
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
        upgradeToWriter,
        updateCoinBalance,
        updateProfile,
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
