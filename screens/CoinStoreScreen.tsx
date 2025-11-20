import React from "react";
import { View, StyleSheet, FlatList, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
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
    <Pressable
      onPress={() => handlePurchase(item)}
      style={({ pressed }) => [
        styles.packageCard,
        {
          backgroundColor: theme.backgroundDefault,
          borderWidth: item.isPopular ? 2 : 0,
          borderColor: item.isPopular ? theme.primary : "transparent",
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {item.isPopular && (
        <View style={[styles.popularBadge, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.popularText}>POPULAR</ThemedText>
        </View>
      )}
      <Image source={require("@/assets/images/icons/coin.png")} style={styles.packageIcon} />
      <ThemedText style={[Typography.h2, { color: theme.secondary, marginVertical: Spacing.sm }]}>
        {item.coins}
      </ThemedText>
      {item.bonus > 0 && (
        <View style={[styles.bonusBadge, { backgroundColor: theme.success }]}>
          <ThemedText style={styles.bonusText}>+{item.bonus} BONUS</ThemedText>
        </View>
      )}
      <ThemedText style={[styles.price, { color: theme.textSecondary, marginTop: Spacing.md }]}>
        Rp {(item.price / 100).toLocaleString()}
      </ThemedText>
      <Button
        onPress={() => handlePurchase(item)}
        style={[styles.buyButton, { marginTop: Spacing.md }]}
      >
        Buy Now
      </Button>
    </Pressable>
  );

  return (
    <ScreenScrollView>
      <View style={[styles.balanceCard, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText style={[styles.balanceLabel, { color: theme.textSecondary }]}>
          Current Balance
        </ThemedText>
        <View style={styles.balanceRow}>
          <Image source={require("@/assets/images/icons/coin.png")} style={styles.balanceIcon} />
          <ThemedText style={[Typography.h1, { color: theme.secondary }]}>
            {user?.coinBalance || 0}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={[Typography.h2, styles.sectionTitle]}>Coin Packages</ThemedText>
      
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
    padding: Spacing.xl,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: Spacing.sm,
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
    marginBottom: Spacing.lg,
  },
  packageGrid: {
    gap: Spacing.md,
  },
  packageRow: {
    gap: Spacing.md,
  },
  packageCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    position: "relative",
  },
  popularBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: Spacing.xs,
    borderTopLeftRadius: BorderRadius.sm,
    borderTopRightRadius: BorderRadius.sm,
    alignItems: "center",
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
