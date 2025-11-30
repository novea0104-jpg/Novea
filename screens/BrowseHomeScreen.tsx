import React from "react";
import { View, ScrollView, StyleSheet, Image, TouchableOpacity, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { NovelCard } from "@/components/NovelCard";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { SearchIcon } from "@/components/icons/SearchIcon";
import { HeartIcon } from "@/components/icons/HeartIcon";
import { ZapIcon } from "@/components/icons/ZapIcon";
import { BookOpenIcon } from "@/components/icons/BookOpenIcon";
import { StarIcon } from "@/components/icons/StarIcon";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { BrowseStackParamList } from "@/navigation/BrowseStackNavigator";
import { Spacing, BorderRadius, GradientColors } from "@/constants/theme";
import { Novel } from "@/types/models";

type NavigationProp = NativeStackNavigationProp<BrowseStackParamList>;

interface GenreItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  gradient: readonly [string, string];
  count: number;
}

export default function BrowseHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { novels } = useApp();
  const { user } = useAuth();

  const goToSearch = () => {
    navigation.navigate("Search");
  };

  const genres: GenreItem[] = [
    { 
      id: "Romance", 
      name: "Romance", 
      icon: <HeartIcon size={24} color="#FFFFFF" />,
      gradient: GradientColors.romance.colors,
      count: novels.filter(n => n.genre.toLowerCase() === "romance").length
    },
    { 
      id: "Fantasy", 
      name: "Fantasy", 
      icon: <StarIcon size={24} color="#FFFFFF" />,
      gradient: GradientColors.fantasy.colors,
      count: novels.filter(n => n.genre.toLowerCase() === "fantasy").length
    },
    { 
      id: "Thriller", 
      name: "Thriller", 
      icon: <ZapIcon size={24} color="#FFFFFF" />,
      gradient: GradientColors.thriller.colors,
      count: novels.filter(n => n.genre.toLowerCase() === "thriller").length
    },
    { 
      id: "Mystery", 
      name: "Mystery", 
      icon: <SearchIcon size={24} color="#FFFFFF" />,
      gradient: GradientColors.mystery.colors,
      count: novels.filter(n => n.genre.toLowerCase() === "mystery").length
    },
    { 
      id: "Sci-Fi", 
      name: "Sci-Fi", 
      icon: <BookOpenIcon size={24} color="#FFFFFF" />,
      gradient: GradientColors.sciFi.colors,
      count: novels.filter(n => n.genre.toLowerCase() === "sci-fi").length
    },
  ];

  // Sedang Trending: Sort by total_reads (most viewed)
  const trendingNovels = [...novels]
    .sort((a, b) => b.followers - a.followers) // followers = total_reads from database
    .slice(0, 6);
  
  // Novel Terbaru: Sort by created_at (newest first)
  const newReleases = [...novels]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);
  
  // Pilihan Editor: Sort by rating (highest rated)
  const editorsPick = [...novels]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 6);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleGenrePress = (genreId: string, genreName: string) => {
    navigation.navigate("Genre", { genreId, genreName });
  };

  const renderGenreCard = (genre: GenreItem) => (
    <Pressable
      key={genre.id}
      onPress={() => handleGenrePress(genre.id, genre.name)}
      style={({ pressed }) => [
        styles.genreCardWrapper,
        { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }
      ]}
    >
      <LinearGradient
        colors={genre.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.genreCard}
      >
        <View style={styles.genreIconContainer}>
          {genre.icon}
        </View>
        <View style={styles.genreInfo}>
          <ThemedText style={styles.genreName} lightColor="#FFFFFF" darkColor="#FFFFFF">
            {genre.name}
          </ThemedText>
          <ThemedText style={styles.genreCount} lightColor="rgba(255,255,255,0.8)" darkColor="rgba(255,255,255,0.8)">
            {genre.count} novel
          </ThemedText>
        </View>
        <View style={styles.genreGlow} />
      </LinearGradient>
    </Pressable>
  );

  const renderNovelSection = (title: string, novels: Novel[], variant: "large" | "medium" = "medium") => (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
      >
        {novels.map((novel) => (
          <NovelCard
            key={novel.id}
            novel={novel}
            variant={variant}
            onPress={() => navigation.navigate("NovelDetail", { novelId: novel.id })}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.customHeader, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require("@/assets/images/novea-logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <ThemedText style={styles.appName}>ovea</ThemedText>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={goToSearch}
            activeOpacity={0.6}
            style={styles.searchButton}
          >
            <SearchIcon size={22} color={theme.text} />
          </TouchableOpacity>
          <LinearGradient
            colors={GradientColors.yellowGreen.colors}
            start={GradientColors.yellowGreen.start}
            end={GradientColors.yellowGreen.end}
            style={styles.coinBadge}
          >
            <CoinIcon size={12} color={theme.backgroundRoot} />
            <ThemedText style={[styles.coinText, { color: theme.backgroundRoot }]}>{user?.coinBalance || 0}</ThemedText>
          </LinearGradient>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderNovelSection("Sedang Trending", trendingNovels, "large")}
        {renderNovelSection("Novel Terbaru", newReleases)}

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Jelajahi Genre</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genreCarousel}
          >
            {genres.map(renderGenreCard)}
          </ScrollView>
        </View>

        {renderNovelSection("Pilihan Editor", editorsPick)}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  appName: {
    fontSize: 22,
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchButton: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    marginLeft: Spacing.sm,
    minWidth: 60,
  },
  coinText: {
    fontSize: 14,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: "700",
    fontSize: 16,
  },
  carousel: {
    paddingRight: Spacing.lg,
  },
  genreCarousel: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  genreCardWrapper: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  genreCard: {
    width: 140,
    height: 100,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  genreIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  genreInfo: {
    gap: 2,
  },
  genreName: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  genreCount: {
    fontSize: 12,
    fontWeight: "500",
  },
  genreGlow: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
});
