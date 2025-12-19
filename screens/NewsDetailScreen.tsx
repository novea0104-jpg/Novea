import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRoute, RouteProp } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { BrowseStackParamList } from "@/navigation/BrowseStackNavigator";

type NewsDetailRouteProp = RouteProp<BrowseStackParamList, "NewsDetail">;

export default function NewsDetailScreen() {
  const route = useRoute<NewsDetailRouteProp>();
  const { theme } = useTheme();
  const { title, content, imageUrl, authorName, createdAt } = route.params;

  const formattedDate = new Date(createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <ScreenScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Image
            source={require("@/assets/images/novea-logo.png")}
            style={styles.logoImage}
            contentFit="contain"
          />
          <ThemedText style={styles.brandLabel}>N-News</ThemedText>
        </View>
      </View>

      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.heroImage}
          contentFit="cover"
        />
      ) : null}

      <View style={styles.contentContainer}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        
        <View style={styles.metaRow}>
          <ThemedText style={[styles.author, { color: theme.primary }]}>
            {authorName}
          </ThemedText>
          <View style={[styles.dot, { backgroundColor: theme.textSecondary }]} />
          <ThemedText style={[styles.date, { color: theme.textSecondary }]}>
            {formattedDate}
          </ThemedText>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

        <ThemedText style={styles.body}>{content}</ThemedText>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  logoImage: {
    width: 28,
    height: 28,
  },
  brandLabel: {
    fontSize: 18,
    fontWeight: "700",
  },
  heroImage: {
    width: "100%",
    height: 220,
    marginBottom: Spacing.lg,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    marginBottom: Spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  author: {
    fontSize: 14,
    fontWeight: "600",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  date: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginBottom: Spacing.lg,
  },
  body: {
    fontSize: 16,
    lineHeight: 26,
  },
});
