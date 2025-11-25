import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Pressable, Image, FlatList, ActivityIndicator, TextInput, Alert } from "react-native";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
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
import { UsersIcon } from "@/components/icons/UsersIcon";
import { RoleBadge, UserRole } from "@/components/RoleBadge";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { trackNovelView, getNovelReviews, submitReview, getUserReview, NovelReview, getNovelRatingStats, ReviewReply, getReviewRepliesForNovel, submitReviewReply, getNovelLikeCount, getNovelFollowCount } from "@/utils/supabase";
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
  const { user } = useAuth();
  
  const { novelId } = route.params as { novelId: string };
  const novel = novels.find((n) => n.id === novelId);
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);
  
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
  }, [novelId]);
  
  async function loadCounts() {
    const [likes, follows] = await Promise.all([
      getNovelLikeCount(parseInt(novelId)),
      getNovelFollowCount(parseInt(novelId)),
    ]);
    setLikeCount(likes);
    setFollowCount(follows);
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
    if (!user) {
      Alert.alert("Masuk Diperlukan", "Silakan masuk untuk memberikan ulasan.");
      return;
    }
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
    try {
      await toggleLike(novelId);
      setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      Alert.alert("Error", "Gagal menyukai novel");
    }
  };
  
  const handleToggleFollow = async () => {
    try {
      await toggleFollow(novelId);
      setFollowCount(prev => isFollowing ? prev - 1 : prev + 1);
    } catch (error) {
      Alert.alert("Error", "Gagal mengikuti novel");
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
            <CheckCircleIcon size={20} color={theme.success} />
          ) : (
            <LockIcon size={20} color={theme.warning} />
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
              <ThemedText style={[styles.socialButtonText, { color: isLiked ? theme.error : theme.text }]}>
                {likeCount.toLocaleString()}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={handleToggleFollow}
              style={[styles.socialButton, { backgroundColor: isFollowing ? theme.primary + '20' : theme.backgroundSecondary }]}
            >
              <UsersIcon size={18} color={isFollowing ? theme.primary : theme.text} />
              <ThemedText style={[styles.socialButtonText, { color: isFollowing ? theme.primary : theme.text }]}>
                {followCount.toLocaleString()}
              </ThemedText>
            </Pressable>
          </View>
        )}
        <Pressable style={styles.iconButton}>
          <ShareIcon size={20} color={theme.text} />
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
                      <TextInput
                        style={[styles.replyInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                        placeholder="Tulis balasan..."
                        placeholderTextColor={theme.textMuted}
                        value={replyText}
                        onChangeText={setReplyText}
                        multiline
                      />
                      <Button
                        onPress={handleSubmitReply}
                        style={styles.replySubmitButton}
                        disabled={isSubmittingReply || !replyText.trim()}
                      >
                        {isSubmittingReply ? "..." : "Kirim"}
                      </Button>
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
    gap: Spacing.sm,
  },
  replyInput: {
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
  },
  replySubmitButton: {
    alignSelf: "flex-end",
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
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
