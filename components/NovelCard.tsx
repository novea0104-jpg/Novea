import React from "react";
import { View, Pressable, StyleSheet, Image } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { BookOpenIcon } from "@/components/icons/BookOpenIcon";
import { EyeIcon } from "@/components/icons/EyeIcon";
import { StarIcon } from "@/components/icons/StarIcon";
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

  const placeholderImages = {
    romance: require("@/assets/images/novels/romance.png"),
    fantasy: require("@/assets/images/novels/fantasy.png"),
    thriller: require("@/assets/images/novels/thriller.png"),
    mystery: require("@/assets/images/novels/mystery.png"),
    adventure: require("@/assets/images/novels/adventure.png"),
  };

  const placeholderImage = placeholderImages[novel.genre.toLowerCase() as keyof typeof placeholderImages];
  const imageSource = novel.coverImage 
    ? { uri: novel.coverImage }
    : placeholderImage;

  const cardWidth = variant === "large" ? 100 : variant === "medium" ? 85 : 70;
  const coverHeight = variant === "large" ? 140 : variant === "medium" ? 120 : 100;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { width: cardWidth, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <View style={[styles.coverContainer, { height: coverHeight, backgroundColor: theme.backgroundSecondary }]}>
        <Image source={imageSource} style={styles.cover} resizeMode="cover" />
      </View>
      
      <View style={[styles.infoContainer, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText style={styles.title} numberOfLines={1}>
          {novel.title}
        </ThemedText>
        <ThemedText style={[styles.author, { color: theme.textSecondary }]} numberOfLines={1}>
          {novel.author}
        </ThemedText>
        
        <View style={styles.metadataRow}>
          <View style={styles.metadataItem}>
            <BookOpenIcon size={10} color={theme.textSecondary} />
            <ThemedText style={[styles.metadataText, { color: theme.textSecondary }]}>
              {novel.totalChapters}
            </ThemedText>
          </View>
          
          <View style={styles.metadataItem}>
            <EyeIcon size={10} color={theme.textSecondary} />
            <ThemedText style={[styles.metadataText, { color: theme.textSecondary }]}>
              {novel.followers > 1000 ? `${(novel.followers / 1000).toFixed(1)}k` : novel.followers}
            </ThemedText>
          </View>
          
          <View style={styles.metadataItem}>
            <StarIcon size={10} color="#FCD34D" filled />
            <ThemedText style={[styles.metadataText, { color: theme.textSecondary }]}>
              {novel.rating.toFixed(1)}
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
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  cover: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 16,
  },
  author: {
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 4,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metadataText: {
    fontSize: 10,
    fontWeight: "600",
  },
});
