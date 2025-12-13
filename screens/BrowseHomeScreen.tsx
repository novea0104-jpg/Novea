import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, Image, TouchableOpacity, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { NovelCard } from "@/components/NovelCard";
import { EditorPickCard } from "@/components/EditorPickCard";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { SearchIcon } from "@/components/icons/SearchIcon";
import { HeartIcon } from "@/components/icons/HeartIcon";
import { ZapIcon } from "@/components/icons/ZapIcon";
import { BookOpenIcon } from "@/components/icons/BookOpenIcon";
import { StarIcon } from "@/components/icons/StarIcon";
import { MessageSquareIcon } from "@/components/icons/MessageSquareIcon";
import { FlameIcon } from "@/components/icons/FlameIcon";
import { SparklesIcon } from "@/components/icons/SparklesIcon";
import { CompassIcon } from "@/components/icons/CompassIcon";
import { AwardIcon } from "@/components/icons/AwardIcon";
import { GiftIcon } from "@/components/icons/GiftIcon";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { useResponsive } from "@/hooks/useResponsive";
import { supabase, getTotalUnreadCount, getUnreadNotificationCount, getEditorsChoiceForHome } from "@/utils/supabase";
import { BrowseStackParamList } from "@/navigation/BrowseStackNavigator";
import { BellIcon } from "@/components/icons/BellIcon";
import { useNavigationState } from "@react-navigation/native";
import { Spacing, BorderRadius, GradientColors } from "@/constants/theme";
import { Novel } from "@/types/models";

type NavigationProp = NativeStackNavigationProp<BrowseStackParamList>;

interface GenreItem {
  id: string;
  slug: string;
  name: string;
  icon: string;
  gradient: readonly [string, string];
  count: number;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  heart: <HeartIcon size={14} color="#FFFFFF" />,
  star: <StarIcon size={14} color="#FFFFFF" />,
  zap: <ZapIcon size={14} color="#FFFFFF" />,
  search: <SearchIcon size={14} color="#FFFFFF" />,
  cpu: <BookOpenIcon size={14} color="#FFFFFF" />,
  compass: <StarIcon size={14} color="#FFFFFF" />,
  film: <BookOpenIcon size={14} color="#FFFFFF" />,
  skull: <ZapIcon size={14} color="#FFFFFF" />,
  smile: <StarIcon size={14} color="#FFFFFF" />,
  target: <ZapIcon size={14} color="#FFFFFF" />,
};

