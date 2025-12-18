import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, Image, ActivityIndicator } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
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
  adventure: { gradient: GradientColors.adventure.colors, label: "Adventure" },
  drama: { gradient: GradientColors.drama.colors, label: "Drama" },
  horror: { gradient: GradientColors.horror.colors, label: "Horror" },
  comedy: { gradient: GradientColors.comedy.colors, label: "Comedy" },
  action: { gradient: GradientColors.action.colors, label: "Action" },
  chicklit: { gradient: GradientColors.chicklit.colors, label: "Chicklit" },
  teenlit: { gradient: GradientColors.teenlit.colors, label: "Teenlit" },
  apocalypse: { gradient: GradientColors.apocalypse.colors, label: "Apocalypse" },
  pernikahan: { gradient: GradientColors.pernikahan.colors, label: "Pernikahan" },
  sistem: { gradient: GradientColors.sistem.colors, label: "Sistem" },
  urban: { gradient: GradientColors.urban.colors, label: "Urban" },
  fanfiction: { gradient: GradientColors.fanfiction.colors, label: "Fanfiction" },
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
  const insets = useSafeAreaInsets();
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
      headerShown: false,
    });
  }, [navigation]);

  const fetchNovelsByGenre = async () => {
    setIsLoading(true);
    try {
      // First get genre id from slug
      let genreDbId: number | null = null;
      
      const { data: genreData, error: genreError } = await supabase
        .from("genres")
        .select("id")
        .eq("slug", genreId.toLowerCase())
        .single();

      if (!genreError && genreData) {
        genreDbId = genreData.id;
      } else {
        // Fallback: try matching by name
        const { data: genreByName } = await supabase
          .from("genres")
          .select("id")
          .ilike("name", genreId)
          .single();
        
        if (genreByName) {
          genreDbId = genreByName.id;
        }
      }
      
      // If genres table doesn't exist, fallback to legacy genre column
      if (genreDbId === null) {
        console.log("Falling back to legacy genre column");
        const { data: novelsData, error: novelsError } = await supabase
          .from("novels")
          .select("id, title, description, genre, status, cover_url, created_at, updated_at, author_id, total_chapters, total_reads, rating")
          .ilike("genre", genreId)
          .order("total_reads", { ascending: false });

        if (novelsError) throw novelsError;

        if (!novelsData || novelsData.length === 0) {
          setNovels([]);
          return;
        }

        const authorIds = [...new Set(novelsData.map((n: any) => n.author_id).filter(Boolean))];
        let authorsMap: Record<number, string> = {};
        if (authorIds.length > 0) {
          const { data: usersData } = await supabase
            .from("users")
            .select("id, name")
            .in("id", authorIds);
          if (usersData) {
            authorsMap = usersData.reduce((acc: Record<number, string>, user: any) => {
              acc[user.id] = user.name;
              return acc;
            }, {});
          }
        }

        const mappedNovels: Novel[] = novelsData.map((novel: any) => ({
          id: novel.id.toString(),
          title: novel.title,
          author: authorsMap[novel.author_id] || "Unknown Author",
          authorId: novel.author_id?.toString() || "",
          synopsis: novel.description || "",
          genre: novel.genre,
          status: novel.status || "ongoing",
          coverImage: novel.cover_url,
          totalChapters: novel.total_chapters || 0,
          followers: novel.total_reads || 0,
          rating: novel.rating || 0,
          ratingCount: 0,
          totalReviews: 0,
          coinPerChapter: 0,
          createdAt: new Date(novel.created_at),
          updatedAt: new Date(novel.updated_at),
          lastUpdated: new Date(novel.updated_at),
        }));

        setNovels(mappedNovels);
        return;
      }

      // Get novel IDs for this genre
      const { data: novelGenres, error: ngError } = await supabase
        .from("novel_genres")
        .select("novel_id")
        .eq("genre_id", genreDbId);

      if (ngError) throw ngError;

      if (!novelGenres || novelGenres.length === 0) {
        setNovels([]);
        return;
      }

      const novelIds = novelGenres.map((ng: any) => ng.novel_id);

      // Get novels data
      const { data: novelsData, error: novelsError } = await supabase
        .from("novels")
        .select("id, title, description, genre, status, cover_url, created_at, updated_at, author_id, total_chapters, total_reads, rating")
        .in("id", novelIds)
        .order("total_reads", { ascending: false });

      if (novelsError) throw novelsError;

      if (!novelsData || novelsData.length === 0) {
        setNovels([]);
        return;
      }

      const authorIds = [...new Set(novelsData.map((n: any) => n.author_id).filter(Boolean))];
      
      let authorsMap: Record<number, string> = {};
      if (authorIds.length > 0) {
        const { data: usersData } = await supabase
          .from("users")
          .select("id, name")
          .in("id", authorIds);
        
        if (usersData) {
          authorsMap = usersData.reduce((acc: Record<number, string>, user: any) => {
            acc[user.id] = user.name;
            return acc;
          }, {});
        }
      }

      const mappedNovels: Novel[] = novelsData.map((novel: any) => ({
        id: novel.id.toString(),
        title: novel.title,
        author: authorsMap[novel.author_id] || "Unknown Author",
        authorId: novel.author_id?.toString() || "",
        synopsis: novel.description || "",
        genre: novel.genre,
        status: novel.status || "ongoing",
        coverImage: novel.cover_url,
        totalChapters: novel.total_chapters || 0,
        followers: novel.total_reads || 0,
        rating: novel.rating || 0,
        ratingCount: 0,
        totalReviews: 0,
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
          { opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Image source={imageSource} style={styles.novelCover} resizeMode="cover" />
        <ThemedText style={styles.novelTitle} numberOfLines={2}>
          {item.title}
        </ThemedText>
      </Pressable>
    );
  };

  const renderHeader = () => (
    <LinearGradient
      colors={genreConfig.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.headerBanner, { paddingTop: insets.top + Spacing.md }]}
    >
      <Pressable 
        onPress={() => navigation.goBack()} 
        style={styles.backButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ChevronLeftIcon size={28} color="#FFFFFF" />
      </Pressable>
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
        numColumns={3}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            type="search"
            title="Belum Ada Novel"
            message={`Belum ada novel dengan genre ${genreName}`}
          />
        }
        columnWrapperStyle={styles.columnWrapper}
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
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    overflow: "hidden",
  },
  backButton: {
    marginBottom: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
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
  columnWrapper: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  novelCard: {
    flex: 1,
    maxWidth: "33%",
  },
  novelCover: {
    width: "100%",
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.md,
  },
  novelTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: Spacing.xs,
    lineHeight: 16,
  },
});
