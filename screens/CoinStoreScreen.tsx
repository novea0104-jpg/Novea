import React from "react";
import { View, StyleSheet, FlatList, Pressable, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { StarIcon } from "@/components/icons/StarIcon";
import { GiftIcon } from "@/components/icons/GiftIcon";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { formatRupiah, COIN_PACKAGES, NOVOIN_TO_RUPIAH } from "@/constants/pricing";
import { Spacing, BorderRadius, Typography, GradientColors } from "@/constants/theme";

export default function CoinStoreScreen() {
  const { theme } = useTheme();
  const { user, updateCoinBalance } = useAuth();

  const handlePurchase = async (packageItem: typeof COIN_PACKAGES[0]) => {
    const totalCoins = packageItem.coins + packageItem.bonus;
    await updateCoinBalance(totalCoins);
    alert(`Berhasil membeli ${totalCoins} Novoin!`);
  };

  const renderPackage = ({ item }: { item: typeof COIN_PACKAGES[0] }) => {
    const cardStyle: ViewStyle = StyleSheet.flatten([
      styles.packageCard,
      item.isPopular && { borderWidth: 2, borderColor: theme.primary },
    ]);

    return (
    <Card 
      elevation={1}
      onPress={() => handlePurchase(item)}
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
        <Pressable onPress={() => handlePurchase(item)} style={styles.buyButtonInner}>
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
});
