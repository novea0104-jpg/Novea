import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "@/utils/supabase";
import { User } from "@/types/models";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isGuest: boolean;
  isAuthPromptVisible: boolean;
  authPromptMessage: string;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  upgradeToWriter: () => Promise<void>;
  updateCoinBalance: (amount: number) => Promise<void>;
  convertSilverToGold: (goldAmount?: number) => Promise<{ success: boolean; error?: string }>;
  claimDailyReward: () => Promise<{ success: boolean; amount?: number; error?: string }>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: { name?: string; bio?: string; avatarUrl?: string }) => Promise<void>;
  requireAuth: (message?: string) => boolean;
  showAuthPrompt: (message?: string) => void;
  hideAuthPrompt: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthPromptVisible, setIsAuthPromptVisible] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState("Masuk untuk melanjutkan");

  useEffect(() => {
    loadUser();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user.email!);
        // Auto-dismiss auth prompt when user signs in
        setIsAuthPromptVisible(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED') {
        // Token was refreshed successfully, nothing to do
        console.log('Auth token refreshed');
      } else if (event === 'USER_UPDATED') {
        // User was updated, reload profile
        if (session?.user?.email) {
          await loadUserProfile(session.user.email);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function loadUser() {
    try {
      // Check if user session exists in Supabase Auth
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // Handle refresh token errors - clear invalid session
      if (error) {
        console.error("Session error:", error);
        // If refresh token is invalid, sign out to clear corrupted session
        if (error.message?.includes('refresh_token') || error.code === 'refresh_token_not_found') {
          console.log("Clearing invalid session...");
          await supabase.auth.signOut();
          setUser(null);
          return;
        }
      }
      
      if (session?.user) {
        await loadUserProfile(session.user.email!);
      }
    } catch (error: any) {
      console.error("Error loading user:", error);
      // If any auth error occurs, try to clean up
      if (error?.message?.includes('refresh_token') || error?.__isAuthError) {
        await supabase.auth.signOut();
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUserProfile(email: string, retryCount = 0) {
    try {
      // Fetch user profile from users table using email
      // Use maybeSingle() to avoid error when profile doesn't exist yet (during signup)
      const { data: userProfile, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      // Handle case where profile doesn't exist yet (during signup flow)
      if (error) {
        // PGRST116 means no rows found - this is expected during signup
        if (error.code === 'PGRST116') {
          console.log("Profile not found yet, might be during signup...");
          return;
        }
        throw error;
      }

      if (userProfile) {
        const user: User = {
          id: userProfile.id.toString(),
          name: userProfile.name,
          email: userProfile.email,
          isWriter: userProfile.is_writer,
          role: (userProfile.role || 'pembaca') as any,
          coinBalance: userProfile.coin_balance,
          silverBalance: userProfile.silver_balance || 0,
          avatarUrl: userProfile.avatar_url || undefined,
          bio: userProfile.bio || undefined,
          lastClaimDate: userProfile.last_claim_date || undefined,
          claimStreak: userProfile.claim_streak || 0,
        };
        setUser(user);
      } else if (retryCount < 3) {
        // Profile not found, might be creating - retry after a short delay
        console.log(`Profile not found, retrying... (${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return loadUserProfile(email, retryCount + 1);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  }

  async function signup(email: string, password: string, name: string) {
    try {
      console.log("🚀 Starting signup for:", email);
      
      // Step 1: Create auth user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error("❌ Auth signup failed:", authError);
        throw authError;
      }
      if (!authData.user) throw new Error("Signup failed");
      
      console.log("✅ Auth user created:", authData.user.id);

      // Step 2: Create user profile in users table (uses auto-increment ID)
      console.log("📝 Creating user profile...");
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .insert({
          email,
          name,
          is_writer: false,
          role: 'pembaca',
          coin_balance: 0,
          silver_balance: 50,
        })
        .select()
        .single();

      if (profileError) {
        console.error("❌ Profile creation failed:", profileError);
        console.error("Error code:", profileError.code);
        console.error("Error message:", profileError.message);
        console.error("Error details:", profileError.details);
        console.error("Error hint:", profileError.hint);
        
        // Show user-friendly error
        if (profileError.code === '42501') {
          throw new Error('Database permission error. Please contact support.');
        }
        throw new Error(`Gagal membuat profil: ${profileError.message}`);
      }

      console.log("✅ User profile created:", userProfile.id);

      // Step 3: Update local state
      const newUser: User = {
        id: userProfile.id.toString(),
        name: userProfile.name,
        email: userProfile.email,
        isWriter: userProfile.is_writer,
        role: (userProfile.role || 'pembaca') as any,
        coinBalance: userProfile.coin_balance,
        silverBalance: userProfile.silver_balance || 0,
        avatarUrl: userProfile.avatar_url || undefined,
        bio: userProfile.bio || undefined,
        lastClaimDate: userProfile.last_claim_date || undefined,
        claimStreak: userProfile.claim_streak || 0,
      };
      setUser(newUser);
      console.log("🎉 Signup complete!");
    } catch (error: any) {
      console.error("❌ Signup error:", error);
      throw error;
    }
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

  async function loginWithGoogle() {
    try {
      const redirectUrl = Linking.createURL("google-auth");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;
      if (!data.url) throw new Error("Tidak ada URL autentikasi");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === "success" && result.url) {
        const url = new URL(result.url);
        const params = new URLSearchParams(url.hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) throw sessionError;

          if (sessionData.user?.email) {
            const { data: existingUser } = await supabase
              .from("users")
              .select("id")
              .eq("email", sessionData.user.email)
              .maybeSingle();

            if (!existingUser) {
              const userName = sessionData.user.user_metadata?.full_name || 
                               sessionData.user.user_metadata?.name ||
                               sessionData.user.email?.split("@")[0] || 
                               "User";
              
              await supabase.from("users").insert({
                email: sessionData.user.email,
                name: userName,
                is_writer: false,
                role: "pembaca",
                coin_balance: 0,
                silver_balance: 50,
                avatar_url: sessionData.user.user_metadata?.avatar_url || null,
              });
            }

            await loadUserProfile(sessionData.user.email);
          }
        }
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      throw new Error(error.message || "Gagal masuk dengan Google");
    }
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

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://noveaindonesia.com/reset-password',
    });
    
    if (error) {
      console.error('Reset password error:', error);
      throw new Error(error.message || 'Gagal mengirim email reset password');
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
      silverBalance: data.silver_balance || 0,
      avatarUrl: data.avatar_url || undefined,
      bio: data.bio || undefined,
      lastClaimDate: data.last_claim_date || undefined,
      claimStreak: data.claim_streak || 0,
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
      silverBalance: data.silver_balance || 0,
      avatarUrl: data.avatar_url || undefined,
      bio: data.bio || undefined,
      lastClaimDate: data.last_claim_date || undefined,
      claimStreak: data.claim_streak || 0,
    };
    setUser(updatedUser);
  }

  async function convertSilverToGold(goldAmount: number = 1): Promise<{ success: boolean; error?: string }> {
    if (!user) return { success: false, error: "User tidak ditemukan" };
    if (goldAmount < 1) return { success: false, error: "Jumlah konversi tidak valid" };
    
    const SILVER_PER_GOLD = 1000;
    const silverNeeded = goldAmount * SILVER_PER_GOLD;
    
    try {
      // First fetch the latest balances from database to avoid stale state
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('silver_balance, coin_balance')
        .eq('id', parseInt(user.id))
        .single();
      
      if (fetchError || !currentUser) {
        console.error('Error fetching current balance:', fetchError);
        return { success: false, error: "Gagal mengambil saldo. Silakan coba lagi." };
      }
      
      const currentSilver = currentUser.silver_balance || 0;
      const currentGold = currentUser.coin_balance || 0;
      
      if (currentSilver < silverNeeded) {
        return { success: false, error: `Silver Novoin tidak cukup. Kamu butuh ${silverNeeded} Silver untuk ${goldAmount} Gold.` };
      }
      
      const newSilverBalance = currentSilver - silverNeeded;
      const newGoldBalance = currentGold + goldAmount;
      
      // Perform atomic update with both balances
      const { data, error } = await supabase
        .from('users')
        .update({ 
          silver_balance: newSilverBalance,
          coin_balance: newGoldBalance 
        })
        .eq('id', parseInt(user.id))
        .select()
        .single();

      if (error) {
        console.error('Error converting silver to gold:', error);
        return { success: false, error: "Gagal konversi. Silakan coba lagi." };
      }

      const updatedUser: User = {
        id: data.id.toString(),
        name: data.name,
        email: data.email,
        isWriter: data.is_writer,
        role: (data.role || 'pembaca') as any,
        coinBalance: data.coin_balance,
        silverBalance: data.silver_balance || 0,
        avatarUrl: data.avatar_url || undefined,
        bio: data.bio || undefined,
        lastClaimDate: data.last_claim_date || undefined,
        claimStreak: data.claim_streak || 0,
      };
      setUser(updatedUser);
      
      return { success: true };
    } catch (error) {
      console.error('Convert error:', error);
      return { success: false, error: "Terjadi kesalahan. Silakan coba lagi." };
    }
  }

  async function claimDailyReward(): Promise<{ success: boolean; amount?: number; error?: string }> {
    if (!user) return { success: false, error: "User tidak ditemukan" };

    const DAILY_REWARDS = [1, 1, 1, 10, 10, 10, 20];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    try {
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('silver_balance, last_claim_date, claim_streak')
        .eq('id', parseInt(user.id))
        .single();

      if (fetchError || !currentUser) {
        console.error('Error fetching user for claim:', fetchError);
        return { success: false, error: "Gagal mengambil data. Silakan coba lagi." };
      }

      const lastClaimDate = currentUser.last_claim_date;
      const currentStreak = currentUser.claim_streak || 0;
      const currentSilver = currentUser.silver_balance || 0;

      if (lastClaimDate === todayStr) {
        return { success: false, error: "Kamu sudah klaim hadiah hari ini!" };
      }

      let newStreak = 1;
      if (lastClaimDate) {
        const lastDate = new Date(lastClaimDate);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastClaimDate === yesterdayStr) {
          newStreak = currentStreak >= 7 ? 1 : currentStreak + 1;
        }
      }

      const rewardIndex = Math.min(newStreak - 1, 6);
      const rewardAmount = DAILY_REWARDS[rewardIndex];
      const newSilverBalance = currentSilver + rewardAmount;

      const { data, error } = await supabase
        .from('users')
        .update({
          silver_balance: newSilverBalance,
          last_claim_date: todayStr,
          claim_streak: newStreak,
        })
        .eq('id', parseInt(user.id))
        .select()
        .single();

      if (error) {
        console.error('Error claiming daily reward:', error);
        return { success: false, error: "Gagal klaim hadiah. Silakan coba lagi." };
      }

      const updatedUser: User = {
        id: data.id.toString(),
        name: data.name,
        email: data.email,
        isWriter: data.is_writer,
        role: (data.role || 'pembaca') as any,
        coinBalance: data.coin_balance,
        silverBalance: data.silver_balance || 0,
        avatarUrl: data.avatar_url || undefined,
        bio: data.bio || undefined,
        lastClaimDate: data.last_claim_date || undefined,
        claimStreak: data.claim_streak || 0,
      };
      setUser(updatedUser);

      return { success: true, amount: rewardAmount };
    } catch (error) {
      console.error('Claim error:', error);
      return { success: false, error: "Terjadi kesalahan. Silakan coba lagi." };
    }
  }

  async function refreshUser() {
    if (!user) return;
    
    // Fetch latest user data from Supabase
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', parseInt(user.id))
      .single();

    if (error) {
      console.error('Error refreshing user:', error);
      return;
    }

    // Update local state with fresh data
    const updatedUser: User = {
      id: data.id.toString(),
      name: data.name,
      email: data.email,
      isWriter: data.is_writer,
      role: (data.role || 'pembaca') as any,
      coinBalance: data.coin_balance,
      silverBalance: data.silver_balance || 0,
      avatarUrl: data.avatar_url || undefined,
      bio: data.bio || undefined,
      lastClaimDate: data.last_claim_date || undefined,
      claimStreak: data.claim_streak || 0,
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
      silverBalance: data.silver_balance || 0,
      avatarUrl: data.avatar_url || undefined,
      bio: data.bio || undefined,
      lastClaimDate: data.last_claim_date || undefined,
      claimStreak: data.claim_streak || 0,
    };
    setUser(updatedUser);
  }

  function requireAuth(message?: string): boolean {
    if (user) return true;
    showAuthPrompt(message);
    return false;
  }

  function showAuthPrompt(message?: string) {
    setAuthPromptMessage(message || "Masuk untuk melanjutkan");
    setIsAuthPromptVisible(true);
  }

  function hideAuthPrompt() {
    setIsAuthPromptVisible(false);
  }

  const isGuest = !user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isGuest,
        isAuthPromptVisible,
        authPromptMessage,
        login,
        loginWithGoogle,
        signup,
        logout,
        resetPassword,
        upgradeToWriter,
        updateCoinBalance,
        convertSilverToGold,
        claimDailyReward,
        refreshUser,
        updateProfile,
        requireAuth,
        showAuthPrompt,
        hideAuthPrompt,
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
