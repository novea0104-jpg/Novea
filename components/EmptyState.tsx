import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface EmptyStateProps {
  type: "library" | "search" | "notifications";
  title: string;
  message: string;
}

export function EmptyState({ type, title, message }: EmptyStateProps) {
  const { theme } = useTheme();

  const imageSource = {
    library: require("@/assets/images/empty-states/library.png"),
    search: require("@/assets/images/empty-states/search.png"),
    notifications: require("@/assets/images/empty-states/notifications.png"),
  };

  return (
    <View style={styles.container}>
      <Image source={imageSource[type]} style={styles.image} contentFit="contain" />
      <ThemedText style={styles.title}>{title}</ThemedText>
      <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["3xl"],
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: Spacing.xl,
    opacity: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