export default function BrowseHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { novels } = useApp();
  const { user, showAuthPrompt } = useAuth();
  const { isDesktop, isTablet, width } = useResponsive();
  const [genres, setGenres] = useState<GenreItem[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [editorsPick, setEditorsPick] = useState<Novel[]>([]);

  const maxContentWidth = 1200;
  const shouldCenterContent = isDesktop && width > maxContentWidth;
  const sidebarWidth = (isDesktop || isTablet) ? 220 : 0;

  useEffect(() => {
    fetchGenres();
    fetchEditorsChoice();
  }, []);

  const fetchEditorsChoice = async () => {
    try {
      const data = await getEditorsChoiceForHome();
      const mappedNovels: Novel[] = data.map((item) => ({
        id: item.id.toString(),
        title: item.title,
        author: item.authorName,
        authorId: item.authorId,
        genre: item.genre as any,
        synopsis: item.description || "",
        coverImage: item.coverUrl || "",
        status: (item.status === "completed" ? "Completed" : "On-Going") as any,
        rating: item.rating || 0,
        ratingCount: 0,
        coinPerChapter: item.chapterPrice || 0,
        totalChapters: item.totalChapters || 0,
        freeChapters: item.freeChapters || 0,
        followers: item.totalReads || 0,
        totalLikes: 0,
        createdAt: new Date(item.createdAt),
        lastUpdated: new Date(item.updatedAt),
      }));
      setEditorsPick(mappedNovels);
    } catch (error) {
      console.error("Error fetching editors choice:", error);
      // Fallback: sort by rating if fetching fails
      const fallback = [...novels]
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 20);
      setEditorsPick(fallback);
    }
  };

  const loadUnreadCounts = useCallback(async () => {
    if (user) {
      const [msgCount, notifCount] = await Promise.all([
        getTotalUnreadCount(parseInt(user.id)),
        getUnreadNotificationCount(parseInt(user.id))
      ]);
      setUnreadMessageCount(msgCount);
      setUnreadNotificationCount(notifCount);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadUnreadCounts();
    }, [loadUnreadCounts])
  );

  const goToMessages = () => {
    if (!user) {
      showAuthPrompt("Masuk untuk mengakses pesan");
      return;
    }
    navigation.navigate("Messages");
  };

  const goToNotifications = () => {
    if (!user) {
      showAuthPrompt("Masuk untuk melihat notifikasi");
      return;
    }
    navigation.getParent()?.navigate("NotificationsTab");
  };

  const fetchGenres = async () => {
    try {
      const { data: genresData, error: genresError } = await supabase
        .from("genres")
        .select("id, name, slug, icon, gradient_start, gradient_end")
        .order("name");

      if (genresError) {
        console.log("Genres table not found, using fallback genres");
        // Fallback to hardcoded genres with counts from novels table
        const fallbackGenres: GenreItem[] = [
          { id: "1", slug: "romance", name: "Romance", icon: "heart", gradient: GradientColors.romance.colors, count: novels.filter(n => n.genre.toLowerCase() === "romance").length },
          { id: "2", slug: "fantasy", name: "Fantasy", icon: "star", gradient: GradientColors.fantasy.colors, count: novels.filter(n => n.genre.toLowerCase() === "fantasy").length },
          { id: "3", slug: "thriller", name: "Thriller", icon: "zap", gradient: GradientColors.thriller.colors, count: novels.filter(n => n.genre.toLowerCase() === "thriller").length },
          { id: "4", slug: "mystery", name: "Mystery", icon: "search", gradient: GradientColors.mystery.colors, count: novels.filter(n => n.genre.toLowerCase() === "mystery").length },
          { id: "5", slug: "sci-fi", name: "Sci-Fi", icon: "cpu", gradient: GradientColors.sciFi.colors, count: novels.filter(n => n.genre.toLowerCase() === "sci-fi").length },
        ];
        setGenres(fallbackGenres);
        return;
      }

      if (!genresData || genresData.length === 0) {
        setGenres([]);
        return;
      }

      // Get counts for each genre
      const { data: countsData } = await supabase
        .from("novel_genres")
        .select("genre_id");

      const countMap: Record<number, number> = {};
      if (countsData) {
        countsData.forEach((item: any) => {
          countMap[item.genre_id] = (countMap[item.genre_id] || 0) + 1;
        });
      }

      const mappedGenres: GenreItem[] = genresData.map((g: any) => ({
        id: g.id.toString(),
        slug: g.slug,
        name: g.name,
        icon: g.icon || "star",
        gradient: [g.gradient_start || "#6B7280", g.gradient_end || "#4B5563"] as readonly [string, string],
        count: countMap[g.id] || 0,
      }));

      setGenres(mappedGenres);
    } catch (error) {
      console.error("Error fetching genres:", error);
      // Fallback to hardcoded genres
      const fallbackGenres: GenreItem[] = [
        { id: "1", slug: "romance", name: "Romance", icon: "heart", gradient: GradientColors.romance.colors, count: novels.filter(n => n.genre.toLowerCase() === "romance").length },
        { id: "2", slug: "fantasy", name: "Fantasy", icon: "star", gradient: GradientColors.fantasy.colors, count: novels.filter(n => n.genre.toLowerCase() === "fantasy").length },
        { id: "3", slug: "thriller", name: "Thriller", icon: "zap", gradient: GradientColors.thriller.colors, count: novels.filter(n => n.genre.toLowerCase() === "thriller").length },
        { id: "4", slug: "mystery", name: "Mystery", icon: "search", gradient: GradientColors.mystery.colors, count: novels.filter(n => n.genre.toLowerCase() === "mystery").length },
        { id: "5", slug: "sci-fi", name: "Sci-Fi", icon: "cpu", gradient: GradientColors.sciFi.colors, count: novels.filter(n => n.genre.toLowerCase() === "sci-fi").length },
      ];
      setGenres(fallbackGenres);
    }
  };

  const goToSearch = () => {
    navigation.navigate("Search");
  };

  // Sedang Trending: Sort by total_reads (most viewed)
  const trendingNovels = [...novels]
    .sort((a, b) => b.followers - a.followers) // followers = total_reads from database
    .slice(0, 6);
  
  // Novel Terbaru: Sort by created_at (newest first)
  const newReleases = [...novels]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);
  
  // Pilihan Editor: fetched from editors_choice table (fallback to rating sort if empty)

  // Novel Gratis: Filter novels that have free chapters
  const freeNovels = [...novels]
    .filter((n) => n.freeChapters > 0)
    .slice(0, 10);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const handleGenrePress = (genreSlug: string, genreName: string) => {
    navigation.navigate("Genre", { genreId: genreSlug, genreName });
  };

  const renderGenreCard = (genre: GenreItem) => (
    <Pressable
      key={genre.id}
      onPress={() => handleGenrePress(genre.slug, genre.name)}
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
          {ICON_MAP[genre.icon] || <StarIcon size={14} color="#FFFFFF" />}
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

  const renderSectionTitle = (title: string, icon: React.ReactNode, iconColor: string) => (
    <View style={styles.sectionTitleRow}>
      <View style={[styles.sectionIconContainer, { backgroundColor: iconColor + "20" }]}>
        {icon}
      </View>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    </View>
  );

  const renderNovelSection = (title: string, novels: Novel[], icon: React.ReactNode, iconColor: string, variant: "large" | "medium" = "medium") => {
    if (isDesktop || isTablet) {
      const columnsCount = isDesktop ? 6 : 4;
      const displayNovels = novels.slice(0, columnsCount * 2);
      return (
        <View style={styles.section}>
          {renderSectionTitle(title, icon, iconColor)}
          <View style={styles.desktopGrid}>
            {displayNovels.map((novel) => (
              <View key={novel.id} style={[styles.desktopGridItem, { width: `${100 / columnsCount}%` as any }]}>
                <NovelCard
                  novel={novel}
                  variant={variant}
                  onPress={() => navigation.navigate("NovelDetail", { novelId: novel.id })}
                />
              </View>
            ))}
          </View>
        </View>
      );
    }
    return (
      <View style={styles.section}>
        {renderSectionTitle(title, icon, iconColor)}
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
  };

  const renderEditorsPickSection = () => {
    if (isDesktop || isTablet) {
      const columnsCount = isDesktop ? 4 : 2;
      const displayNovels = editorsPick.slice(0, columnsCount * 2);
      return (
        <View style={styles.section}>
          {renderSectionTitle("Pilihan Editor", <AwardIcon size={20} color="#F59E0B" />, "#F59E0B")}
          <View style={styles.desktopGrid}>
            {displayNovels.map((novel) => (
              <View key={novel.id} style={[styles.desktopGridItem, { width: `${100 / columnsCount}%` as any }]}>
                <EditorPickCard
                  novel={novel}
                  onPress={() => navigation.navigate("NovelDetail", { novelId: novel.id })}
                />
              </View>
            ))}
          </View>
        </View>
      );
    }
    return (
      <View style={styles.section}>
        {renderSectionTitle("Pilihan Editor", <AwardIcon size={20} color="#F59E0B" />, "#F59E0B")}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
          decelerationRate="fast"
          snapToInterval={316}
        >
          {editorsPick.map((novel) => (
            <EditorPickCard
              key={novel.id}
              novel={novel}
              onPress={() => navigation.navigate("NovelDetail", { novelId: novel.id })}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderFreeNovelsSection = () => {
    if (isDesktop || isTablet) {
      const columnsCount = isDesktop ? 6 : 4;
      const displayNovels = freeNovels.slice(0, columnsCount * 2);
      return (
        <View style={styles.section}>
          {renderSectionTitle("Novel Gratis", <GiftIcon size={20} color="#10B981" />, "#10B981")}
          <View style={styles.desktopGrid}>
            {displayNovels.map((novel) => (
              <View key={novel.id} style={[styles.desktopGridItem, { width: `${100 / columnsCount}%` as any }]}>
                <NovelCard
                  novel={novel}
                  onPress={() => navigation.navigate("NovelDetail", { novelId: novel.id })}
                  showMetadata={false}
                />
              </View>
            ))}
          </View>
        </View>
      );
    }
    return (
      <View style={styles.section}>
        {renderSectionTitle("Novel Gratis", <GiftIcon size={20} color="#10B981" />, "#10B981")}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
        >
          {freeNovels.map((novel) => (
            <NovelCard
              key={novel.id}
              novel={novel}
              onPress={() => navigation.navigate("NovelDetail", { novelId: novel.id })}
              showMetadata={false}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, { marginLeft: sidebarWidth }]}>
      <View style={[styles.customHeader, { paddingTop: insets.top + Spacing.sm }]}>
        {!(isDesktop || isTablet) ? (
          <View style={styles.headerLeft}>
            <Image
              source={require("@/assets/images/novea-logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <ThemedText style={styles.appName}>ovea</ThemedText>
          </View>
        ) : (
          <View style={styles.headerLeft} />
        )}
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={goToNotifications}
            activeOpacity={0.6}
            style={styles.headerIconButton}
          >
            <BellIcon size={22} color={theme.text} />
            {unreadNotificationCount > 0 ? (
              <View style={styles.headerBadge}>
                <ThemedText style={styles.headerBadgeText}>
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </ThemedText>
              </View>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goToMessages}
            activeOpacity={0.6}
            style={styles.headerIconButton}
          >
            <MessageSquareIcon size={22} color={theme.text} />
            {unreadMessageCount > 0 ? (
              <View style={styles.headerBadge}>
                <ThemedText style={styles.headerBadgeText}>
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </ThemedText>
              </View>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goToSearch}
            activeOpacity={0.6}
            style={styles.headerIconButton}
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
        {renderNovelSection("Sedang Trending", trendingNovels, <FlameIcon size={20} color="#EF4444" />, "#EF4444", "large")}
        {renderNovelSection("Novel Terbaru", newReleases, <SparklesIcon size={20} color="#8B5CF6" />, "#8B5CF6")}
        {renderEditorsPickSection()}

        <View style={styles.section}>
          {renderSectionTitle("Jelajahi Genre", <CompassIcon size={20} color="#3B82F6" />, "#3B82F6")}
          {(isDesktop || isTablet) ? (
            <View style={styles.desktopGenreGrid}>
              {genres.map(renderGenreCard)}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.genreCarousel}
            >
              {genres.map(renderGenreCard)}
            </ScrollView>
          )}
        </View>

        {renderFreeNovelsSection()}
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
  headerIconButton: {
    padding: Spacing.sm,
    position: "relative",
  },
  headerBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#EF4444",
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  headerBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
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
    paddingBottom: 120,
    flexGrow: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 16,
  },
  carousel: {
    paddingRight: Spacing.lg,
  },
  desktopGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -Spacing.sm,
  },
  desktopGridItem: {
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
  },
  desktopGenreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
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
    width: 100,
    height: 70,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  genreIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  genreInfo: {
    gap: 2,
  },
  genreName: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  genreCount: {
    fontSize: 9,
    fontWeight: "500",
  },
  genreGlow: {
    position: "absolute",
    top: -15,
    right: -15,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
});
