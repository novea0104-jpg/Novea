import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Alert, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { DollarSignIcon } from "@/components/icons/DollarSignIcon";
import { PlusIcon } from "@/components/icons/PlusIcon";
import { CheckCircleIcon } from "@/components/icons/CheckCircleIcon";
import { ClockIcon } from "@/components/icons/ClockIcon";
import { XCircleIcon } from "@/components/icons/XCircleIcon";
import { AlertCircleIcon } from "@/components/icons/AlertCircleIcon";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useGoldWithdrawal, GOLD_TO_RUPIAH, GOLD_WITHDRAWAL_FEE, MIN_GOLD_WITHDRAWAL, BankAccount } from "@/hooks/useGoldWithdrawal";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

const BANK_OPTIONS = [
  { code: "014", name: "BCA" },
  { code: "008", name: "Mandiri" },
  { code: "009", name: "BNI" },
  { code: "002", name: "BRI" },
  { code: "022", name: "CIMB Niaga" },
  { code: "011", name: "Danamon" },
  { code: "013", name: "Permata" },
  { code: "147", name: "Muamalat" },
  { code: "426", name: "Mega" },
  { code: "046", name: "DBS" },
  { code: "028", name: "OCBC NISP" },
  { code: "200", name: "BTN" },
  { code: "213", name: "BTPN" },
  { code: "076", name: "BTPN Syariah" },
  { code: "950", name: "Commonwealth" },
];

