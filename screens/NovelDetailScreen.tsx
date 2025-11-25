import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Image, FlatList, ActivityIndicator } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { trackNovelView } from "@/utils/supabase";
import { BrowseStackParamList } from "@/navigation/BrowseStackNavigator";
import { Spacing, BorderRadius, Typography, GradientColors } from "@/constants/theme";
import { Chapter } from "@/types/models";

type NavigationProp = NativeStackNavigationProp<BrowseStackParamList>;

export default function NovelDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { novels, followingNovels, toggleFollow, unlockedChapters, getChaptersForNovel } = useApp();
  const { user } = useAuth();
  
  const { novelId } = route.params as { novelId: string };
  const novel = novels.find((n) => n.id === novelId);
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);

  useEffect(() => {
    loadChapters();
  }, [novelId]);

  useEffect(() => {
    // Track novel view when screen loads
    if (user && novel) {
      trackNovelView(parseInt(user.id), parseInt(novelId));
    }
  }, [novelId, user, novel]);

  async function loadChapters() {
    setIsLoadingChapters(true);
    const fetchedChapters = await getChaptersForNovel(novelId);
    setChapters(fetchedChapters);
    setIsLoadingChapters(false);
  }
  
  if (!novel) return null;
  
  const isFollowing = followingNovels.has(novelId);
  const isAuthor = user?.id === novel.authorId;

  const coverImageSource = {
    romance: require("@/assets/images/novels/romance.png"),
    fantasy: require("@/assets/images/novels/fantasy.png"),
    thriller: require("@/assets/images/novels/thriller.png"),
    mystery: require("@/assets/images/novels/mystery.png"),
    adventure: require("@/assets/images/novels/adventure.png"),
  };

  const placeholderImage = coverImageSource[novel.genre.toLowerCase() as keyof typeof coverImageSource];
  const imageSource = novel.coverImage ? { uri: novel.coverImage } : placeholderImage;

  const renderChapter = ({ item }: any) => {
    const isUnlocked = item.isFree || unlockedChapters.has(item.id);
    
    return (
      <Pressable
        onPress={() => navigation.navigate("Reader", { novelId, chapterId: item.id })}
        style={({ pressed }) => [
          styles.chapterItem,
          { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <View style={styles.chapterLeft}>
          <ThemedText style={styles.chapterTitle}>{item.title}</ThemedText>
          <ThemedText style={[styles.chapterMeta, { color: theme.textSecondary }]}>
            {item.wordCount.toLocaleString()} words
          </ThemedText>
        </View>
        <View style={styles.chapterRight}>
          {item.isFree ? (
            <View style={[styles.freeBadge, { backgroundColor: theme.success }]}>
              <ThemedText style={styles.freeBadgeText}>FREE</ThemedText>
            </View>
          ) : isUnlocked ? (
            <Feather name="check-circle" size={20} color={theme.success} />
          ) : (
            <Feather name="lock" size={20} color={theme.warning} />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <Image source={imageSource} style={styles.cover} resizeMode="cover" />
        <View style={styles.headerInfo}>
          <ThemedText style={[Typography.h1, styles.title]}>{novel.title}</ThemedText>
          <ThemedText style={[styles.author, { color: theme.textSecondary }]}>
            by {novel.author}
          </ThemedText>
          <View style={styles.meta}>
            <View style={styles.rating}>
              <Feather name="star" size={16} color={theme.secondary} />
              <ThemedText style={{ color: theme.textSecondary }}>
                {novel.rating.toFixed(1)} ({novel.ratingCount.toLocaleString()})
              </ThemedText>
            </View>
            <View style={[styles.tag, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.tagText}>{novel.genre}</ThemedText>
            </View>
            <View style={[styles.tag, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={styles.tagText}>{novel.status}</ThemedText>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {isAuthor ? (
          <Pressable
            onPress={() => (navigation.getParent() as any)?.navigate('ProfileTab', { screen: 'ManageNovel', params: { novelId } })}
            style={styles.editButton}
          >
            <LinearGradient
              colors={GradientColors.purplePink.colors}
              start={GradientColors.purplePink.start}
              end={GradientColors.purplePink.end}
              style={styles.editButtonGradient}
            >
              <Feather name="edit-2" size={18} color="#FFFFFF" />
              <ThemedText style={styles.editButtonText}>Kelola Novel</ThemedText>
            </LinearGradient>
          </Pressable>
        ) : (
          <Button
            onPress={() => toggleFollow(novelId)}
            style={[styles.followButton, { backgroundColor: isFollowing ? theme.backgroundSecondary : theme.primary }]}
          >
            {isFollowing ? "Mengikuti" : "Ikuti"}
          </Button>
        )}
        <Pressable style={styles.iconButton}>
          <Feather name="share-2" size={20} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText style={[Typography.h3, styles.sectionTitle]}>Sinopsis</ThemedText>
        <ThemedText style={[styles.synopsis, { color: theme.textSecondary }]}>
          {isSynopsisExpanded 
            ? novel.synopsis 
            : novel.synopsis.split('\n')[0]}
        </ThemedText>
        {novel.synopsis.split('\n').length > 1 && (
          <Pressable 
            onPress={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
            style={styles.showMoreButton}
          >
            <ThemedText style={[styles.showMoreText, { color: theme.primary }]}>
              {isSynopsisExpanded ? 'Sembunyikan' : 'Lihat Seluruhnya'}
            </ThemedText>
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <ThemedText style={[Typography.h3, styles.sectionTitle]}>
          Chapters ({novel.totalChapters})
        </ThemedText>
        {isLoadingChapters ? (
          <View style={{ paddingVertical: Spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={chapters}
            renderItem={renderChapter}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.chapterList}
          />
        )}
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
  },
  cover: {
    width: "100%",
    height: 240,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
  },
  headerInfo: {
    gap: Spacing.sm,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  author: {
    fontSize: 16,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flexWrap: "wrap",
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  followButton: {
    flex: 1,
  },
  editButton: {
    flex: 1,
  },
  editButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  iconButton: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  synopsis: {
    lineHeight: 24,
  },
  showMoreButton: {
    marginTop: Spacing.sm,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: "600",
  },
  chapterList: {
    gap: Spacing.sm,
  },
  chapterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  chapterLeft: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  chapterMeta: {
    fontSize: 12,
  },
  chapterRight: {
    marginLeft: Spacing.md,
  },
  freeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
