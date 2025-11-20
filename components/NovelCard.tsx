import React from "react";
import { View, Pressable, StyleSheet, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Novel } from "@/types/models";
import { Spacing, BorderRadius } from "@/constants/theme";

interface NovelCardProps {
  novel: Novel;
  onPress: () => void;
  variant?: "large" | "medium" | "small";
}

export function NovelCard({ novel, onPress, variant = "medium" }: NovelCardProps) {
  const { theme } = useTheme();

  const coverImageSource = {
    romance: require("@/assets/images/novels/romance.png"),
    fantasy: require("@/assets/images/novels/fantasy.png"),
    thriller: require("@/assets/images/novels/thriller.png"),
    mystery: require("@/assets/images/novels/mystery.png"),
    adventure: require("@/assets/images/novels/adventure.png"),
  };

  const imageSource = coverImageSource[novel.genre.toLowerCase() as keyof typeof coverImageSource];

  const cardWidth = variant === "large" ? 280 : variant === "medium" ? 160 : 120;
  const cardHeight = variant === "large" ? 180 : variant === "medium" ? 200 : 160;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { width: cardWidth, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.coverContainer, { height: cardHeight }]}>
        <Image source={imageSource} style={styles.cover} resizeMode="cover" />
      </View>
      <View style={styles.infoContainer}>
        <ThemedText style={styles.title} numberOfLines={2}>
          {novel.title}
        </ThemedText>
        <ThemedText style={[styles.author, { color: theme.textSecondary }]} numberOfLines={1}>
          {novel.author}
        </ThemedText>
        <View style={styles.metaRow}>
          <View style={styles.rating}>
            <Feather name="star" size={12} color={theme.secondary} />
            <ThemedText style={[styles.ratingText, { color: theme.textSecondary }]}>
              {novel.rating.toFixed(1)}
            </ThemedText>
          </View>
          <View style={styles.coinInfo}>
            <Image
              source={require("@/assets/images/icons/coin.png")}
              style={styles.coinIcon}
            />
            <ThemedText style={[styles.coinText, { color: theme.warning }]}>
              {novel.coinPerChapter}
            </ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: Spacing.md,
  },
  coverContainer: {
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  cover: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    marginTop: Spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  author: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  ratingText: {
    fontSize: 12,
  },
  coinInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  coinIcon: {
    width: 16,
    height: 16,
  },
  coinText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
