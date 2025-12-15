import React from "react";
import { View, Pressable, StyleSheet, Image } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { BookOpenIcon } from "@/components/icons/BookOpenIcon";
import { EyeIcon } from "@/components/icons/EyeIcon";
import { StarIcon } from "@/components/icons/StarIcon";
import { HeartIcon } from "@/components/icons/HeartIcon";
import { useTheme } from "@/hooks/useTheme";
import { Novel } from "@/types/models";
import { Spacing, BorderRadius } from "@/constants/theme";

const noveaLogo = require("@/assets/images/novea-logo.png");

interface NovelCardProps {
  novel: Novel;
  onPress: () => void;
  variant?: "large" | "medium" | "small";
  showMetadata?: boolean;
}

export function NovelCard({ novel, onPress, variant = "medium", showMetadata = true }: NovelCardProps) {
  const { theme } = useTheme();

  const hasCover = !!novel.coverImage;

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
        {hasCover ? (
          <Image source={{ uri: novel.coverImage }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderContainer}>
            <Image source={noveaLogo} style={styles.placeholderLogo} resizeMode="contain" />
          </View>
        )}
      </View>
      
      <View style={[styles.infoContainer, { backgroundColor: theme.backgroundDefault }]}>
        <ThemedText style={styles.title} numberOfLines={1}>
          {novel.title}
        </ThemedText>
        <ThemedText style={[styles.author, { color: theme.textSecondary }]} numberOfLines={1}>
          {novel.author}
        </ThemedText>
        
        {showMetadata ? (
          <View style={styles.metadataRow}>
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
            
            {novel.totalLikes > 0 ? (
              <View style={styles.metadataItem}>
                <HeartIcon size={10} color="#EF4444" filled />
                <ThemedText style={[styles.metadataText, { color: theme.textSecondary }]}>
                  {novel.totalLikes > 1000 ? `${(novel.totalLikes / 1000).toFixed(1)}k` : novel.totalLikes}
                </ThemedText>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: Spacing.md,
  },
  coverContainer: {
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  cover: {
    width: "100%",
    height: "100%",
  },
  placeholderContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderLogo: {
    width: "50%",
    height: "50%",
    opacity: 0.4,
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
