import React from "react";
import { View, Pressable, StyleSheet, Image } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { EyeIcon } from "@/components/icons/EyeIcon";
import { CheckCircleIcon } from "@/components/icons/CheckCircleIcon";
import { useTheme } from "@/hooks/useTheme";
import { Novel } from "@/types/models";
import { Spacing, BorderRadius } from "@/constants/theme";

const noveaLogo = require("@/assets/images/novea-logo.png");

interface EditorPickCardProps {
  novel: Novel;
  onPress: () => void;
}

export function EditorPickCard({ novel, onPress }: EditorPickCardProps) {
  const { theme } = useTheme();

  const hasCover = !!novel.coverImage;

  const formatReads = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)} Jt`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)} Rb`;
    }
    return count.toString();
  };

  const isComplete = novel.status === "Completed";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { 
          backgroundColor: theme.backgroundSecondary,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.coverContainer, { backgroundColor: theme.backgroundTertiary }]}>
        {hasCover ? (
          <Image source={{ uri: novel.coverImage }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderContainer}>
            <Image source={noveaLogo} style={styles.placeholderLogo} resizeMode="contain" />
          </View>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <ThemedText style={styles.title} numberOfLines={1}>
          {novel.title}
        </ThemedText>
        
        <ThemedText 
          style={[styles.description, { color: theme.textSecondary }]} 
          numberOfLines={3}
        >
          {novel.synopsis || "Tidak ada deskripsi"}
        </ThemedText>
        
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <EyeIcon size={14} color={theme.textMuted} />
            <ThemedText style={[styles.metaText, { color: theme.textMuted }]}>
              {formatReads(novel.followers)}
            </ThemedText>
          </View>
          
          <View style={styles.dot} />
          
          <View style={styles.metaItem}>
            <CheckCircleIcon size={14} color={isComplete ? theme.success : theme.textMuted} />
            <ThemedText style={[styles.metaText, { color: isComplete ? theme.success : theme.textMuted }]}>
              {isComplete ? "Lengkap" : "Berlanjut"}
            </ThemedText>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginRight: Spacing.md,
  },
  coverContainer: {
    width: 100,
    height: 140,
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
    flex: 1,
    padding: Spacing.md,
    justifyContent: "center",
    gap: Spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "500",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#666",
    marginHorizontal: Spacing.sm,
  },
});
