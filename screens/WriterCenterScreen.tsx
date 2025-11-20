import React from "react";
import { View, StyleSheet } from "react-native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";

export default function WriterCenterScreen() {
  const { theme } = useTheme();

  return (
    <ScreenScrollView>
      <View style={styles.container}>
        <Card elevation={1} style={styles.comingSoonCard}>
          <View style={[styles.iconCircle, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="edit-3" size={48} color={theme.text} />
          </View>
          
          <ThemedText style={[Typography.h1, styles.title]}>
            Coming Soon
          </ThemedText>
          
          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            Pusat Penulis is under development. Here you'll be able to:
          </ThemedText>
          
          <View style={styles.featureList}>
            <FeatureItem icon="book" text="Create and manage your novels" theme={theme} />
            <FeatureItem icon="file-text" text="Write and edit chapters" theme={theme} />
            <FeatureItem icon="trending-up" text="Track your novel analytics" theme={theme} />
            <FeatureItem icon="dollar-sign" text="Monitor your earnings" theme={theme} />
            <FeatureItem icon="users" text="Engage with your readers" theme={theme} />
          </View>
          
          <ThemedText style={[styles.footer, { color: theme.textMuted }]}>
            We're working hard to bring you the best writing experience.
          </ThemedText>
        </Card>
      </View>
    </ScreenScrollView>
  );
}

function FeatureItem({ icon, text, theme }: { icon: any; text: string; theme: any }) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIconCircle, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name={icon} size={16} color={theme.text} />
      </View>
      <ThemedText style={styles.featureText}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing["2xl"],
  },
  comingSoonCard: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    paddingHorizontal: Spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  title: {
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: Spacing["2xl"],
    lineHeight: 24,
  },
  featureList: {
    width: "100%",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    fontSize: 15,
    flex: 1,
  },
  footer: {
    fontSize: 13,
    textAlign: "center",
    fontStyle: "italic",
  },
});
