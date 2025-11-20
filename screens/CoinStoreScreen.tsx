import React from "react";
import { View, StyleSheet, FlatList, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Typography, GradientColors } from "@/constants/theme";
import { coinPackages } from "@/utils/mockData";

export default function CoinStoreScreen() {
  const { theme } = useTheme();
  const { user, updateCoinBalance } = useAuth();

  const handlePurchase = async (packageItem: any) => {
    const totalCoins = packageItem.coins + packageItem.bonus;
    await updateCoinBalance(totalCoins);
    alert(`Successfully purchased ${totalCoins} coins!`);
  };

  const renderPackage = ({ item }: any) => (
    <Card 
      elevation={1}
      onPress={() => handlePurchase(item)}
      style={[
        styles.packageCard,
        item.isPopular && { borderWidth: 2, borderColor: theme.primary },
      ]}
    >
      {item.isPopular && (
        <LinearGradient
          colors={GradientColors.purplePink.colors}
          start={GradientColors.purplePink.start}
          end={GradientColors.purplePink.end}
          style={styles.popularBadge}
        >
          <Feather name="star" size={10} color="#FFFFFF" />
          <ThemedText style={styles.popularText}>POPULAR</ThemedText>
        </LinearGradient>
      )}
      <Feather name="circle" size={48} color={theme.secondary} />
      <ThemedText style={[Typography.h1, { color: theme.text, marginVertical: Spacing.sm, fontWeight: "800" }]}>
        {item.coins}
      </ThemedText>
      {item.bonus > 0 && (
        <View style={[styles.bonusBadge, { backgroundColor: theme.success }]}>
          <ThemedText style={styles.bonusText}>+{item.bonus} BONUS</ThemedText>
        </View>
      )}
      <ThemedText style={[styles.price, { color: theme.textSecondary, marginTop: Spacing.md, fontSize: 18, fontWeight: "700" }]}>
        Rp {(item.price / 100).toLocaleString()}
      </ThemedText>
      <LinearGradient
        colors={GradientColors.yellowGreen.colors}
        start={GradientColors.yellowGreen.start}
        end={GradientColors.yellowGreen.end}
        style={[styles.buyButton, { marginTop: Spacing.md }]}
      >
        <Pressable onPress={() => handlePurchase(item)} style={styles.buyButtonInner}>
          <ThemedText style={styles.buyButtonText}>Buy Now</ThemedText>
        </Pressable>
      </LinearGradient>
    </Card>
  );

  return (
    <ScreenScrollView>
      <LinearGradient
        colors={GradientColors.yellowGreen.colors}
        start={GradientColors.yellowGreen.start}
        end={GradientColors.yellowGreen.end}
        style={styles.balanceCard}
      >
        <ThemedText style={[styles.balanceLabel, { color: "#000000" }]}>
          Current Balance
        </ThemedText>
        <View style={styles.balanceRow}>
          <Feather name="circle" size={32} color="#000000" />
          <ThemedText style={[Typography.h1, { color: "#000000", fontWeight: "800" }]}>
            {user?.coinBalance || 0}
          </ThemedText>
        </View>
      </LinearGradient>

      <ThemedText style={[Typography.h2, styles.sectionTitle, { fontWeight: "700" }]}>Coin Packages</ThemedText>
      
      <FlatList
        data={coinPackages}
        renderItem={renderPackage}
        keyExtractor={(item) => item.id}
        numColumns={2}
        scrollEnabled={false}
        contentContainerStyle={styles.packageGrid}
        columnWrapperStyle={styles.packageRow}
      />

      <ThemedText style={[Typography.h3, styles.sectionTitle, { marginTop: Spacing.xl }]}>
        Get Free Coins
      </ThemedText>
      <View style={[styles.freeCoinsCard, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="gift" size={24} color={theme.secondary} />
        <View style={styles.freeCoinsContent}>
          <ThemedText style={styles.freeCoinsTitle}>Daily Login Reward</ThemedText>
          <ThemedText style={[styles.freeCoinsText, { color: theme.textSecondary }]}>
            Get 10 coins every day
          </ThemedText>
        </View>
        <Button style={styles.claimButton}>Claim</Button>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginBottom: Spacing["2xl"],
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
  balanceIcon: {
    width: 32,
    height: 32,
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
  packageIcon: {
    width: 64,
    height: 64,
    marginTop: Spacing.md,
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
