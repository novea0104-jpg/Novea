import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";

export interface AdminBankAccount {
  id: number;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolderName: string;
  isPrimary: boolean;
  isVerified: boolean;
}

export interface AdminWithdrawalRequest {
  id: number;
  userId: number;
  role: string;
  amount: number;
  percentageUsed: number;
  status: "pending" | "processing" | "approved" | "rejected" | "paid" | "cancelled";
  adminNote: string | null;
  bankAccountId: number;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  createdAt: string;
  processedAt: string | null;
  paidAt: string | null;
}

export const ADMIN_WITHDRAWAL_LIMITS: Record<string, number> = {
  super_admin: 40,
  co_admin: 20,
};

export function getWithdrawalLimit(role: string, platformRevenue: number): number {
  const normalizedRole = role.toLowerCase();
  const percentage = ADMIN_WITHDRAWAL_LIMITS[normalizedRole] || 0;
  return Math.floor(platformRevenue * (percentage / 100));
}

export function useAdminWithdrawal(userId: string | number | undefined, role: string) {
  const userIdNum = userId ? (typeof userId === 'string' ? parseInt(userId, 10) : userId) : undefined;
  const [bankAccount, setBankAccount] = useState<AdminBankAccount | null>(null);
  const [withdrawalHistory, setWithdrawalHistory] = useState<AdminWithdrawalRequest[]>([]);
  const [pendingWithdrawal, setPendingWithdrawal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBankAccount = useCallback(async () => {
    if (!userIdNum) return null;

    try {
      const { data, error } = await supabase
        .from("admin_bank_accounts")
        .select("*")
        .eq("user_id", userIdNum)
        .order("is_primary", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) return null;

      return {
        id: data.id,
        bankName: data.bank_name,
        bankCode: data.bank_code || '',
        accountNumber: data.account_number,
        accountHolderName: data.account_holder_name,
        isPrimary: data.is_primary,
        isVerified: data.is_verified,
      };
    } catch (err) {
      console.error("Error fetching admin bank account:", err);
      return null;
    }
  }, [userIdNum]);

  const fetchWithdrawalHistory = useCallback(async () => {
    if (!userIdNum) return [];

    try {
      const { data, error } = await supabase
        .from("admin_withdrawals")
        .select(`
          *,
          admin_bank_accounts (bank_name, account_number, account_holder_name)
        `)
        .eq("user_id", userIdNum)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      return (data || []).map((req) => ({
        id: req.id,
        userId: req.user_id,
        role: req.role,
        amount: req.amount,
        percentageUsed: parseFloat(req.percentage_used),
        status: req.status,
        adminNote: req.admin_note,
        bankAccountId: req.bank_account_id,
        bankName: req.admin_bank_accounts?.bank_name,
        accountNumber: req.admin_bank_accounts?.account_number,
        accountHolderName: req.admin_bank_accounts?.account_holder_name,
        createdAt: req.created_at,
        processedAt: req.processed_at,
        paidAt: req.paid_at,
      }));
    } catch (err) {
      console.error("Error fetching admin withdrawal history:", err);
      return [];
    }
  }, [userIdNum]);

  const fetchPendingAmount = useCallback(async () => {
    if (!userIdNum) return 0;

    try {
      const { data, error } = await supabase
        .from("admin_withdrawals")
        .select("amount")
        .eq("user_id", userIdNum)
        .in("status", ["pending", "processing"]);

      if (error) throw error;

      return (data || []).reduce((sum, item) => sum + item.amount, 0);
    } catch (err) {
      console.error("Error fetching pending admin withdrawal:", err);
      return 0;
    }
  }, [userIdNum]);

  const upsertBankAccount = async (account: Omit<AdminBankAccount, "id" | "isPrimary" | "isVerified">) => {
    if (!userIdNum) return { success: false, error: "User tidak ditemukan" };

    try {
      const existing = await fetchBankAccount();
      
      if (existing) {
        const { error } = await supabase
          .from("admin_bank_accounts")
          .update({
            bank_name: account.bankName,
            bank_code: account.bankCode,
            account_number: account.accountNumber,
            account_holder_name: account.accountHolderName,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("admin_bank_accounts")
          .insert({
            user_id: userIdNum,
            bank_name: account.bankName,
            bank_code: account.bankCode,
            account_number: account.accountNumber,
            account_holder_name: account.accountHolderName,
            is_primary: true,
          });

        if (error) throw error;
      }

      await refresh();
      return { success: true };
    } catch (err: any) {
      console.error("Error saving bank account:", err);
      return { success: false, error: err.message || "Gagal menyimpan rekening" };
    }
  };

  const requestWithdrawal = async (amount: number, platformRevenue: number) => {
    if (!userIdNum) return { success: false, error: "User tidak ditemukan" };
    if (!bankAccount) return { success: false, error: "Rekening bank belum diisi" };

    const freshPending = await fetchPendingAmount();
    const normalizedRole = role.toLowerCase();
    const maxAmount = getWithdrawalLimit(normalizedRole, platformRevenue);
    const availableAmount = Math.max(0, maxAmount - freshPending);

    if (amount > availableAmount) {
      return { success: false, error: `Jumlah melebihi limit. Maksimal: Rp ${availableAmount.toLocaleString('id-ID')}` };
    }

    if (amount <= 0) {
      return { success: false, error: "Jumlah harus lebih dari 0" };
    }

    if (platformRevenue <= 0) {
      return { success: false, error: "Tidak ada pendapatan platform untuk ditarik" };
    }

    try {
      const percentageUsed = (amount / platformRevenue) * 100;

      const { error } = await supabase
        .from("admin_withdrawals")
        .insert({
          user_id: userIdNum,
          role: role,
          amount: amount,
          percentage_used: percentageUsed,
          status: "pending",
          bank_account_id: bankAccount.id,
        });

      if (error) throw error;

      await refresh();
      return { success: true };
    } catch (err: any) {
      console.error("Error requesting withdrawal:", err);
      return { success: false, error: err.message || "Gagal mengajukan penarikan" };
    }
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [account, history, pending] = await Promise.all([
        fetchBankAccount(),
        fetchWithdrawalHistory(),
        fetchPendingAmount(),
      ]);
      setBankAccount(account);
      setWithdrawalHistory(history);
      setPendingWithdrawal(pending);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [fetchBankAccount, fetchWithdrawalHistory, fetchPendingAmount]);

  useEffect(() => {
    if (userIdNum) {
      refresh();
    }
  }, [userIdNum, refresh]);

  return {
    bankAccount,
    withdrawalHistory,
    pendingWithdrawal,
    loading,
    error,
    refresh,
    upsertBankAccount,
    requestWithdrawal,
  };
}

export async function getAllAdminWithdrawals(status?: string) {
  try {
    let query = supabase
      .from("admin_withdrawals")
      .select(`
        *,
        users (id, name, email),
        admin_bank_accounts (bank_name, account_number, account_holder_name)
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
      role: req.role,
      amount: req.amount,
      percentageUsed: parseFloat(req.percentage_used),
      status: req.status,
      adminNote: req.admin_note,
      bankName: req.admin_bank_accounts?.bank_name,
      accountNumber: req.admin_bank_accounts?.account_number,
      accountHolderName: req.admin_bank_accounts?.account_holder_name,
      createdAt: req.created_at,
      processedAt: req.processed_at,
      paidAt: req.paid_at,
    }));
  } catch (err) {
    console.error("Error fetching all admin withdrawals:", err);
    return [];
  }
}

export async function updateAdminWithdrawalStatus(
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

    const { error } = await supabase
      .from("admin_withdrawals")
      .update(updateData)
      .eq("id", withdrawalId);

    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.error("Error updating admin withdrawal:", err);
    return { success: false, error: err.message };
  }
}
