import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, ViewStyle, Modal, ActivityIndicator, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
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
import { createPayment, generateOrderId, PAYMENT_METHODS, PAYMENT_METHOD_NAMES, checkTransactionStatus } from "@/utils/duitku";
import { Feather } from "@expo/vector-icons";

type PaymentMethodKey = keyof typeof PAYMENT_METHODS;

interface SelectedPackage {
  id: string;
  coins: number;
  bonus: number;
  priceRupiah: number;
}

const AVAILABLE_PAYMENT_METHODS: { key: PaymentMethodKey; icon: string }[] = [
  { key: "QRIS", icon: "smartphone" },
  { key: "VA_BCA", icon: "credit-card" },
  { key: "VA_MANDIRI", icon: "credit-card" },
  { key: "VA_BNI", icon: "credit-card" },
  { key: "VA_BRI", icon: "credit-card" },
  { key: "OVO", icon: "dollar-sign" },
  { key: "DANA", icon: "dollar-sign" },
  { key: "SHOPEEPAY", icon: "shopping-bag" },
];

export default function CoinStoreScreen() {
  const { theme } = useTheme();
  const { user, updateCoinBalance } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<SelectedPackage | null>(null);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  const handleSelectPackage = (packageItem: typeof COIN_PACKAGES[0]) => {
    setSelectedPackage(packageItem);
    setIsPaymentModalVisible(true);
  };

  const handlePaymentMethodSelect = async (methodKey: PaymentMethodKey) => {
    if (!selectedPackage || !user) return;

    setIsProcessing(true);
    const orderId = generateOrderId();
    setCurrentOrderId(orderId);

    try {
      const paymentMethod = PAYMENT_METHODS[methodKey];
      const totalCoins = selectedPackage.coins + selectedPackage.bonus;

      const paymentResult = await createPayment({
        merchantOrderId: orderId,
        productDetails: `Pembelian ${totalCoins} Novoin`,
        amount: selectedPackage.priceRupiah,
        email: user.email,
        customerName: user.name,
        callbackUrl: "https://noveaindonesia.com/api/payment/callback",
        returnUrl: "https://noveaindonesia.com/payment/success",
        paymentMethod: paymentMethod,
      });

      if (paymentResult && paymentResult.paymentUrl) {
        setIsPaymentModalVisible(false);
        
        const result = await WebBrowser.openBrowserAsync(paymentResult.paymentUrl, {
          dismissButtonStyle: "close",
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        });

        if (result.type === "cancel" || result.type === "dismiss") {
          setTimeout(() => checkPaymentStatus(orderId, totalCoins), 2000);
        }
      } else {
        Alert.alert("Error", "Gagal membuat pembayaran. Silakan coba lagi.");
      }
    } catch (error) {
      console.error("Payment error:", error);
      Alert.alert("Error", "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsProcessing(false);
    }
  };

  const checkPaymentStatus = async (orderId: string, totalCoins: number) => {
    try {
      const status = await checkTransactionStatus(orderId);
      
      if (status && status.statusCode === "00") {
        await updateCoinBalance(totalCoins);
        Alert.alert(
          "Pembayaran Berhasil!",
          `${totalCoins} Novoin telah ditambahkan ke akun kamu.`,
          [{ text: "OK" }]
        );
      } else if (status && status.statusCode === "01") {
        Alert.alert(
          "Menunggu Pembayaran",
          "Pembayaran kamu sedang diproses. Saldo akan otomatis bertambah setelah pembayaran dikonfirmasi.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    }
  };

  const handleSimulatePurchase = async () => {
    if (!selectedPackage) return;
    
    const totalCoins = selectedPackage.coins + selectedPackage.bonus;
    await updateCoinBalance(totalCoins);
    setIsPaymentModalVisible(false);
    Alert.alert("Berhasil!", `${totalCoins} Novoin telah ditambahkan (Sandbox Test)`);
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

  const renderPaymentMethod = ({ item }: { item: { key: PaymentMethodKey; icon: string } }) => {
    const methodCode = PAYMENT_METHODS[item.key];
    const methodName = PAYMENT_METHOD_NAMES[methodCode];

    return (
      <Pressable
        onPress={() => handlePaymentMethodSelect(item.key)}
        style={({ pressed }) => [
          styles.paymentMethodItem,
          { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <View style={[styles.paymentMethodIcon, { backgroundColor: theme.primary + "20" }]}>
          <Feather name={item.icon as any} size={20} color={theme.primary} />
        </View>
        <ThemedText style={styles.paymentMethodName}>{methodName}</ThemedText>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>
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
        visible={isPaymentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[Typography.h2, { fontWeight: "700" }]}>Pilih Pembayaran</ThemedText>
              <Pressable onPress={() => setIsPaymentModalVisible(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {selectedPackage ? (
              <View style={[styles.selectedPackageInfo, { backgroundColor: theme.backgroundSecondary }]}>
                <CoinIcon size={32} />
                <View style={{ marginLeft: Spacing.md }}>
                  <ThemedText style={{ fontSize: 18, fontWeight: "700" }}>
                    {selectedPackage.coins + selectedPackage.bonus} Novoin
                  </ThemedText>
                  <ThemedText style={{ color: theme.textSecondary }}>
                    {formatRupiah(selectedPackage.priceRupiah)}
                  </ThemedText>
                </View>
              </View>
            ) : null}

            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <ThemedText style={{ marginTop: Spacing.md }}>Memproses pembayaran...</ThemedText>
              </View>
            ) : (
              <>
                <FlatList
                  data={AVAILABLE_PAYMENT_METHODS}
                  renderItem={renderPaymentMethod}
                  keyExtractor={(item) => item.key}
                  style={styles.paymentMethodList}
                  scrollEnabled={false}
                />

                <View style={styles.sandboxNote}>
                  <Feather name="info" size={16} color={theme.warning} />
                  <ThemedText style={[styles.sandboxNoteText, { color: theme.warning }]}>
                    Mode Sandbox - Untuk testing
                  </ThemedText>
                </View>

                <Button
                  variant="secondary"
                  onPress={handleSimulatePurchase}
                  style={{ marginTop: Spacing.sm }}
                >
                  Test: Simulasi Pembelian Sukses
                </Button>
              </>
            )}
          </ThemedView>
        </View>
      </Modal>
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
    maxHeight: "80%",
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
  paymentMethodList: {
    maxHeight: 350,
  },
  paymentMethodItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  paymentMethodName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  processingContainer: {
    alignItems: "center",
    padding: Spacing["2xl"],
  },
  sandboxNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  sandboxNoteText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
