import React from "react";
import { View, StyleSheet } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography } from "@/constants/theme";

export default function TimelineScreen() {
  const { theme } = useTheme();

  return (
    <ScreenScrollView>
      <View style={styles.container}>
        <View style={[styles.emptyState, { backgroundColor: theme.cardBackground }]}>
          <ThemedText style={[styles.emptyTitle, { fontSize: Typography.size.xl }]}>
            Linimasa
          </ThemedText>
          <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
            Fitur linimasa post akan segera hadir
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: theme.textMuted, marginTop: Spacing.md }]}>
            Di sini kamu bisa melihat update terbaru dari penulis favorit, share pemikiran tentang novel, dan berinteraksi dengan komunitas pembaca lainnya.
          </ThemedText>
        </View>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  emptyState: {
    padding: Spacing.xl,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
  },
  emptyTitle: {
    fontWeight: "700",
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.size.md,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: Typography.size.sm,
    textAlign: "center",
    lineHeight: 20,
  },
});
