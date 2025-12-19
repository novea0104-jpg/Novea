import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";

export interface BankAccount {
  id: number;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
  isPrimary: boolean;
  isVerified: boolean;
}

export interface GoldWithdrawalRequest {
  id: number;
  goldAmount: number;
  rupiahAmount: number;
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

export const GOLD_TO_RUPIAH = 1000;
export const GOLD_WITHDRAWAL_FEE = 2500;
export const MIN_GOLD_WITHDRAWAL = 100;

export function useGoldWithdrawal(userId: string | number | undefined) {
  const userIdNum = userId ? (typeof userId === 'string' ? parseInt(userId, 10) : userId) : undefined;
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<GoldWithdrawalRequest[]>([]);
  const [pendingGoldWithdrawal, setPendingGoldWithdrawal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBankAccounts = useCallback(async () => {
    if (!userIdNum) return [];

    try {
      const { data, error } = await supabase
        .from("writer_bank_accounts")
        .select("*")
        .eq("user_id", userIdNum)
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
  }, [userIdNum]);

  const fetchWithdrawalHistory = useCallback(async () => {
    if (!userIdNum) return [];

    try {
      const { data, error } = await supabase
        .from("gold_withdrawals")
        .select(`
          *,
          writer_bank_accounts (bank_name, account_number)
        `)
        .eq("user_id", userIdNum)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map((req) => ({
        id: req.id,
        goldAmount: req.gold_amount,
        rupiahAmount: req.rupiah_amount,
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
      console.error("Error fetching gold withdrawal history:", err);
      return [];
    }
  }, [userIdNum]);

  const fetchPendingAmount = useCallback(async () => {
    if (!userIdNum) return 0;

    try {
      const { data, error } = await supabase
        .from("gold_withdrawals")
        .select("gold_amount")
        .eq("user_id", userIdNum)
        .in("status", ["pending", "processing"]);

      if (error) throw error;

      return (data || []).reduce((sum, item) => sum + item.gold_amount, 0);
    } catch (err) {
      console.error("Error fetching pending gold amount:", err);
      return 0;
    }
  }, [userIdNum]);

  const addBankAccount = async (account: Omit<BankAccount, "id" | "isPrimary" | "isVerified">) => {
    if (!userIdNum) return { success: false, error: "User tidak ditemukan" };

    try {
      const existingAccounts = bankAccounts.length;
      
      const { data, error } = await supabase
        .from("writer_bank_accounts")
        .insert({
          user_id: userIdNum,
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

  const requestWithdrawal = async (bankAccountId: number, goldAmount: number, currentGoldBalance: number) => {
    if (!userIdNum) return { success: false, error: "User tidak ditemukan" };
    
    if (goldAmount < MIN_GOLD_WITHDRAWAL) {
      return { success: false, error: `Minimal penarikan ${MIN_GOLD_WITHDRAWAL} Gold Novoin` };
    }

    const availableGold = currentGoldBalance - pendingGoldWithdrawal;
    if (goldAmount > availableGold) {
      return { success: false, error: "Saldo Gold tidak mencukupi" };
    }

    const rupiahAmount = goldAmount * GOLD_TO_RUPIAH;
    const netAmount = rupiahAmount - GOLD_WITHDRAWAL_FEE;

    try {
      const { data, error } = await supabase
        .from("gold_withdrawals")
        .insert({
          user_id: userIdNum,
          bank_account_id: bankAccountId,
          gold_amount: goldAmount,
          rupiah_amount: rupiahAmount,
          fee: GOLD_WITHDRAWAL_FEE,
          net_amount: netAmount,
        })
        .select()
        .single();

      if (error) throw error;

      await Promise.all([
        fetchWithdrawalHistory().then(setWithdrawalHistory),
        fetchPendingAmount().then(setPendingGoldWithdrawal),
      ]);

      return { success: true, requestId: data.id };
    } catch (err: any) {
      console.error("Error requesting gold withdrawal:", err);
      return { success: false, error: err.message || "Gagal mengajukan penarikan" };
    }
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [bankResult, wdResult, pendingResult] = await Promise.all([
        fetchBankAccounts(),
        fetchWithdrawalHistory(),
        fetchPendingAmount(),
      ]);

      setBankAccounts(bankResult);
      setWithdrawalHistory(wdResult);
      setPendingGoldWithdrawal(pendingResult);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [fetchBankAccounts, fetchWithdrawalHistory, fetchPendingAmount]);

  useEffect(() => {
    if (userIdNum) {
      refresh();
    }
  }, [userIdNum, refresh]);

  return {
    bankAccounts,
    withdrawalHistory,
    pendingGoldWithdrawal,
    loading,
    error,
    refresh,
    addBankAccount,
    requestWithdrawal,
  };
}

export async function getAdminGoldWithdrawals(status?: string) {
  try {
    let query = supabase
      .from("gold_withdrawals")
      .select(`
        *,
        users (id, name, email),
        writer_bank_accounts (bank_name, account_number, account_holder_name)
      `)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.limit(100);

    if (error) throw error;

    return (data || []).map((req) => ({
      id: req.id,
      userId: req.user_id,
      userName: req.users?.name || "Unknown",
      userEmail: req.users?.email,
      goldAmount: req.gold_amount,
      rupiahAmount: req.rupiah_amount,
      fee: req.fee,
      netAmount: req.net_amount,
      status: req.status,
      adminNote: req.admin_note,
      bankName: req.writer_bank_accounts?.bank_name,
      accountNumber: req.writer_bank_accounts?.account_number,
      accountHolderName: req.writer_bank_accounts?.account_holder_name,
      createdAt: req.created_at,
      processedAt: req.processed_at,
      paidAt: req.paid_at,
    }));
  } catch (err) {
    console.error("Error fetching admin gold withdrawals:", err);
    return [];
  }
}

export async function updateGoldWithdrawalStatus(
  withdrawalId: number, 
  status: string, 
  adminNote?: string
) {
  try {
    const updateData: any = {
      status,
      admin_note: adminNote,
    };

    if (status === "processing") {
      updateData.processed_at = new Date().toISOString();
    } else if (status === "paid") {
      updateData.paid_at = new Date().toISOString();
    }

    const { data: withdrawal, error: fetchError } = await supabase
      .from("gold_withdrawals")
      .select("user_id, gold_amount, status")
      .eq("id", withdrawalId)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from("gold_withdrawals")
      .update(updateData)
      .eq("id", withdrawalId);

    if (error) throw error;

    if (status === "paid" && withdrawal.status !== "paid") {
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("coin_balance")
        .eq("id", withdrawal.user_id)
        .single();

      if (!userError && user) {
        const newBalance = Math.max(0, (user.coin_balance || 0) - withdrawal.gold_amount);
        await supabase
          .from("users")
          .update({ coin_balance: newBalance })
          .eq("id", withdrawal.user_id);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error updating gold withdrawal status:", err);
    return { success: false, error: err.message || "Gagal update status" };
  }
}
