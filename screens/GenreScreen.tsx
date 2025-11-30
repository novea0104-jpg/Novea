import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, Image, ActivityIndicator } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { supabase } from "@/utils/supabase";
import { BrowseStackParamList } from "@/navigation/BrowseStackNavigator";
import { Spacing, BorderRadius, GradientColors } from "@/constants/theme";
import { Novel } from "@/types/models";

type NavigationProp = NativeStackNavigationProp<BrowseStackParamList>;
type GenreRouteProp = RouteProp<BrowseStackParamList, "Genre">;

const GENRE_CONFIG: Record<string, { gradient: readonly [string, string]; label: string }> = {
  romance: { gradient: GradientColors.romance.colors, label: "Romance" },
  fantasy: { gradient: GradientColors.fantasy.colors, label: "Fantasy" },
  thriller: { gradient: GradientColors.thriller.colors, label: "Thriller" },
  mystery: { gradient: GradientColors.mystery.colors, label: "Mystery" },
  "sci-fi": { gradient: GradientColors.sciFi.colors, label: "Sci-Fi" },
  adventure: { gradient: ["#F59E0B", "#D97706"] as const, label: "Adventure" },
};

const coverImageSource: Record<string, any> = {
  romance: require("@/assets/images/novels/romance.png"),
  fantasy: require("@/assets/images/novels/fantasy.png"),
  thriller: require("@/assets/images/novels/thriller.png"),
  mystery: require("@/assets/images/novels/mystery.png"),
  adventure: require("@/assets/images/novels/adventure.png"),
};

export default function GenreScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<GenreRouteProp>();
  const { theme } = useTheme();
  const screenInsets = useScreenInsets();
  const { genreId, genreName } = route.params;

  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const genreConfig = GENRE_CONFIG[genreId.toLowerCase()] || { 
    gradient: ["#6B7280", "#4B5563"] as const, 
    label: genreName 
  };

  useEffect(() => {
    fetchNovelsByGenre();
  }, [genreId]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerTitle}>
          <ThemedText style={styles.headerTitleText}>{genreName}</ThemedText>
        </View>
      ),
    });
  }, [navigation, genreName, genreConfig]);

  const fetchNovelsByGenre = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("novels")
        .select(`
          id, title, synopsis, genre, status, cover_image, created_at, updated_at,
          author_id, total_chapters, total_reads, rating, total_reviews,
          users!novels_author_id_users_id_fk(name)
        `)
        .ilike("genre", genreId)
        .order("total_reads", { ascending: false });

      if (error) throw error;

      const mappedNovels: Novel[] = (data || []).map((novel: any) => ({
        id: novel.id.toString(),
        title: novel.title,
        author: novel.users?.name || "Unknown Author",
        authorId: novel.author_id?.toString() || "",
        synopsis: novel.synopsis || "",
        genre: novel.genre,
        status: novel.status || "ongoing",
        coverImage: novel.cover_image,
        totalChapters: novel.total_chapters || 0,
        followers: novel.total_reads || 0,
        rating: novel.rating || 0,
        ratingCount: novel.total_reviews || 0,
        totalReviews: novel.total_reviews || 0,
        coinPerChapter: 0,
        createdAt: new Date(novel.created_at),
        updatedAt: new Date(novel.updated_at),
        lastUpdated: new Date(novel.updated_at),
      }));

      setNovels(mappedNovels);
    } catch (error) {
      console.error("Error fetching novels by genre:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceholderImage = (genre: string) => {
    const key = genre.toLowerCase();
    return coverImageSource[key] || coverImageSource.fantasy;
  };

  const renderNovel = ({ item }: { item: Novel }) => {
    const imageSource = item.coverImage 
      ? { uri: item.coverImage } 
      : getPlaceholderImage(item.genre);

    return (
      <Pressable
        onPress={() => navigation.navigate("NovelDetail", { novelId: item.id })}
        style={({ pressed }) => [
          styles.novelCard,
          { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Image source={imageSource} style={styles.novelCover} resizeMode="cover" />
        <View style={styles.novelInfo}>
          <ThemedText style={styles.novelTitle} numberOfLines={2}>
            {item.title}
          </ThemedText>
          <ThemedText style={[styles.novelAuthor, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.author}
          </ThemedText>
          <View style={styles.novelMeta}>
            <ThemedText style={[styles.metaText, { color: theme.textMuted }]}>
              {item.totalChapters} chapter
            </ThemedText>
            <View style={[styles.dot, { backgroundColor: theme.textMuted }]} />
            <ThemedText style={[styles.metaText, { color: theme.textMuted }]}>
              {item.followers.toLocaleString()} dibaca
            </ThemedText>
          </View>
          {item.rating > 0 ? (
            <View style={styles.ratingContainer}>
              <ThemedText style={[styles.ratingText, { color: theme.warning }]}>
                {item.rating.toFixed(1)}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  };

  const renderHeader = () => (
    <LinearGradient
      colors={genreConfig.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerBanner}
    >
      <View style={styles.bannerContent}>
        <ThemedText style={styles.bannerTitle} lightColor="#FFFFFF" darkColor="#FFFFFF">
          {genreName}
        </ThemedText>
        <ThemedText style={styles.bannerSubtitle} lightColor="rgba(255,255,255,0.8)" darkColor="rgba(255,255,255,0.8)">
          {novels.length} novel tersedia
        </ThemedText>
      </View>
      <View style={styles.bannerGlow} />
    </LinearGradient>
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={novels}
        renderItem={renderNovel}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            type="search"
            title="Belum Ada Novel"
            message={`Belum ada novel dengan genre ${genreName}`}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: screenInsets.paddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerBanner: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    overflow: "hidden",
  },
  bannerContent: {
    gap: Spacing.xs,
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  bannerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  bannerGlow: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  novelCard: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  novelCover: {
    width: 80,
    height: 120,
    borderRadius: BorderRadius.sm,
  },
  novelInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: "center",
    gap: Spacing.xs,
  },
  novelTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  novelAuthor: {
    fontSize: 13,
  },
  novelMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  metaText: {
    fontSize: 12,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
