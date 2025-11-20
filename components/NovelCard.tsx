import React from "react";
import { View, Pressable, StyleSheet, Image } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Novel } from "@/types/models";
import { Spacing, BorderRadius, GradientColors } from "@/constants/theme";

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
  const cardHeight = variant === "large" ? 200 : variant === "medium" ? 220 : 180;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { width: cardWidth, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={[styles.coverContainer, { height: cardHeight, backgroundColor: theme.backgroundDefault }]}>
        <Image source={imageSource} style={styles.cover} resizeMode="cover" />
        <LinearGradient
          colors={["transparent", "rgba(0, 0, 0, 0.7)", "rgba(0, 0, 0, 0.95)"]}
          style={styles.gradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.topBadges}>
              <View style={styles.ratingBadge}>
                <Feather name="star" size={10} color="#FCD34D" />
                <ThemedText style={styles.ratingBadgeText}>
                  {novel.rating.toFixed(1)}
                </ThemedText>
              </View>
            </View>
            <View style={styles.bottomInfo}>
              <ThemedText style={styles.title} numberOfLines={2}>
                {novel.title}
              </ThemedText>
              <ThemedText style={styles.author} numberOfLines={1}>
                {novel.author}
              </ThemedText>
              <View style={styles.coinBadge}>
                <Feather name="circle" size={10} color="#FCD34D" />
                <ThemedText style={styles.coinText}>{novel.coinPerChapter}/ch</ThemedText>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: Spacing.md,
  },
  coverContainer: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  cover: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  gradient: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  topBadges: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  bottomInfo: {
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  author: {
    fontSize: 12,
    color: "#A3A3A3",
    marginBottom: Spacing.xs,
  },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(252, 211, 77, 0.2)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    gap: 4,
  },
  coinText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FCD34D",
  },
});
