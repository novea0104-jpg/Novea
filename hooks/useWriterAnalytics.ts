import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";

export interface DailyEarning {
  date: string;
  label: string;
  unlockCount: number;
  totalAmount: number;
  writerShare: number;
}

export interface NovelPerformance {
  novelId: number;
  novelTitle: string;
  totalUnlocks: number;
  totalRevenue: number;
  writerEarnings: number;
  uniqueReaders: number;
  chaptersUnlocked: number;
}

export interface WriterStats {
  totalBalance: number;
  totalEarnings: number;
  pendingWithdrawal: number;
  availableBalance: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  growthPercent: number;
}

export interface BankAccount {
  id: number;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
  isPrimary: boolean;
  isVerified: boolean;
}

export interface WithdrawalRequest {
  id: number;
  amount: number;
  fee: number;
  netAmount: number;
  status: "pending" | "processing" | "approved" | "rejected" | "paid" | "cancelled";
  adminNote: string | null;
  bankAccountId: number;
  bankName?: string;
  accountNumber?: string;
  createdAt: string;
  processedAt: string | null;
  paidAt: string | null;
}

export function useWriterAnalytics(writerId: number | undefined) {
  const [stats, setStats] = useState<WriterStats | null>(null);
  const [dailyEarnings, setDailyEarnings] = useState<DailyEarning[]>([]);
  const [novelPerformance, setNovelPerformance] = useState<NovelPerformance[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWriterStats = useCallback(async () => {
    if (!writerId) return null;

    try {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("writer_balance, total_earnings, pending_withdrawal")
        .eq("id", writerId)
        .single();

      if (userError) throw userError;

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const [thisMonthResult, lastMonthResult] = await Promise.all([
        supabase
          .from("writer_earnings")
          .select("writer_share")
          .eq("writer_id", writerId)
          .gte("created_at", thisMonthStart.toISOString()),
        supabase
          .from("writer_earnings")
          .select("writer_share")
          .eq("writer_id", writerId)
          .gte("created_at", lastMonthStart.toISOString())
          .lt("created_at", lastMonthEnd.toISOString()),
      ]);

      const thisMonthEarnings = (thisMonthResult.data || []).reduce((sum, e) => sum + e.writer_share, 0);
      const lastMonthEarnings = (lastMonthResult.data || []).reduce((sum, e) => sum + e.writer_share, 0);
      const growthPercent = lastMonthEarnings > 0 
        ? Math.round(((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100) 
        : thisMonthEarnings > 0 ? 100 : 0;

      return {
        totalBalance: user?.writer_balance || 0,
        totalEarnings: user?.total_earnings || 0,
        pendingWithdrawal: user?.pending_withdrawal || 0,
        availableBalance: (user?.writer_balance || 0) - (user?.pending_withdrawal || 0),
        thisMonthEarnings,
        lastMonthEarnings,
        growthPercent,
      };
    } catch (err) {
      console.error("Error fetching writer stats:", err);
      return null;
    }
  }, [writerId]);

  const fetchDailyEarnings = useCallback(async (days: number = 14) => {
    if (!writerId) return [];

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("writer_earnings")
        .select("writer_share, created_at")
        .eq("writer_id", writerId)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      const dailyMap = new Map<string, { unlockCount: number; totalAmount: number; writerShare: number }>();
      
      for (let i = 0; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i));
        const dateStr = date.toISOString().split("T")[0];
        dailyMap.set(dateStr, { unlockCount: 0, totalAmount: 0, writerShare: 0 });
      }

      (data || []).forEach((earning) => {
        const dateStr = new Date(earning.created_at).toISOString().split("T")[0];
        const existing = dailyMap.get(dateStr);
        if (existing) {
          existing.unlockCount++;
          existing.writerShare += earning.writer_share;
        }
      });

      return Array.from(dailyMap.entries()).map(([date, values]) => ({
        date,
        label: new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        ...values,
      }));
    } catch (err) {
      console.error("Error fetching daily earnings:", err);
      return [];
    }
  }, [writerId]);

  const fetchNovelPerformance = useCallback(async () => {
    if (!writerId) return [];

    try {
      const { data: novels, error: novelError } = await supabase
        .from("novels")
        .select("id, title")
        .eq("author_id", writerId);

      if (novelError) throw novelError;

      const novelIds = (novels || []).map((n) => n.id);
      
      if (novelIds.length === 0) return [];

      const { data: earnings, error: earningsError } = await supabase
        .from("writer_earnings")
        .select("novel_id, writer_share, reader_id, chapter_id")
        .eq("writer_id", writerId)
        .in("novel_id", novelIds);

      if (earningsError) throw earningsError;

      const performanceMap = new Map<number, NovelPerformance>();
      
      novels?.forEach((novel) => {
        performanceMap.set(novel.id, {
          novelId: novel.id,
          novelTitle: novel.title,
          totalUnlocks: 0,
          totalRevenue: 0,
          writerEarnings: 0,
          uniqueReaders: 0,
          chaptersUnlocked: 0,
        });
      });

      const readerSets = new Map<number, Set<number>>();
      const chapterSets = new Map<number, Set<number>>();

      (earnings || []).forEach((e) => {
        const perf = performanceMap.get(e.novel_id);
        if (perf) {
          perf.totalUnlocks++;
          perf.writerEarnings += e.writer_share;
          
          if (!readerSets.has(e.novel_id)) readerSets.set(e.novel_id, new Set());
          readerSets.get(e.novel_id)!.add(e.reader_id);
          
          if (!chapterSets.has(e.novel_id)) chapterSets.set(e.novel_id, new Set());
          chapterSets.get(e.novel_id)!.add(e.chapter_id);
        }
      });

      performanceMap.forEach((perf, novelId) => {
        perf.uniqueReaders = readerSets.get(novelId)?.size || 0;
        perf.chaptersUnlocked = chapterSets.get(novelId)?.size || 0;
      });

      return Array.from(performanceMap.values()).sort((a, b) => b.writerEarnings - a.writerEarnings);
    } catch (err) {
      console.error("Error fetching novel performance:", err);
      return [];
    }
  }, [writerId]);

  const fetchBankAccounts = useCallback(async () => {
    if (!writerId) return [];

    try {
      const { data, error } = await supabase
        .from("writer_bank_accounts")
        .select("*")
        .eq("user_id", writerId)
        .order("is_primary", { ascending: false });

      if (error) throw error;

      return (data || []).map((account) => ({
        id: account.id,
        bankName: account.bank_name,
        bankCode: account.bank_code,
        accountNumber: account.account_number,
        accountHolderName: account.account_holder_name,
        isPrimary: account.is_primary,
        isVerified: account.is_verified,
      }));
    } catch (err) {
      console.error("Error fetching bank accounts:", err);
      return [];
    }
  }, [writerId]);

  const fetchWithdrawalHistory = useCallback(async () => {
    if (!writerId) return [];

    try {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select(`
          *,
          writer_bank_accounts (bank_name, account_number)
        `)
        .eq("user_id", writerId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map((req) => ({
        id: req.id,
        amount: req.amount,
        fee: req.fee,
        netAmount: req.net_amount,
        status: req.status,
        adminNote: req.admin_note,
        bankAccountId: req.bank_account_id,
        bankName: req.writer_bank_accounts?.bank_name,
        accountNumber: req.writer_bank_accounts?.account_number,
        createdAt: req.created_at,
        processedAt: req.processed_at,
        paidAt: req.paid_at,
      }));
    } catch (err) {
      console.error("Error fetching withdrawal history:", err);
      return [];
    }
  }, [writerId]);

  const addBankAccount = async (account: Omit<BankAccount, "id" | "isPrimary" | "isVerified">) => {
    if (!writerId) return { success: false, error: "User tidak ditemukan" };

    try {
      const existingAccounts = bankAccounts.length;
      
      const { data, error } = await supabase
        .from("writer_bank_accounts")
        .insert({
          user_id: writerId,
          bank_name: account.bankName,
          bank_code: account.bankCode,
          account_number: account.accountNumber,
          account_holder_name: account.accountHolderName,
          is_primary: existingAccounts === 0,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchBankAccounts().then(setBankAccounts);
      return { success: true, accountId: data.id };
    } catch (err: any) {
      console.error("Error adding bank account:", err);
      return { success: false, error: err.message || "Gagal menambah rekening" };
    }
  };

  const deleteBankAccount = async (accountId: number) => {
    try {
      const { error } = await supabase
        .from("writer_bank_accounts")
        .delete()
        .eq("id", accountId)
        .eq("user_id", writerId);

      if (error) throw error;

      await fetchBankAccounts().then(setBankAccounts);
      return { success: true };
    } catch (err: any) {
      console.error("Error deleting bank account:", err);
      return { success: false, error: err.message || "Gagal menghapus rekening" };
    }
  };

  const requestWithdrawal = async (bankAccountId: number, amount: number) => {
    if (!writerId) return { success: false, error: "User tidak ditemukan" };
    
    const minWithdrawal = 50000;
    const fee = 2500;
    
    if (amount < minWithdrawal) {
      return { success: false, error: `Minimal withdrawal Rp ${minWithdrawal.toLocaleString()}` };
    }

    if (!stats || amount > stats.availableBalance) {
      return { success: false, error: "Saldo tidak mencukupi" };
    }

    try {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .insert({
          user_id: writerId,
          bank_account_id: bankAccountId,
          amount: amount,
          fee: fee,
          net_amount: amount - fee,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from("users")
        .update({
          pending_withdrawal: (stats?.pendingWithdrawal || 0) + amount,
        })
        .eq("id", writerId);

      await Promise.all([
        fetchWriterStats().then(setStats),
        fetchWithdrawalHistory().then(setWithdrawalHistory),
      ]);

      return { success: true, requestId: data.id };
    } catch (err: any) {
      console.error("Error requesting withdrawal:", err);
      return { success: false, error: err.message || "Gagal mengajukan penarikan" };
    }
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [statsResult, dailyResult, novelResult, bankResult, wdResult] = await Promise.all([
        fetchWriterStats(),
        fetchDailyEarnings(14),
        fetchNovelPerformance(),
        fetchBankAccounts(),
        fetchWithdrawalHistory(),
      ]);

      setStats(statsResult);
      setDailyEarnings(dailyResult);
      setNovelPerformance(novelResult);
      setBankAccounts(bankResult);
      setWithdrawalHistory(wdResult);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [fetchWriterStats, fetchDailyEarnings, fetchNovelPerformance, fetchBankAccounts, fetchWithdrawalHistory]);

  useEffect(() => {
    if (writerId) {
      refresh();
    }
  }, [writerId, refresh]);

  return {
    stats,
    dailyEarnings,
    novelPerformance,
    bankAccounts,
    withdrawalHistory,
    loading,
    error,
    refresh,
    addBankAccount,
    deleteBankAccount,
    requestWithdrawal,
  };
}
