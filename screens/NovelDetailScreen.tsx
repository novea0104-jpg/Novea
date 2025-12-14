import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, Image, FlatList, ActivityIndicator, TextInput, Alert, Modal, Platform } from "react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { MarkdownText } from "@/components/MarkdownText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { StarIcon } from "@/components/icons/StarIcon";
import { EditIcon } from "@/components/icons/EditIcon";
import { ShareIcon } from "@/components/icons/ShareIcon";
import { CheckCircleIcon } from "@/components/icons/CheckCircleIcon";
import { LockIcon } from "@/components/icons/LockIcon";
import { UserIcon } from "@/components/icons/UserIcon";
import { MessageCircleIcon } from "@/components/icons/MessageCircleIcon";
import { HeartIcon } from "@/components/icons/HeartIcon";
import { SendIcon } from "@/components/icons/SendIcon";
import { UsersIcon } from "@/components/icons/UsersIcon";
import { XIcon } from "@/components/icons/XIcon";
import { RoleBadge, UserRole } from "@/components/RoleBadge";
import { ShareModal } from "@/components/ShareModal";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, trackNovelView, getNovelReviews, submitReview, getUserReview, NovelReview, getNovelRatingStats, ReviewReply, getReviewRepliesForNovel, submitReviewReply, getNovelLikeCount, getNovelFollowCount, createTimelinePost, getNovelChapterLikesCount } from "@/utils/supabase";
import { BrowseStackParamList } from "@/navigation/BrowseStackNavigator";
import { Spacing, BorderRadius, Typography, GradientColors } from "@/constants/theme";
import { Chapter } from "@/types/models";

type NavigationProp = NativeStackNavigationProp<BrowseStackParamList>;

function toUserRole(role?: string): UserRole {
  const normalizedRole = (role || 'Pembaca').toLowerCase().replace(' ', '_');
  const validRoles: UserRole[] = ['pembaca', 'penulis', 'editor', 'co_admin', 'super_admin'];
  return validRoles.includes(normalizedRole as UserRole) ? normalizedRole as UserRole : 'pembaca';
}

