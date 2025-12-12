import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, ViewStyle, Modal, ActivityIndicator, Alert, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { StarIcon } from "@/components/icons/StarIcon";
import { GiftIcon } from "@/components/icons/GiftIcon";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { formatRupiah, COIN_PACKAGES, NOVOIN_TO_RUPIAH } from "@/constants/pricing";
import { Spacing, BorderRadius, Typography, GradientColors } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";
import {
  initializeBilling,
  purchaseProduct,
  isGooglePlayAvailable,
  endBillingConnection,
  setStoredUserId,
  type NovoinProductId,
} from "@/utils/googlePlayBilling";

interface SelectedPackage {
  id: string;
  coins: number;
  bonus: number;
  priceRupiah: number;
}

export default function CoinStoreScreen() {
  const { theme } = useTheme();
  const { user, updateCoinBalance, refreshUser } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<SelectedPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBillingReady, setIsBillingReady] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    async function setupBilling() {
      if (isGooglePlayAvailable() && user) {
        setStoredUserId(user.id);
        const initialized = await initializeBilling(user.id);
        setIsBillingReady(initialized);
      }
    }
    setupBilling();

    return () => {
      endBillingConnection();
    };
  }, [user?.id]);

  const handleSelectPackage = (packageItem: typeof COIN_PACKAGES[0]) => {
    setSelectedPackage(packageItem);
    setShowConfirmModal(true);
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !user) return;

    if (!isGooglePlayAvailable()) {
      Alert.alert(
        "Tidak Tersedia",
        "Pembelian Novoin hanya tersedia di aplikasi Android. Silakan gunakan Expo Go atau build APK untuk melakukan pembelian."
      );
      return;
    }

    if (!isBillingReady) {
      Alert.alert("Error", "Layanan pembayaran belum siap. Silakan coba lagi.");
      return;
    }

    setIsProcessing(true);
    setShowConfirmModal(false);

    try {
      await purchaseProduct(
        selectedPackage.id as NovoinProductId,
        user.id,
        async (totalCoins) => {
          await refreshUser();
          setIsProcessing(false);
          Alert.alert(
            "Pembelian Berhasil!",
            `${totalCoins} Novoin telah ditambahkan ke akun kamu.`,
            [{ text: "OK" }]
          );
        },
        (error) => {
          setIsProcessing(false);
          if (error !== "User cancelled") {
            Alert.alert("Pembelian Gagal", error);
          }
        }
      );
    } catch (error: any) {
      setIsProcessing(false);
      Alert.alert("Error", error.message || "Terjadi kesalahan. Silakan coba lagi.");
    }
  };

  const handleSimulatePurchase = async () => {
    if (!selectedPackage) return;
    
    const totalCoins = selectedPackage.coins + selectedPackage.bonus;
    await updateCoinBalance(totalCoins);
    setShowConfirmModal(false);
    Alert.alert("Berhasil!", `${totalCoins} Novoin telah ditambahkan (Development Mode)`);
  };

  const renderPackage = ({ item }: { item: typeof COIN_PACKAGES[0] }) => {
    const cardStyle: ViewStyle = StyleSheet.flatten([
      styles.packageCard,
      item.isPopular && { borderWidth: 2, borderColor: theme.primary },
    ]);

    return (
    <Card 
      elevation={1}
      onPress={() => handleSelectPackage(item)}
      style={cardStyle}
    >
      {item.isPopular ? (
        <LinearGradient
          colors={GradientColors.purplePink.colors}
          start={GradientColors.purplePink.start}
          end={GradientColors.purplePink.end}
          style={styles.popularBadge}
        >
          <StarIcon size={10} color="#FFFFFF" />
          <ThemedText style={styles.popularText}>POPULER</ThemedText>
        </LinearGradient>
      ) : null}
      <CoinIcon size={48} color={theme.secondary} />
      <ThemedText style={[Typography.h1, { color: theme.text, marginVertical: Spacing.sm, fontWeight: "800" }]}>
        {item.coins}
      </ThemedText>
      {item.bonus > 0 ? (
        <View style={[styles.bonusBadge, { backgroundColor: theme.success }]}>
          <ThemedText style={styles.bonusText}>+{item.bonus} BONUS</ThemedText>
        </View>
      ) : null}
      <ThemedText style={[styles.price, { color: theme.textSecondary, marginTop: Spacing.md, fontSize: 16, fontWeight: "700" }]}>
        {formatRupiah(item.priceRupiah)}
      </ThemedText>
      <LinearGradient
        colors={GradientColors.yellowGreen.colors}
        start={GradientColors.yellowGreen.start}
        end={GradientColors.yellowGreen.end}
        style={[styles.buyButton, { marginTop: Spacing.md }]}
      >
        <Pressable onPress={() => handleSelectPackage(item)} style={styles.buyButtonInner}>
          <ThemedText style={styles.buyButtonText}>Beli Sekarang</ThemedText>
        </Pressable>
      </LinearGradient>
    </Card>
  );
  };

  return (
    <ScreenScrollView>
      <LinearGradient
        colors={GradientColors.yellowGreen.colors}
        start={GradientColors.yellowGreen.start}
        end={GradientColors.yellowGreen.end}
        style={styles.balanceCard}
      >
        <ThemedText style={[styles.balanceLabel, { color: "#000000" }]}>
          Saldo Novoin Kamu
        </ThemedText>
        <View style={styles.balanceRow}>
          <CoinIcon size={32} color="#000000" />
          <ThemedText style={[Typography.h1, { color: "#000000", fontWeight: "800" }]}>
            {user?.coinBalance || 0}
          </ThemedText>
        </View>
        <ThemedText style={[styles.balanceValue, { color: "#000000" }]}>
          = {formatRupiah((user?.coinBalance || 0) * NOVOIN_TO_RUPIAH)}
        </ThemedText>
      </LinearGradient>

      <View style={styles.infoCard}>
        <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
          1 Novoin = Rp 1.000
        </ThemedText>
      </View>

      {!isGooglePlayAvailable() ? (
        <View style={[styles.webNotice, { backgroundColor: theme.warning + "20" }]}>
          <Feather name="info" size={16} color={theme.warning} />
          <ThemedText style={[styles.webNoticeText, { color: theme.warning }]}>
            Pembelian hanya tersedia di aplikasi Android
          </ThemedText>
        </View>
      ) : null}

      <ThemedText style={[Typography.h2, styles.sectionTitle, { fontWeight: "700" }]}>Paket Novoin</ThemedText>
      
      <FlatList
        data={COIN_PACKAGES}
        renderItem={renderPackage}
        keyExtractor={(item) => item.id}
        numColumns={2}
        scrollEnabled={false}
        contentContainerStyle={styles.packageGrid}
        columnWrapperStyle={styles.packageRow}
      />

      <ThemedText style={[Typography.h3, styles.sectionTitle, { marginTop: Spacing.xl }]}>
        Dapatkan Novoin Gratis
      </ThemedText>
      <View style={[styles.freeCoinsCard, { backgroundColor: theme.backgroundDefault }]}>
        <GiftIcon size={24} color={theme.secondary} />
        <View style={styles.freeCoinsContent}>
          <ThemedText style={styles.freeCoinsTitle}>Hadiah Login Harian</ThemedText>
          <ThemedText style={[styles.freeCoinsText, { color: theme.textSecondary }]}>
            Dapatkan 5 Novoin setiap hari
          </ThemedText>
        </View>
        <Button style={styles.claimButton}>Klaim</Button>
      </View>

      <Modal
        visible={showConfirmModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[Typography.h2, { fontWeight: "700" }]}>Konfirmasi Pembelian</ThemedText>
              <Pressable onPress={() => setShowConfirmModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {selectedPackage ? (
              <View style={[styles.selectedPackageInfo, { backgroundColor: theme.backgroundSecondary }]}>
                <CoinIcon size={48} />
                <View style={{ marginLeft: Spacing.md, flex: 1 }}>
                  <ThemedText style={{ fontSize: 24, fontWeight: "700" }}>
                    {selectedPackage.coins + selectedPackage.bonus} Novoin
                  </ThemedText>
                  {selectedPackage.bonus > 0 ? (
                    <ThemedText style={{ color: theme.success, fontSize: 14 }}>
                      Termasuk {selectedPackage.bonus} bonus
                    </ThemedText>
                  ) : null}
                  <ThemedText style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
                    {formatRupiah(selectedPackage.priceRupiah)}
                  </ThemedText>
                </View>
              </View>
            ) : null}

            <View style={styles.paymentInfo}>
              <Feather name="shield" size={20} color={theme.primary} />
              <ThemedText style={[styles.paymentInfoText, { color: theme.textSecondary }]}>
                Pembayaran diproses melalui Google Play Store dengan keamanan terjamin
              </ThemedText>
            </View>

            <Button
              onPress={handlePurchase}
              style={styles.purchaseButton}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                `Beli ${formatRupiah(selectedPackage?.priceRupiah || 0)}`
              )}
            </Button>

            {__DEV__ ? (
              <Pressable
                onPress={handleSimulatePurchase}
                style={[styles.devButton, { backgroundColor: theme.backgroundSecondary }]}
              >
                <ThemedText style={styles.devButtonText}>
                  [DEV] Simulasi Pembelian
                </ThemedText>
              </Pressable>
            ) : null}
          </ThemedView>
        </View>
      </Modal>

      {isProcessing ? (
        <View style={styles.processingOverlay}>
          <View style={[styles.processingCard, { backgroundColor: theme.backgroundDefault }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText style={{ marginTop: Spacing.md }}>Memproses pembelian...</ThemedText>
          </View>
        </View>
      ) : null}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  balanceValue: {
    fontSize: 14,
    marginTop: Spacing.xs,
    opacity: 0.8,
  },
  infoCard: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  infoText: {
    fontSize: 12,
    fontWeight: "500",
  },
  webNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  webNoticeText: {
    fontSize: 13,
    flex: 1,
  },
  sectionTitle: {
    marginBottom: Spacing.xl,
  },
  packageGrid: {
    gap: Spacing.md,
  },
  packageRow: {
    gap: Spacing.md,
  },
  packageCard: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: Spacing["2xl"],
    borderRadius: BorderRadius.md,
    alignItems: "center",
    position: "relative",
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    paddingVertical: Spacing.xs,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
  },
  popularText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bonusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  bonusText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  price: {
    fontSize: 18,
    fontWeight: "600",
  },
  buyButton: {
    width: "100%",
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
  },
  buyButtonInner: {
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },
  freeCoinsCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  freeCoinsContent: {
    flex: 1,
  },
  freeCoinsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  freeCoinsText: {
    fontSize: 14,
  },
  claimButton: {
    minWidth: 80,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  selectedPackageInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  paymentInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    padding: Spacing.md,
  },
  paymentInfoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  purchaseButton: {
    width: "100%",
  },
  devButton: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  devButtonText: {
    fontSize: 12,
    opacity: 0.7,
  },
  processingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  processingCard: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
});