export default function GoldWithdrawalScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  
  const {
    bankAccounts,
    withdrawalHistory,
    pendingGoldWithdrawal,
    loading,
    refresh,
    addBankAccount,
    requestWithdrawal,
  } = useGoldWithdrawal(user?.id);

  const [goldAmount, setGoldAmount] = useState("");
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBankSelector, setShowBankSelector] = useState(false);
  const [showAddBank, setShowAddBank] = useState(false);
  
  const [newBankCode, setNewBankCode] = useState("");
  const [newBankName, setNewBankName] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newAccountHolderName, setNewAccountHolderName] = useState("");

  const goldBalance = user?.coinBalance || 0;
  const availableGold = goldBalance - pendingGoldWithdrawal;
  const goldAmountNum = parseInt(goldAmount) || 0;
  const rupiahAmount = goldAmountNum * GOLD_TO_RUPIAH;
  const netAmount = rupiahAmount > 0 ? rupiahAmount - GOLD_WITHDRAWAL_FEE : 0;

  const canWithdraw = 
    goldAmountNum >= MIN_GOLD_WITHDRAWAL &&
    goldAmountNum <= availableGold &&
    selectedBankAccount !== null;

  useEffect(() => {
    if (bankAccounts.length > 0 && !selectedBankAccount) {
      setSelectedBankAccount(bankAccounts[0]);
    }
  }, [bankAccounts]);

  const handleWithdraw = async () => {
    if (!canWithdraw || !selectedBankAccount) return;

    setIsSubmitting(true);
    try {
      const result = await requestWithdrawal(selectedBankAccount.id, goldAmountNum, goldBalance);

      if (result.success) {
        Alert.alert(
          "Permintaan Berhasil!",
          `Permintaan penarikan ${goldAmountNum.toLocaleString()} Gold Novoin telah diajukan. Admin akan memproses dalam 1-3 hari kerja.`,
          [{ text: "OK", onPress: () => {
            refreshUser?.();
            navigation.goBack();
          }}]
        );
      } else {
        Alert.alert("Gagal", result.error || "Gagal mengajukan penarikan.");
      }
    } catch (error) {
      Alert.alert("Error", "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBankAccount = async () => {
    if (!newBankCode || !newAccountNumber || !newAccountHolderName) {
      Alert.alert("Error", "Harap lengkapi semua data rekening.");
      return;
    }

    const bank = BANK_OPTIONS.find(b => b.code === newBankCode);
    if (!bank) {
      Alert.alert("Error", "Pilih bank terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addBankAccount({
        bankName: bank.name,
        bankCode: newBankCode,
        accountNumber: newAccountNumber,
        accountHolderName: newAccountHolderName,
      });

      if (result.success) {
        Alert.alert("Berhasil", "Rekening bank berhasil ditambahkan.");
        setShowAddBank(false);
        setNewBankCode("");
        setNewAccountNumber("");
        setNewAccountHolderName("");
      } else {
        Alert.alert("Gagal", result.error || "Gagal menambah rekening.");
      }
    } catch (error) {
      Alert.alert("Error", "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "#22c55e";
      case "approved":
      case "processing": return "#f59e0b";
      case "rejected":
      case "cancelled": return "#ef4444";
      default: return theme.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircleIcon size={16} color="#22c55e" />;
      case "approved":
      case "processing": return <ClockIcon size={16} color="#f59e0b" />;
      case "rejected":
      case "cancelled": return <XCircleIcon size={16} color="#ef4444" />;
      default: return <ClockIcon size={16} color={theme.textSecondary} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Menunggu";
      case "processing": return "Diproses";
      case "approved": return "Disetujui";
      case "paid": return "Dibayar";
      case "rejected": return "Ditolak";
      case "cancelled": return "Dibatalkan";
      default: return status;
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.header}>
        <LinearGradient
          colors={["rgba(255, 215, 0, 0.2)", "rgba(34, 197, 94, 0.2)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerIconsRow}>
            <LinearGradient
              colors={["#FFD700", "#FFA500"]}
              style={styles.coinIconLarge}
            >
              <CoinIcon size={32} color="#FFFFFF" />
            </LinearGradient>
            <DollarSignIcon size={24} color="#22c55e" />
            <LinearGradient
              colors={["#22c55e", "#16a34a"]}
              style={styles.coinIconLarge}
            >
              <ThemedText style={styles.rupiahSymbol}>Rp</ThemedText>
            </LinearGradient>
          </View>
          <ThemedText style={[Typography.h2, styles.headerTitle]}>
            Tarik Gold Novoin
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Cairkan Gold Novoin ke rekening bank kamu
          </ThemedText>
        </LinearGradient>
      </View>

      <Card elevation={1} style={styles.balanceCard}>
        <ThemedText style={[styles.balanceLabel, { color: theme.textSecondary }]}>
          Saldo Gold Novoin
        </ThemedText>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <LinearGradient
              colors={["#FFD700", "#FFA500"]}
              style={styles.balanceIcon}
            >
              <CoinIcon size={16} color="#FFFFFF" />
            </LinearGradient>
            <View>
              <ThemedText style={styles.balanceValue}>{goldBalance.toLocaleString()}</ThemedText>
              <ThemedText style={[styles.balanceType, { color: theme.textSecondary }]}>Total</ThemedText>
            </View>
          </View>
          <View style={[styles.balanceDivider, { backgroundColor: theme.cardBorder }]} />
          <View style={styles.balanceItem}>
            <LinearGradient
              colors={["#22c55e", "#16a34a"]}
              style={styles.balanceIcon}
            >
              <CoinIcon size={16} color="#FFFFFF" />
            </LinearGradient>
            <View>
              <ThemedText style={styles.balanceValue}>{availableGold.toLocaleString()}</ThemedText>
              <ThemedText style={[styles.balanceType, { color: theme.textSecondary }]}>Tersedia</ThemedText>
            </View>
          </View>
        </View>
        {pendingGoldWithdrawal > 0 ? (
          <View style={[styles.pendingNote, { backgroundColor: theme.warning + "20" }]}>
            <AlertCircleIcon size={14} color={theme.warning} />
            <ThemedText style={[styles.pendingNoteText, { color: theme.warning }]}>
              {pendingGoldWithdrawal.toLocaleString()} Gold dalam proses penarikan
            </ThemedText>
          </View>
        ) : null}
      </Card>

      <Card elevation={1} style={styles.rateCard}>
        <View style={styles.rateRow}>
          <View style={styles.rateItem}>
            <LinearGradient colors={["#FFD700", "#FFA500"]} style={styles.rateIcon}>
              <CoinIcon size={14} color="#FFFFFF" />
            </LinearGradient>
            <ThemedText style={styles.rateValue}>1 Gold</ThemedText>
          </View>
          <ThemedText style={[styles.rateEquals, { color: theme.textSecondary }]}>=</ThemedText>
          <ThemedText style={[styles.rateValue, { color: "#22c55e" }]}>Rp 1.000</ThemedText>
        </View>
        <ThemedText style={[styles.feeNote, { color: theme.textMuted }]}>
          Biaya admin: Rp {GOLD_WITHDRAWAL_FEE.toLocaleString()} per penarikan
        </ThemedText>
      </Card>

      {availableGold >= MIN_GOLD_WITHDRAWAL ? (
        <>
          <Card elevation={2} style={styles.withdrawalCard}>
            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Jumlah Gold yang Ditarik
            </ThemedText>
            <TextInput
              style={[styles.amountInput, { 
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.cardBorder,
              }]}
              value={goldAmount}
              onChangeText={setGoldAmount}
              keyboardType="numeric"
              placeholder={`Min. ${MIN_GOLD_WITHDRAWAL} Gold`}
              placeholderTextColor={theme.textMuted}
            />
            
            {goldAmountNum > 0 ? (
              <View style={styles.conversionPreview}>
                <View style={styles.conversionRow}>
                  <ThemedText style={[styles.conversionLabel, { color: theme.textSecondary }]}>
                    Jumlah Rupiah:
                  </ThemedText>
                  <ThemedText style={styles.conversionValue}>
                    Rp {rupiahAmount.toLocaleString()}
                  </ThemedText>
                </View>
                <View style={styles.conversionRow}>
                  <ThemedText style={[styles.conversionLabel, { color: theme.textSecondary }]}>
                    Biaya Admin:
                  </ThemedText>
                  <ThemedText style={[styles.conversionValue, { color: theme.error }]}>
                    - Rp {GOLD_WITHDRAWAL_FEE.toLocaleString()}
                  </ThemedText>
                </View>
                <View style={[styles.conversionRow, styles.netAmountRow, { borderTopColor: theme.cardBorder }]}>
                  <ThemedText style={styles.netAmountLabel}>
                    Yang Diterima:
                  </ThemedText>
                  <ThemedText style={[styles.netAmountValue, { color: "#22c55e" }]}>
                    Rp {netAmount.toLocaleString()}
                  </ThemedText>
                </View>
              </View>
            ) : null}

            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
              Rekening Tujuan
            </ThemedText>
            
            {bankAccounts.length > 0 ? (
              <Pressable
                onPress={() => setShowBankSelector(!showBankSelector)}
                style={[styles.bankSelector, { 
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.cardBorder,
                }]}
              >
                {selectedBankAccount ? (
                  <View style={styles.selectedBankInfo}>
                    <ThemedText style={styles.selectedBankName}>
                      {selectedBankAccount.bankName}
                    </ThemedText>
                    <ThemedText style={[styles.selectedBankAccount, { color: theme.textSecondary }]}>
                      {selectedBankAccount.accountNumber} - {selectedBankAccount.accountHolderName}
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText style={{ color: theme.textMuted }}>Pilih rekening</ThemedText>
                )}
                <ChevronDownIcon size={20} color={theme.textSecondary} />
              </Pressable>
            ) : null}

            {showBankSelector ? (
              <View style={[styles.bankOptions, { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder }]}>
                {bankAccounts.map((account) => (
                  <Pressable
                    key={account.id}
                    onPress={() => {
                      setSelectedBankAccount(account);
                      setShowBankSelector(false);
                    }}
                    style={[styles.bankOption, { 
                      backgroundColor: selectedBankAccount?.id === account.id ? theme.primary + "20" : "transparent"
                    }]}
                  >
                    <ThemedText>{account.bankName} - {account.accountNumber}</ThemedText>
                    <ThemedText style={[styles.bankOptionHolder, { color: theme.textSecondary }]}>
                      {account.accountHolderName}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Pressable
              onPress={() => setShowAddBank(!showAddBank)}
              style={styles.addBankButton}
            >
              <PlusIcon size={16} color={theme.primary} />
              <ThemedText style={[styles.addBankText, { color: theme.primary }]}>
                Tambah Rekening Baru
              </ThemedText>
            </Pressable>
          </Card>

          {showAddBank ? (
            <Card elevation={1} style={styles.addBankCard}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Bank
              </ThemedText>
              <View style={[styles.bankPickerContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.cardBorder }]}>
                {BANK_OPTIONS.map((bank) => (
                  <Pressable
                    key={bank.code}
                    onPress={() => {
                      setNewBankCode(bank.code);
                      setNewBankName(bank.name);
                    }}
                    style={[styles.bankPickerItem, {
                      backgroundColor: newBankCode === bank.code ? theme.primary + "20" : "transparent",
                      borderColor: newBankCode === bank.code ? theme.primary : "transparent",
                    }]}
                  >
                    <ThemedText style={{ fontSize: 12 }}>{bank.name}</ThemedText>
                  </Pressable>
                ))}
              </View>

              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary, marginTop: Spacing.md }]}>
                Nomor Rekening
              </ThemedText>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.cardBorder,
                }]}
                value={newAccountNumber}
                onChangeText={setNewAccountNumber}
                keyboardType="numeric"
                placeholder="Masukkan nomor rekening"
                placeholderTextColor={theme.textMuted}
              />

              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary, marginTop: Spacing.md }]}>
                Nama Pemilik Rekening
              </ThemedText>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.cardBorder,
                }]}
                value={newAccountHolderName}
                onChangeText={setNewAccountHolderName}
                placeholder="Sesuai buku tabungan"
                placeholderTextColor={theme.textMuted}
              />

              <Pressable
                onPress={handleAddBankAccount}
                disabled={isSubmitting}
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, marginTop: Spacing.lg })}
              >
                <LinearGradient
                  colors={["#8B5CF6", "#7C3AED"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.addBankSubmitButton}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <ThemedText style={styles.addBankSubmitText}>Simpan Rekening</ThemedText>
                  )}
                </LinearGradient>
              </Pressable>
            </Card>
          ) : null}

          <Pressable
            onPress={handleWithdraw}
            disabled={!canWithdraw || isSubmitting}
            style={({ pressed }) => ({ 
              opacity: !canWithdraw ? 0.5 : pressed ? 0.8 : 1,
              marginHorizontal: Spacing.lg,
              marginTop: Spacing.lg,
            })}
          >
            <LinearGradient
              colors={canWithdraw ? ["#22c55e", "#16a34a"] : [theme.textMuted, theme.textMuted]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.withdrawButton}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText style={styles.withdrawButtonText}>
                  Ajukan Penarikan
                </ThemedText>
              )}
            </LinearGradient>
          </Pressable>

          {goldAmountNum > 0 && goldAmountNum < MIN_GOLD_WITHDRAWAL ? (
            <View style={[styles.warningBox, { backgroundColor: theme.warning + "20" }]}>
              <AlertCircleIcon size={16} color={theme.warning} />
              <ThemedText style={[styles.warningText, { color: theme.warning }]}>
                Minimal penarikan {MIN_GOLD_WITHDRAWAL} Gold Novoin
              </ThemedText>
            </View>
          ) : null}

          {goldAmountNum > availableGold ? (
            <View style={[styles.warningBox, { backgroundColor: theme.error + "20" }]}>
              <AlertCircleIcon size={16} color={theme.error} />
              <ThemedText style={[styles.warningText, { color: theme.error }]}>
                Saldo Gold tidak mencukupi
              </ThemedText>
            </View>
          ) : null}

          {!selectedBankAccount && bankAccounts.length === 0 ? (
            <View style={[styles.warningBox, { backgroundColor: theme.warning + "20" }]}>
              <AlertCircleIcon size={16} color={theme.warning} />
              <ThemedText style={[styles.warningText, { color: theme.warning }]}>
                Tambahkan rekening bank terlebih dahulu
              </ThemedText>
            </View>
          ) : null}
        </>
      ) : (
        <Card elevation={1} style={styles.insufficientCard}>
          <AlertCircleIcon size={32} color={theme.warning} />
          <ThemedText style={[styles.insufficientTitle, { color: theme.text }]}>
            Saldo Belum Cukup
          </ThemedText>
          <ThemedText style={[styles.insufficientText, { color: theme.textSecondary }]}>
            Minimal {MIN_GOLD_WITHDRAWAL} Gold Novoin untuk melakukan penarikan.
            Kamu perlu {MIN_GOLD_WITHDRAWAL - availableGold} Gold lagi.
          </ThemedText>
        </Card>
      )}

      {withdrawalHistory.length > 0 ? (
        <View style={styles.historySection}>
          <ThemedText style={[Typography.h3, styles.historyTitle]}>
            Riwayat Penarikan
          </ThemedText>
          {withdrawalHistory.map((wd) => (
            <Card key={wd.id} elevation={1} style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <View style={styles.historyAmount}>
                  <CoinIcon size={16} color="#FFD700" />
                  <ThemedText style={styles.historyGold}>
                    {wd.goldAmount.toLocaleString()} Gold
                  </ThemedText>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(wd.status) + "20" }]}>
                  {getStatusIcon(wd.status)}
                  <ThemedText style={[styles.statusText, { color: getStatusColor(wd.status) }]}>
                    {getStatusLabel(wd.status)}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.historyDetails}>
                <ThemedText style={[styles.historyBank, { color: theme.textSecondary }]}>
                  {wd.bankName} - {wd.accountNumber}
                </ThemedText>
                <ThemedText style={[styles.historyNet, { color: "#22c55e" }]}>
                  Rp {wd.netAmount.toLocaleString()}
                </ThemedText>
              </View>
              <ThemedText style={[styles.historyDate, { color: theme.textMuted }]}>
                {new Date(wd.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </ThemedText>
              {wd.adminNote ? (
                <View style={[styles.adminNoteBox, { backgroundColor: theme.backgroundSecondary }]}>
                  <ThemedText style={[styles.adminNoteText, { color: theme.textSecondary }]}>
                    Catatan: {wd.adminNote}
                  </ThemedText>
                </View>
              ) : null}
            </Card>
          ))}
        </View>
      ) : null}

      <View style={{ height: 40 }} />
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  headerGradient: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
  },
  headerIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  coinIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  rupiahSymbol: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerTitle: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    textAlign: "center",
    fontSize: 14,
  },
  balanceCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  balanceLabel: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  balanceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  balanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  balanceType: {
    fontSize: 12,
  },
  balanceDivider: {
    width: 1,
    height: 40,
  },
  pendingNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  pendingNoteText: {
    fontSize: 12,
  },
  rateCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  rateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  rateIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  rateValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  rateEquals: {
    fontSize: 16,
    marginHorizontal: Spacing.xs,
  },
  feeNote: {
    fontSize: 11,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  withdrawalCard: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  amountInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  conversionPreview: {
    marginTop: Spacing.md,
  },
  conversionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
  },
  conversionLabel: {
    fontSize: 13,
  },
  conversionValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  netAmountRow: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  netAmountLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  netAmountValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  bankSelector: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectedBankInfo: {
    flex: 1,
  },
  selectedBankName: {
    fontSize: 14,
    fontWeight: "600",
  },
  selectedBankAccount: {
    fontSize: 12,
    marginTop: 2,
  },
  bankOptions: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    overflow: "hidden",
  },
  bankOption: {
    padding: Spacing.md,
  },
  bankOptionHolder: {
    fontSize: 12,
    marginTop: 2,
  },
  addBankButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  addBankText: {
    fontSize: 14,
    fontWeight: "500",
  },
  addBankCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.lg,
  },
  bankPickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  bankPickerItem: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
  },
  addBankSubmitButton: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  addBankSubmitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  withdrawButton: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
  },
  withdrawButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  warningText: {
    fontSize: 13,
  },
  insufficientCard: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.xl,
    alignItems: "center",
  },
  insufficientTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  insufficientText: {
    textAlign: "center",
    fontSize: 14,
  },
  historySection: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  historyTitle: {
    marginBottom: Spacing.md,
  },
  historyItem: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  historyAmount: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  historyGold: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  historyDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyBank: {
    fontSize: 13,
  },
  historyNet: {
    fontSize: 14,
    fontWeight: "600",
  },
  historyDate: {
    fontSize: 11,
    marginTop: Spacing.sm,
  },
  adminNoteBox: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  adminNoteText: {
    fontSize: 12,
  },
});