export default function NovelDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { novels, followingNovels, likedNovels, toggleFollow, toggleLike, unlockedChapters, getChaptersForNovel, refreshNovels } = useApp();
  const { user, requireAuth } = useAuth();
  const { isDesktop, isTablet, width } = useResponsive();
  
  const { novelId } = route.params as { novelId: string };
  const novel = novels.find((n) => n.id === novelId);
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  const [showAllChapters, setShowAllChapters] = useState(false);
  
  const CHAPTERS_PREVIEW_COUNT = 10;
  const sidebarWidth = (isDesktop || isTablet) ? 220 : 0;
  const screenWidth = width - sidebarWidth;
  
  // Reviews state
  const [reviews, setReviews] = useState<NovelReview[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [hasExistingReview, setHasExistingReview] = useState(false);
  const [ratingStats, setRatingStats] = useState<{ averageRating: number; totalReviews: number }>({
    averageRating: 0,
    totalReviews: 0,
  });
  
  // Reply state
  const [reviewReplies, setReviewReplies] = useState<Map<number, ReviewReply[]>>(new Map());
  const [replyingToReviewId, setReplyingToReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  
  // Edit review state
  const [isEditingReview, setIsEditingReview] = useState(false);
  
  // Like and follow counts
  const [likeCount, setLikeCount] = useState(0);
  const [followCount, setFollowCount] = useState(0);
  const [chapterLikesCount, setChapterLikesCount] = useState(0);
  
  // Novel genres
  const [novelGenres, setNovelGenres] = useState<{ id: number; name: string; slug: string; gradient_start: string; gradient_end: string }[]>([]);
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCaption, setShareCaption] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [showSocialShareModal, setShowSocialShareModal] = useState(false);

  // Navigate to user profile
  const navigateToUserProfile = (userId: number | string) => {
    navigation.navigate("UserProfile", { userId: userId.toString() });
  };

  React.useLayoutEffect(() => {
    if (novel) {
      navigation.setOptions({
        headerTitle: () => (
          <ThemedText style={{ fontSize: 16, fontWeight: '700' }} numberOfLines={1}>
            {novel.title}
          </ThemedText>
        ),
      });
    }
  }, [navigation, novel]);

  useEffect(() => {
    loadChapters();
    loadReviews();
    loadCounts();
    loadNovelGenres();
  }, [novelId]);
  
  async function loadNovelGenres() {
    try {
      // Fetch genres for this novel from novel_genres junction table
      const { data: novelGenreData, error } = await supabase
        .from("novel_genres")
        .select("genre_id, is_primary, genres(id, name, slug, gradient_start, gradient_end)")
        .eq("novel_id", parseInt(novelId))
        .order("is_primary", { ascending: false });
      
      if (error) {
        console.log("Novel genres table not found, using fallback");
        // Fallback to single genre from novel object
        if (novel?.genre) {
          const fallbackGenres = getFallbackGenreColors(novel.genre);
          setNovelGenres([fallbackGenres]);
        }
        return;
      }
      
      if (novelGenreData && novelGenreData.length > 0) {
        const genres = novelGenreData
          .filter((ng: any) => ng.genres)
          .map((ng: any) => ({
            id: ng.genres.id,
            name: ng.genres.name,
            slug: ng.genres.slug,
            gradient_start: ng.genres.gradient_start || "#6B7280",
            gradient_end: ng.genres.gradient_end || "#4B5563",
          }));
        setNovelGenres(genres);
      } else if (novel?.genre) {
        // Fallback to single genre
        const fallbackGenres = getFallbackGenreColors(novel.genre);
        setNovelGenres([fallbackGenres]);
      }
    } catch (error) {
      console.error("Error loading novel genres:", error);
      if (novel?.genre) {
        const fallbackGenres = getFallbackGenreColors(novel.genre);
        setNovelGenres([fallbackGenres]);
      }
    }
  }
  
  function getFallbackGenreColors(genreName: string) {
    const genreColors: Record<string, { gradient_start: string; gradient_end: string }> = {
      romance: { gradient_start: "#EC4899", gradient_end: "#8B5CF6" },
      fantasy: { gradient_start: "#8B5CF6", gradient_end: "#3B82F6" },
      thriller: { gradient_start: "#DC2626", gradient_end: "#000000" },
      mystery: { gradient_start: "#14B8A6", gradient_end: "#000000" },
      "sci-fi": { gradient_start: "#06B6D4", gradient_end: "#8B5CF6" },
      adventure: { gradient_start: "#F59E0B", gradient_end: "#D97706" },
      drama: { gradient_start: "#6366F1", gradient_end: "#8B5CF6" },
      horror: { gradient_start: "#991B1B", gradient_end: "#000000" },
      comedy: { gradient_start: "#FBBF24", gradient_end: "#F59E0B" },
      action: { gradient_start: "#EF4444", gradient_end: "#DC2626" },
      chicklit: { gradient_start: "#F472B6", gradient_end: "#EC4899" },
      teenlit: { gradient_start: "#34D399", gradient_end: "#10B981" },
      apocalypse: { gradient_start: "#78350F", gradient_end: "#451A03" },
      pernikahan: { gradient_start: "#FB7185", gradient_end: "#F43F5E" },
      sistem: { gradient_start: "#22D3EE", gradient_end: "#0891B2" },
      urban: { gradient_start: "#64748B", gradient_end: "#475569" },
      fanfiction: { gradient_start: "#C084FC", gradient_end: "#A855F7" },
    };
    const colors = genreColors[genreName.toLowerCase()] || { gradient_start: "#6B7280", gradient_end: "#4B5563" };
    return {
      id: 0,
      name: genreName,
      slug: genreName.toLowerCase(),
      ...colors,
    };
  }
  
  async function loadCounts() {
    const [likes, follows, chapterLikes] = await Promise.all([
      getNovelLikeCount(parseInt(novelId)),
      getNovelFollowCount(parseInt(novelId)),
      getNovelChapterLikesCount(parseInt(novelId)),
    ]);
    setLikeCount(likes);
    setFollowCount(follows);
    setChapterLikesCount(chapterLikes);
  }

  useEffect(() => {
    // Track novel view when screen loads
    if (user && novel) {
      trackNovelView(parseInt(user.id), parseInt(novelId));
    }
  }, [novelId, user, novel]);

  // Load user's existing review
  useEffect(() => {
    async function loadUserReview() {
      if (user && novelId) {
        const existingReview = await getUserReview(parseInt(user.id), parseInt(novelId));
        if (existingReview) {
          setUserRating(existingReview.rating);
          setUserComment(existingReview.comment || "");
          setHasExistingReview(true);
        } else {
          setHasExistingReview(false);
        }
      }
    }
    loadUserReview();
  }, [user, novelId]);

  async function loadChapters() {
    setIsLoadingChapters(true);
    const fetchedChapters = await getChaptersForNovel(novelId);
    setChapters(fetchedChapters);
    setIsLoadingChapters(false);
  }

  async function loadReviews() {
    setIsLoadingReviews(true);
    const [fetchedReviews, stats, repliesMap] = await Promise.all([
      getNovelReviews(parseInt(novelId)),
      getNovelRatingStats(parseInt(novelId)),
      getReviewRepliesForNovel(parseInt(novelId)),
    ]);
    setReviews(fetchedReviews);
    setRatingStats(stats);
    setReviewReplies(repliesMap);
    setIsLoadingReviews(false);
  }

  async function handleSubmitReply() {
    if (!requireAuth("Masuk untuk membalas ulasan")) return;
    if (!user || !replyingToReviewId || !replyText.trim()) return;

    setIsSubmittingReply(true);
    const result = await submitReviewReply(
      replyingToReviewId,
      parseInt(user.id),
      replyText.trim()
    );
    setIsSubmittingReply(false);

    if (result.success) {
      setReplyText("");
      setReplyingToReviewId(null);
      loadReviews(); // Refresh to show new reply
    } else {
      Alert.alert("Gagal", result.error || "Gagal mengirim balasan.");
    }
  }

  async function handleSubmitReview() {
    if (!requireAuth("Masuk untuk memberikan ulasan")) return;
    if (!user) return;
    
    if (userRating === 0) {
      Alert.alert("Rating Diperlukan", "Silakan pilih rating bintang.");
      return;
    }

    setIsSubmittingReview(true);
    const result = await submitReview(
      parseInt(user.id),
      parseInt(novelId),
      userRating,
      userComment.trim() || undefined
    );

    setIsSubmittingReview(false);

    if (result.success) {
      Alert.alert("Berhasil", "Ulasan kamu telah disimpan!");
      setIsEditingReview(false);
      setHasExistingReview(true);
      loadReviews();
      refreshNovels(); // Refresh novels to update ratings on home screen
    } else {
      Alert.alert("Gagal", result.error || "Gagal menyimpan ulasan.");
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  
  if (!novel) return null;
  
  const isFollowing = followingNovels.has(novelId);
  const isLiked = likedNovels.has(novelId);
  const isAuthor = user?.id === novel.authorId;
  
  const handleToggleLike = async () => {
    if (!requireAuth("Masuk untuk menyukai novel ini")) return;
    
    try {
      await toggleLike(novelId);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      Alert.alert("Error", "Gagal menyukai novel");
    }
  };
  
  const handleToggleFollow = async () => {
    if (!requireAuth("Masuk untuk mengikuti novel ini")) return;
    
    try {
      await toggleFollow(novelId);
      setFollowCount(prev => isFollowing ? prev - 1 : prev + 1);
    } catch (error) {
      Alert.alert("Error", "Gagal mengikuti novel");
    }
  };

  const handleOpenShareModal = () => {
    if (!requireAuth("Masuk untuk membagikan novel ini")) return;
    setShareCaption(`Aku merekomendasikan novel "${novel.title}" karya ${novel.author}. Wajib baca!`);
    setShowShareModal(true);
  };

  const handleShareToTimeline = async () => {
    if (!user || !shareCaption.trim()) return;
    
    setIsSharing(true);
    try {
      const result = await createTimelinePost(
        parseInt(user.id),
        shareCaption.trim(),
        undefined,
        parseInt(novelId)
      );
      
      if (result.success) {
        setShowShareModal(false);
        setShareCaption("");
        Alert.alert("Berhasil", "Novel berhasil dibagikan ke Linimasa!");
      } else {
        Alert.alert("Gagal", result.error || "Gagal membagikan novel");
      }
    } catch (error) {
      Alert.alert("Error", "Terjadi kesalahan saat membagikan");
    } finally {
      setIsSharing(false);
    }
  };

  const coverImageSource = {
    romance: require("@/assets/images/novels/romance.png"),
    fantasy: require("@/assets/images/novels/fantasy.png"),
    thriller: require("@/assets/images/novels/thriller.png"),
    mystery: require("@/assets/images/novels/mystery.png"),
    adventure: require("@/assets/images/novels/adventure.png"),
  };

  const placeholderImage = coverImageSource[novel.genre.toLowerCase() as keyof typeof coverImageSource];
  const imageSource = novel.coverImage ? { uri: novel.coverImage } : placeholderImage;

  const renderChapter = ({ item, index }: { item: Chapter; index: number }) => {
    const isUnlocked = item.isFree || unlockedChapters.has(item.id);
    const chapterNumber = item.chapterNumber || (index + 1);
    
    return (
      <Pressable
        onPress={() => navigation.navigate("Reader", { novelId, chapterId: item.id })}
        style={({ pressed }) => [
          styles.chapterItem,
          { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <View style={[styles.chapterNumberBox, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText style={[styles.chapterNumberText, { color: theme.primary }]}>
            {chapterNumber}
          </ThemedText>
        </View>
        <View style={styles.chapterMiddle}>
          <ThemedText style={styles.chapterTitle} numberOfLines={1}>{item.title}</ThemedText>
          <ThemedText style={[styles.chapterMeta, { color: theme.textSecondary }]}>
            {item.wordCount.toLocaleString()} kata
          </ThemedText>
        </View>
        <View style={styles.chapterRight}>
          {item.isFree ? (
            <View style={[styles.freeBadge, { backgroundColor: theme.success }]}>
              <ThemedText style={styles.freeBadgeText}>GRATIS</ThemedText>
            </View>
          ) : isUnlocked ? (
            <CheckCircleIcon size={20} color={theme.success} />
          ) : (
            <LockIcon size={20} color={theme.warning} />
          )}
        </View>
      </Pressable>
    );
  };

  const coverWidth = screenWidth * 0.4;
  const coverHeight = coverWidth * 1.5;

  return (
    <ScreenScrollView style={{ marginLeft: sidebarWidth }}>
      <View style={styles.header}>
        <View style={styles.coverBackground}>
          <Image source={imageSource} style={styles.coverBackgroundImage} resizeMode="cover" blurRadius={25} />
          <LinearGradient
            colors={['transparent', theme.backgroundRoot]}
            style={styles.coverGradientOverlay}
          />
        </View>
        <View style={[styles.coverContainer, { marginTop: 60 }]}>
          <Image 
            source={imageSource} 
            style={[styles.coverImage, { width: coverWidth, height: coverHeight }]} 
            resizeMode="cover" 
          />
        </View>
        <View style={styles.headerInfo}>
          <ThemedText style={[Typography.h1, styles.title]}>{novel.title}</ThemedText>
          <Pressable onPress={() => novel.authorId && navigateToUserProfile(novel.authorId)}>
            <ThemedText style={[styles.author, { color: theme.textSecondary }]}>
              by <ThemedText style={[styles.authorName, { color: theme.primary }]}>{novel.author}</ThemedText>
            </ThemedText>
          </Pressable>
          <View style={styles.meta}>
            <View style={styles.rating}>
              <StarIcon size={16} color={theme.secondary} filled />
              <ThemedText style={{ color: theme.textSecondary }}>
                {ratingStats.averageRating.toFixed(1)} ({ratingStats.totalReviews.toLocaleString()})
              </ThemedText>
            </View>
            <View style={[styles.tag, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={styles.tagText}>{novel.status}</ThemedText>
            </View>
          </View>
          <View style={styles.genreTags}>
            {novelGenres.length > 0 ? (
              novelGenres.map((genre, index) => (
                <LinearGradient
                  key={genre.id || index}
                  colors={[genre.gradient_start, genre.gradient_end]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.genreTag}
                >
                  <ThemedText style={styles.genreTagText}>{genre.name}</ThemedText>
                </LinearGradient>
              ))
            ) : (
              <View style={[styles.tag, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.tagText}>{novel.genre}</ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {isAuthor ? (
          <Pressable
            onPress={() => navigation.navigate('ManageNovel', { novelId })}
            style={styles.editButton}
          >
            <LinearGradient
              colors={GradientColors.purplePink.colors}
              start={GradientColors.purplePink.start}
              end={GradientColors.purplePink.end}
              style={styles.editButtonGradient}
            >
              <EditIcon size={18} color="#FFFFFF" />
              <ThemedText style={styles.editButtonText}>Kelola Novel</ThemedText>
            </LinearGradient>
          </Pressable>
        ) : (
          <View style={styles.socialActions}>
            <Pressable
              onPress={handleToggleLike}
              style={[styles.socialButton, { backgroundColor: isLiked ? theme.error + '20' : theme.backgroundSecondary }]}
            >
              <HeartIcon size={18} color={isLiked ? theme.error : theme.text} filled={isLiked} />
              <View style={styles.socialButtonContent}>
                <ThemedText style={[styles.socialButtonCount, { color: isLiked ? theme.error : theme.text }]}>
                  {(likeCount + chapterLikesCount).toLocaleString()}
                </ThemedText>
                <ThemedText style={[styles.socialButtonLabel, { color: isLiked ? theme.error : theme.textSecondary }]}>
                  {isLiked ? 'Disukai' : 'Suka'}
                </ThemedText>
              </View>
            </Pressable>
            <Pressable
              onPress={handleToggleFollow}
              style={[styles.socialButton, { backgroundColor: isFollowing ? theme.primary + '20' : theme.backgroundSecondary }]}
            >
              <UsersIcon size={18} color={isFollowing ? theme.primary : theme.text} />
              <View style={styles.socialButtonContent}>
                <ThemedText style={[styles.socialButtonCount, { color: isFollowing ? theme.primary : theme.text }]}>
                  {followCount.toLocaleString()}
                </ThemedText>
                <ThemedText style={[styles.socialButtonLabel, { color: isFollowing ? theme.primary : theme.textSecondary }]}>
                  {isFollowing ? 'Mengikuti' : 'Ikuti'}
                </ThemedText>
              </View>
            </Pressable>
          </View>
        )}
        <Pressable style={styles.iconButton} onPress={handleOpenShareModal}>
          <ShareIcon size={20} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <ThemedText style={[Typography.h3, styles.sectionTitle]}>Sinopsis</ThemedText>
        <MarkdownText style={[styles.synopsis, { color: theme.textSecondary }]}>
          {isSynopsisExpanded 
            ? novel.synopsis 
            : novel.synopsis.split('\n')[0]}
        </MarkdownText>
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
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={[Typography.h3, styles.sectionTitle]}>
            Chapters ({novel.totalChapters})
          </ThemedText>
          {chapterLikesCount > 0 ? (
            <View style={[styles.chapterLikesBadge, { backgroundColor: theme.error + '15' }]}>
              <HeartIcon size={14} color={theme.error} filled />
              <ThemedText style={[styles.chapterLikesText, { color: theme.error }]}>
                {chapterLikesCount.toLocaleString()} Disukai
              </ThemedText>
            </View>
          ) : null}
        </View>
        {isLoadingChapters ? (
          <View style={{ paddingVertical: Spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <>
            <FlatList
              data={showAllChapters ? chapters : chapters.slice(0, CHAPTERS_PREVIEW_COUNT)}
              renderItem={renderChapter}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.chapterList}
            />
            {chapters.length > CHAPTERS_PREVIEW_COUNT ? (
              <Pressable 
                onPress={() => setShowAllChapters(!showAllChapters)} 
                style={[styles.showAllChaptersButton, { backgroundColor: theme.backgroundSecondary }]}
              >
                <ThemedText style={[styles.showAllChaptersText, { color: theme.primary }]}>
                  {showAllChapters ? 'Sembunyikan' : `Lihat Semua Chapter (${chapters.length})`}
                </ThemedText>
              </Pressable>
            ) : null}
          </>
        )}
      </View>

      {/* Reviews Section */}
      <View style={styles.section}>
        <ThemedText style={[Typography.h3, styles.sectionTitle]}>
          Ulasan & Rating ({ratingStats.totalReviews})
        </ThemedText>

        {/* Rating Summary */}
        <Card elevation={1} style={styles.ratingSummary}>
          <View style={styles.ratingOverview}>
            <View style={styles.ratingBig}>
              <ThemedText style={[Typography.h1, styles.ratingNumber]}>
                {ratingStats.averageRating.toFixed(1)}
              </ThemedText>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    size={16}
                    color={star <= Math.round(ratingStats.averageRating) ? theme.secondary : theme.backgroundSecondary}
                    filled={star <= Math.round(ratingStats.averageRating)}
                  />
                ))}
              </View>
              <ThemedText style={[styles.totalReviews, { color: theme.textMuted }]}>
                {ratingStats.totalReviews} ulasan
              </ThemedText>
            </View>
          </View>
        </Card>

        {/* Write Review */}
        {user && !isAuthor ? (
          hasExistingReview && !isEditingReview ? (
            <Card elevation={1} style={styles.writeReviewCard}>
              <View style={styles.existingReviewHeader}>
                <View>
                  <ThemedText style={[Typography.body, styles.writeReviewTitle]}>
                    Ulasan Kamu
                  </ThemedText>
                  <View style={styles.existingRatingRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        size={16}
                        color={star <= userRating ? theme.secondary : theme.backgroundSecondary}
                        filled={star <= userRating}
                      />
                    ))}
                  </View>
                </View>
                <Pressable 
                  onPress={() => setIsEditingReview(true)}
                  style={[styles.editReviewButton, { borderColor: theme.primary }]}
                >
                  <EditIcon size={14} color={theme.primary} />
                  <ThemedText style={[styles.editReviewText, { color: theme.primary }]}>
                    Edit
                  </ThemedText>
                </Pressable>
              </View>
              {userComment ? (
                <ThemedText style={[styles.existingComment, { color: theme.textSecondary }]} numberOfLines={2}>
                  "{userComment}"
                </ThemedText>
              ) : null}
            </Card>
          ) : (
            <Card elevation={1} style={styles.writeReviewCard}>
              <View style={styles.writeReviewHeader}>
                <ThemedText style={[Typography.body, styles.writeReviewTitle]}>
                  {hasExistingReview ? "Edit Ulasan" : "Tulis Ulasan"}
                </ThemedText>
                {hasExistingReview ? (
                  <Pressable onPress={() => setIsEditingReview(false)}>
                    <ThemedText style={[styles.cancelEditText, { color: theme.textMuted }]}>
                      Batal
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.starSelector}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable key={star} onPress={() => setUserRating(star)} style={styles.starButton}>
                    <StarIcon
                      size={32}
                      color={star <= userRating ? theme.secondary : theme.backgroundSecondary}
                      filled={star <= userRating}
                    />
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={[styles.commentInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                placeholder={hasExistingReview ? "Edit komentar kamu..." : "Tulis komentar (opsional)..."}
                placeholderTextColor={theme.textMuted}
                value={userComment}
                onChangeText={setUserComment}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Button
                onPress={handleSubmitReview}
                style={styles.submitButton}
                disabled={isSubmittingReview || userRating === 0}
              >
                {isSubmittingReview ? "Menyimpan..." : (hasExistingReview ? "Update Ulasan" : "Kirim Ulasan")}
              </Button>
            </Card>
          )
        ) : null}

        {/* Reviews List */}
        {isLoadingReviews ? (
          <View style={{ paddingVertical: Spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : reviews.length === 0 ? (
          <Card elevation={1} style={styles.emptyReviews}>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Belum ada ulasan. Jadilah yang pertama memberikan ulasan!
            </ThemedText>
          </Card>
        ) : (
          <>
            {(showAllReviews ? reviews : reviews.slice(0, 3)).map((review) => {
              const replies = reviewReplies.get(review.id) || [];
              const isReplying = replyingToReviewId === review.id;
              
              return (
                <Card key={review.id} elevation={1} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewUser}>
                      {review.userAvatar ? (
                        <Image source={{ uri: review.userAvatar }} style={styles.reviewAvatar} />
                      ) : (
                        <View style={[styles.reviewAvatar, { backgroundColor: theme.backgroundSecondary }]}>
                          <UserIcon size={16} color={theme.textMuted} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <View style={styles.reviewUserNameRow}>
                          <Pressable onPress={() => navigateToUserProfile(review.userId)}>
                            <ThemedText style={[styles.reviewUserName, { color: theme.primary }]}>{review.userName}</ThemedText>
                          </Pressable>
                          <RoleBadge role={toUserRole(review.userRole)} size="small" />
                        </View>
                        <ThemedText style={[styles.reviewDate, { color: theme.textMuted }]}>
                          {formatDate(review.createdAt)}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.reviewRating}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          size={12}
                          color={star <= review.rating ? theme.secondary : theme.backgroundSecondary}
                          filled={star <= review.rating}
                        />
                      ))}
                    </View>
                  </View>
                  {review.comment ? (
                    <ThemedText style={[styles.reviewComment, { color: theme.textSecondary }]}>
                      {review.comment}
                    </ThemedText>
                  ) : null}
                  
                  {/* Reply button */}
                  {user ? (
                    <Pressable 
                      onPress={() => setReplyingToReviewId(isReplying ? null : review.id)}
                      style={styles.replyButton}
                    >
                      <MessageCircleIcon size={14} color={theme.primary} />
                      <ThemedText style={[styles.replyButtonText, { color: theme.primary }]}>
                        {isReplying ? 'Batal' : 'Balas'}
                      </ThemedText>
                    </Pressable>
                  ) : null}
                  
                  {/* Reply input */}
                  {isReplying ? (
                    <View style={styles.replyInputContainer}>
                      <View style={styles.replyInputRow}>
                        <TextInput
                          style={[styles.replyInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                          placeholder="Tulis balasan..."
                          placeholderTextColor={theme.textMuted}
                          value={replyText}
                          onChangeText={setReplyText}
                          multiline
                        />
                        <Pressable
                          onPress={handleSubmitReply}
                          disabled={isSubmittingReply || !replyText.trim()}
                          style={({ pressed }) => [
                            styles.replySubmitBtn,
                            { 
                              backgroundColor: replyText.trim() ? theme.primary : theme.backgroundSecondary,
                              opacity: pressed ? 0.7 : 1,
                            },
                          ]}
                        >
                          {isSubmittingReply ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <SendIcon size={18} color={replyText.trim() ? "#FFFFFF" : theme.textMuted} />
                          )}
                        </Pressable>
                      </View>
                    </View>
                  ) : null}
                  
                  {/* Replies list */}
                  {replies.length > 0 ? (
                    <View style={styles.repliesContainer}>
                      {replies.map((reply) => (
                        <View key={reply.id} style={[styles.replyItem, { borderLeftColor: theme.backgroundSecondary }]}>
                          <View style={styles.replyHeader}>
                            {reply.userAvatar ? (
                              <Image source={{ uri: reply.userAvatar }} style={styles.replyAvatar} />
                            ) : (
                              <View style={[styles.replyAvatar, { backgroundColor: theme.backgroundSecondary }]}>
                                <UserIcon size={12} color={theme.textMuted} />
                              </View>
                            )}
                            <Pressable onPress={() => navigateToUserProfile(reply.userId)}>
                              <ThemedText style={[styles.replyUserName, { color: theme.primary }]}>{reply.userName}</ThemedText>
                            </Pressable>
                            <RoleBadge role={toUserRole(reply.userRole)} size="small" />
                            <ThemedText style={[styles.replyDate, { color: theme.textMuted }]}>
                              {formatDate(reply.createdAt)}
                            </ThemedText>
                          </View>
                          <ThemedText style={[styles.replyContent, { color: theme.textSecondary }]}>
                            {reply.content}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </Card>
              );
            })}
            {reviews.length > 3 ? (
              <Pressable onPress={() => setShowAllReviews(!showAllReviews)} style={styles.showMoreButton}>
                <ThemedText style={[styles.showMoreText, { color: theme.primary }]}>
                  {showAllReviews ? 'Sembunyikan' : `Lihat Semua (${reviews.length})`}
                </ThemedText>
              </Pressable>
            ) : null}
          </>
        )}
      </View>

      <Modal
        visible={showShareModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.shareModalOverlay}>
          <View style={[styles.shareModalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.shareModalHeader}>
              <ThemedText style={[Typography.h3, { flex: 1 }]}>Bagikan ke Linimasa</ThemedText>
              <Pressable onPress={() => setShowShareModal(false)} style={styles.shareModalClose}>
                <XIcon size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={[styles.shareNovelPreview, { backgroundColor: theme.backgroundSecondary }]}>
              <Image
                source={imageSource}
                style={styles.shareNovelCover}
              />
              <View style={styles.shareNovelInfo}>
                <ThemedText style={styles.shareNovelTitle} numberOfLines={2}>{novel.title}</ThemedText>
                <ThemedText style={[styles.shareNovelAuthor, { color: theme.textSecondary }]}>oleh {novel.author}</ThemedText>
              </View>
            </View>

            <TextInput
              value={shareCaption}
              onChangeText={setShareCaption}
              placeholder="Tulis caption..."
              placeholderTextColor={theme.textMuted}
              multiline
              style={[styles.shareCaptionInput, { 
                backgroundColor: theme.backgroundSecondary, 
                color: theme.text,
                borderColor: theme.cardBorder,
              }]}
            />

            <Pressable
              onPress={handleShareToTimeline}
              disabled={isSharing || !shareCaption.trim()}
              style={({ pressed }) => [
                styles.shareButton,
                { 
                  backgroundColor: shareCaption.trim() ? theme.primary : theme.backgroundSecondary,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              {isSharing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText style={[styles.shareButtonText, { color: shareCaption.trim() ? "#FFFFFF" : theme.textMuted }]}>
                  Bagikan ke Linimasa
                </ThemedText>
              )}
            </Pressable>

            <View style={styles.shareDivider}>
              <View style={[styles.shareDividerLine, { backgroundColor: theme.cardBorder }]} />
              <ThemedText style={[styles.shareDividerText, { color: theme.textMuted }]}>atau</ThemedText>
              <View style={[styles.shareDividerLine, { backgroundColor: theme.cardBorder }]} />
            </View>

            <Pressable
              onPress={() => {
                setShowShareModal(false);
                setShowSocialShareModal(true);
              }}
              style={({ pressed }) => [
                styles.shareButton,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <ThemedText style={[styles.shareButtonText, { color: theme.text }]}>
                Bagikan ke Media Sosial
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ShareModal
        visible={showSocialShareModal}
        onClose={() => setShowSocialShareModal(false)}
        title={novel.title}
        message={`Baca novel "${novel.title}" karya ${novel.author} di Novea!`}
        url={`https://noveaindonesia.com/novel/${novelId}`}
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.xl,
  },
  coverBackground: {
    position: "absolute",
    top: -100,
    left: -Spacing.xl,
    right: -Spacing.xl,
    height: 320,
    overflow: "hidden",
  },
  coverBackgroundImage: {
    width: "100%",
    height: "100%",
  },
  coverGradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  coverContainer: {
    alignItems: "center",
    marginBottom: Spacing.lg,
    zIndex: 1,
  },
  coverImage: {
    borderRadius: BorderRadius.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerInfo: {
    gap: Spacing.sm,
    alignItems: "center",
  },
  title: {
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  author: {
    fontSize: 16,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "500",
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
  genreTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  genreTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  genreTagText: {
    fontSize: 11,
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
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  chapterLikesBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  chapterLikesText: {
    fontSize: 12,
    fontWeight: "600",
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
  showAllChaptersButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  showAllChaptersText: {
    fontSize: 14,
    fontWeight: "600",
  },
  chapterList: {
    gap: Spacing.sm,
  },
  chapterItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  chapterNumberBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  chapterNumberText: {
    fontSize: 16,
    fontWeight: "700",
  },
  chapterMiddle: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  chapterMeta: {
    fontSize: 12,
  },
  chapterRight: {
    marginLeft: Spacing.sm,
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
  // Review styles
  ratingSummary: {
    marginBottom: Spacing.md,
  },
  ratingOverview: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  ratingBig: {
    alignItems: "center",
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: "700",
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: Spacing.xs,
  },
  totalReviews: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  writeReviewCard: {
    marginBottom: Spacing.md,
  },
  writeReviewTitle: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  writeReviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  existingReviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  existingRatingRow: {
    flexDirection: "row",
    gap: 2,
    marginTop: 4,
  },
  editReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  editReviewText: {
    fontSize: 13,
    fontWeight: "500",
  },
  existingComment: {
    fontSize: 13,
    fontStyle: "italic",
    marginTop: Spacing.sm,
  },
  cancelEditText: {
    fontSize: 13,
    fontWeight: "500",
  },
  starSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  starButton: {
    padding: Spacing.xs,
  },
  commentInput: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 14,
    minHeight: 80,
    marginBottom: Spacing.md,
  },
  submitButton: {
    marginTop: Spacing.xs,
  },
  emptyReviews: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  reviewCard: {
    marginBottom: Spacing.sm,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  reviewUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: "600",
  },
  reviewUserNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  reviewDate: {
    fontSize: 11,
  },
  reviewRating: {
    flexDirection: "row",
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  replyButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  replyInputContainer: {
    marginTop: Spacing.sm,
  },
  replyInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
  },
  replyInput: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 14,
    minHeight: 44,
    maxHeight: 100,
    textAlignVertical: "top",
  },
  replySubmitBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  repliesContainer: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  replyItem: {
    paddingLeft: Spacing.md,
    borderLeftWidth: 2,
    marginLeft: Spacing.xs,
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: 4,
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  replyUserName: {
    fontSize: 12,
    fontWeight: "600",
  },
  replyDate: {
    fontSize: 10,
    marginLeft: 4,
  },
  replyContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  socialActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    flex: 1,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    flex: 1,
  },
  socialButtonContent: {
    flexDirection: "column",
  },
  socialButtonCount: {
    fontSize: 15,
    fontWeight: "700",
  },
  socialButtonLabel: {
    fontSize: 11,
  },
  shareModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  shareModalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  shareModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  shareModalClose: {
    padding: Spacing.xs,
  },
  shareNovelPreview: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  shareNovelCover: {
    width: 60,
    height: 90,
    borderRadius: BorderRadius.sm,
  },
  shareNovelInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  shareNovelTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  shareNovelAuthor: {
    fontSize: 14,
  },
  shareCaptionInput: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  shareButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  shareDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  shareDividerLine: {
    flex: 1,
    height: 1,
  },
  shareDividerText: {
    fontSize: 12,
  },
});
