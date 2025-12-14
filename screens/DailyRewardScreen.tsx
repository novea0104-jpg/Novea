import React from "react";
import { View, StyleSheet } from "react-native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { DailyRewardCard } from "@/components/DailyRewardCard";
import { useTheme } from "@/hooks/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { Spacing } from "@/constants/theme";

export default function DailyRewardScreen() {
  const { theme } = useTheme();
  const { isDesktop, isTablet } = useResponsive();
  const sidebarWidth = (isDesktop || isTablet) ? 220 : 0;

  return (
    <ScreenScrollView style={{ marginLeft: sidebarWidth }}>
      <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
        Login setiap hari untuk mengumpulkan Silver Novoin gratis!
      </ThemedText>

      <DailyRewardCard />

      <View style={styles.infoSection}>
        <ThemedText style={[styles.infoTitle, { color: theme.text }]}>
          Cara Kerja
        </ThemedText>
        <View style={styles.infoItem}>
          <View style={[styles.infoBullet, { backgroundColor: theme.primary }]} />
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            Klaim hadiah harian setiap hari untuk membangun streak
          </ThemedText>
        </View>
        <View style={styles.infoItem}>
          <View style={[styles.infoBullet, { backgroundColor: theme.primary }]} />
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            Streak yang lebih tinggi memberikan hadiah lebih besar
          </ThemedText>
        </View>
        <View style={styles.infoItem}>
          <View style={[styles.infoBullet, { backgroundColor: theme.primary }]} />
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            Hari ke-4 dan ke-7 memberikan bonus ekstra!
          </ThemedText>
        </View>
        <View style={styles.infoItem}>
          <View style={[styles.infoBullet, { backgroundColor: "#EF4444" }]} />
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            Jika melewatkan satu hari, streak akan reset ke 0
          </ThemedText>
        </View>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  infoSection: {
    marginTop: Spacing.md,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  infoBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});
