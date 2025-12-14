import React, { useState } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { MinusIcon } from "@/components/icons/MinusIcon";
import { PlusIcon } from "@/components/icons/PlusIcon";
import { RefreshCwIcon } from "@/components/icons/RefreshCwIcon";
import { AlertCircleIcon } from "@/components/icons/AlertCircleIcon";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

const SILVER_PER_GOLD = 1000;

export default function ConversionScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user, convertSilverToGold, refreshUser } = useAuth();
  
  const [conversionAmount, setConversionAmount] = useState(1);
  const [isConverting, setIsConverting] = useState(false);

  const silverBalance = user?.silverBalance || 0;
  const goldBalance = user?.coinBalance || 0;
  const maxConversions = Math.floor(silverBalance / SILVER_PER_GOLD);
  const canConvert = maxConversions >= 1;
  const silverNeeded = conversionAmount * SILVER_PER_GOLD;
  const hasEnoughSilver = silverBalance >= silverNeeded;

  const handleIncrement = () => {
    if (conversionAmount < maxConversions) {
      setConversionAmount(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (conversionAmount > 1) {
      setConversionAmount(prev => prev - 1);
    }
  };

  const handleConvert = async () => {
    if (!hasEnoughSilver || isConverting) return;

    setIsConverting(true);
    try {
      let successCount = 0;
      for (let i = 0; i < conversionAmount; i++) {
        const result = await convertSilverToGold();
        if (result.success) {
          successCount++;
        } else {
          break;
        }
      }

      if (successCount === conversionAmount) {
        Alert.alert(
          "Konversi Berhasil!",
          `${successCount * SILVER_PER_GOLD} Silver Novoin telah dikonversi menjadi ${successCount} Gold Novoin.`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else if (successCount > 0) {
        Alert.alert(
          "Konversi Sebagian Berhasil",
          `${successCount} dari ${conversionAmount} konversi berhasil.`
        );
        await refreshUser();
      } else {
        Alert.alert("Gagal", "Konversi gagal. Silakan coba lagi.");
      }
    } catch (error) {
      Alert.alert("Error", "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsConverting(false);
      setConversionAmount(1);
    }
  };

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <LinearGradient
          colors={["rgba(192, 192, 192, 0.2)", "rgba(255, 215, 0, 0.2)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerIconsRow}>
            <LinearGradient
              colors={["#C0C0C0", "#A8A8A8"]}
              style={styles.coinIconLarge}
            >
              <CoinIcon size={32} color="#FFFFFF" />
            </LinearGradient>
            <RefreshCwIcon size={24} color={theme.textSecondary} />
            <LinearGradient
              colors={["#FFD700", "#FFA500"]}
              style={styles.coinIconLarge}
            >
              <CoinIcon size={32} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <ThemedText style={[Typography.h2, styles.headerTitle]}>
            Konversi Novoin
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            Tukarkan Silver Novoin menjadi Gold Novoin
          </ThemedText>
        </LinearGradient>
      </View>

      <Card elevation={1} style={styles.balanceCard}>
        <ThemedText style={[styles.balanceLabel, { color: theme.textSecondary }]}>
          Saldo Kamu Saat Ini
        </ThemedText>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <LinearGradient
              colors={["#C0C0C0", "#A8A8A8"]}
              style={styles.balanceIcon}
            >
              <CoinIcon size={16} color="#FFFFFF" />
            </LinearGradient>
            <View>
              <ThemedText style={styles.balanceValue}>{silverBalance.toLocaleString()}</ThemedText>
              <ThemedText style={[styles.balanceType, { color: theme.textSecondary }]}>Silver</ThemedText>
            </View>
          </View>
          <View style={[styles.balanceDivider, { backgroundColor: theme.cardBorder }]} />
          <View style={styles.balanceItem}>
            <LinearGradient
              colors={["#FFD700", "#FFA500"]}
              style={styles.balanceIcon}
            >
              <CoinIcon size={16} color="#FFFFFF" />
            </LinearGradient>
            <View>
              <ThemedText style={styles.balanceValue}>{goldBalance.toLocaleString()}</ThemedText>
              <ThemedText style={[styles.balanceType, { color: theme.textSecondary }]}>Gold</ThemedText>
            </View>
          </View>
        </View>
      </Card>

      <Card elevation={1} style={styles.rateCard}>
        <View style={styles.rateRow}>
          <View style={styles.rateItem}>
            <LinearGradient colors={["#C0C0C0", "#A8A8A8"]} style={styles.rateIcon}>
              <CoinIcon size={14} color="#FFFFFF" />
            </LinearGradient>
            <ThemedText style={styles.rateValue}>1000</ThemedText>
          </View>
          <ThemedText style={[styles.rateEquals, { color: theme.textSecondary }]}>=</ThemedText>
          <View style={styles.rateItem}>
            <LinearGradient colors={["#FFD700", "#FFA500"]} style={styles.rateIcon}>
              <CoinIcon size={14} color="#FFFFFF" />
            </LinearGradient>
            <ThemedText style={styles.rateValue}>1</ThemedText>
          </View>
        </View>
      </Card>

      {canConvert ? (
        <Card elevation={2} style={styles.conversionCard}>
          <ThemedText style={[styles.conversionLabel, { color: theme.textSecondary }]}>
            Jumlah Gold yang Ingin Didapatkan
          </ThemedText>
          
          <View style={styles.amountSelector}>
            <Pressable
              onPress={handleDecrement}
              disabled={conversionAmount <= 1}
              style={({ pressed }) => [
                styles.amountButton,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  opacity: conversionAmount <= 1 ? 0.4 : pressed ? 0.7 : 1
                }
              ]}
            >
              <MinusIcon size={24} color={theme.text} />
            </Pressable>
            
            <View style={styles.amountDisplay}>
              <LinearGradient
                colors={["#FFD700", "#FFA500"]}
                style={styles.amountIconBg}
              >
                <CoinIcon size={24} color="#FFFFFF" />
              </LinearGradient>
              <ThemedText style={styles.amountValue}>{conversionAmount}</ThemedText>
              <ThemedText style={[styles.amountLabel, { color: theme.textSecondary }]}>Gold</ThemedText>
            </View>
            
            <Pressable
              onPress={handleIncrement}
              disabled={conversionAmount >= maxConversions}
              style={({ pressed }) => [
                styles.amountButton,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  opacity: conversionAmount >= maxConversions ? 0.4 : pressed ? 0.7 : 1
                }
              ]}
            >
              <PlusIcon size={24} color={theme.text} />
            </Pressable>
          </View>

          <View style={[styles.summaryBox, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.summaryRow}>
              <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Silver yang dibutuhkan
              </ThemedText>
              <View style={styles.summaryValue}>
                <LinearGradient colors={["#C0C0C0", "#A8A8A8"]} style={styles.summaryIcon}>
                  <CoinIcon size={12} color="#FFFFFF" />
                </LinearGradient>
                <ThemedText style={styles.summaryAmount}>{silverNeeded.toLocaleString()}</ThemedText>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Gold yang didapat
              </ThemedText>
              <View style={styles.summaryValue}>
                <LinearGradient colors={["#FFD700", "#FFA500"]} style={styles.summaryIcon}>
                  <CoinIcon size={12} color="#FFFFFF" />
                </LinearGradient>
                <ThemedText style={styles.summaryAmount}>{conversionAmount}</ThemedText>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                Sisa Silver setelah konversi
              </ThemedText>
              <View style={styles.summaryValue}>
                <LinearGradient colors={["#C0C0C0", "#A8A8A8"]} style={styles.summaryIcon}>
                  <CoinIcon size={12} color="#FFFFFF" />
                </LinearGradient>
                <ThemedText style={styles.summaryAmount}>
                  {(silverBalance - silverNeeded).toLocaleString()}
                </ThemedText>
              </View>
            </View>
          </View>

          <ThemedText style={[styles.maxInfo, { color: theme.textMuted }]}>
            Maksimal konversi: {maxConversions} Gold
          </ThemedText>

          <Pressable
            onPress={handleConvert}
            disabled={isConverting || !hasEnoughSilver}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <LinearGradient
              colors={hasEnoughSilver ? ["#FFD700", "#FFA500"] : [theme.backgroundSecondary, theme.backgroundSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.convertButton}
            >
              {isConverting ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <RefreshCwIcon size={20} color={hasEnoughSilver ? "#000000" : theme.textMuted} />
                  <ThemedText style={[styles.convertButtonText, { color: hasEnoughSilver ? "#000000" : theme.textMuted }]}>
                    Konversi Sekarang
                  </ThemedText>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Card>
      ) : (
        <Card elevation={1} style={styles.insufficientCard}>
          <View style={[styles.insufficientIcon, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
            <AlertCircleIcon size={32} color="#EF4444" />
          </View>
          <ThemedText style={[Typography.h3, styles.insufficientTitle]}>
            Silver Novoin Tidak Cukup
          </ThemedText>
          <ThemedText style={[styles.insufficientText, { color: theme.textSecondary }]}>
            Kamu membutuhkan minimal 1000 Silver Novoin untuk melakukan konversi ke 1 Gold Novoin.
          </ThemedText>
          <View style={[styles.insufficientInfo, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText style={[styles.insufficientInfoLabel, { color: theme.textSecondary }]}>
              Saldo Silver kamu saat ini
            </ThemedText>
            <View style={styles.insufficientInfoValue}>
              <LinearGradient colors={["#C0C0C0", "#A8A8A8"]} style={styles.summaryIcon}>
                <CoinIcon size={12} color="#FFFFFF" />
              </LinearGradient>
              <ThemedText style={styles.insufficientInfoAmount}>{silverBalance}</ThemedText>
            </View>
          </View>
          <View style={[styles.insufficientInfo, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText style={[styles.insufficientInfoLabel, { color: theme.textSecondary }]}>
              Silver yang masih dibutuhkan
            </ThemedText>
            <View style={styles.insufficientInfoValue}>
              <LinearGradient colors={["#C0C0C0", "#A8A8A8"]} style={styles.summaryIcon}>
                <CoinIcon size={12} color="#FFFFFF" />
              </LinearGradient>
              <ThemedText style={[styles.insufficientInfoAmount, { color: "#EF4444" }]}>
                {SILVER_PER_GOLD - silverBalance}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.tipText, { color: theme.textMuted }]}>
            Kumpulkan Silver Novoin dari event dan aktivitas di Novea!
          </ThemedText>
        </Card>
      )}

      <View style={styles.spacer} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.lg,
  },
  headerGradient: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  headerIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  coinIconLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  balanceCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  balanceLabel: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
    justifyContent: "center",
  },
  balanceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  balanceType: {
    fontSize: 12,
  },
  balanceDivider: {
    width: 1,
    height: 40,
    marginHorizontal: Spacing.lg,
  },
  rateCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  rateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  rateIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  rateValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  rateEquals: {
    fontSize: 20,
    fontWeight: "600",
  },
  conversionCard: {
    padding: Spacing.xl,
  },
  conversionLabel: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  amountSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  amountButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  amountDisplay: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  amountIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  amountValue: {
    fontSize: 32,
    fontWeight: "800",
  },
  amountLabel: {
    fontSize: 12,
  },
  summaryBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  summaryIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: "600",
  },
  maxInfo: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  convertButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  convertButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  insufficientCard: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  insufficientIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  insufficientTitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  insufficientText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  insufficientInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    width: "100%",
    marginBottom: Spacing.sm,
  },
  insufficientInfoLabel: {
    fontSize: 13,
  },
  insufficientInfoValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  insufficientInfoAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  tipText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: Spacing.md,
    fontStyle: "italic",
  },
  spacer: {
    height: Spacing["2xl"],
  },
});
