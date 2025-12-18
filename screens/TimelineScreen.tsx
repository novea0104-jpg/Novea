import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { ScreenFlatList } from "@/components/ScreenFlatList";
import { PostCard } from "@/components/PostCard";
import { CreatePostModal } from "@/components/CreatePostModal";
import { useTheme } from "@/hooks/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";
import {
  getTimelineFeed,
  createTimelinePost,
  toggleTimelinePostLike,
  deleteTimelinePost,
  getTimelinePostComments,
  addTimelinePostComment,
  deleteTimelinePostComment,
  TimelinePost,
  getUserNovels,
} from "@/utils/supabase";
import { PlusIcon } from "@/components/icons/PlusIcon";
import { MessageCircleIcon } from "@/components/icons/MessageCircleIcon";

export default function TimelineScreen() {
  const { theme } = useTheme();
  const { user, isGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDesktop, isTablet } = useResponsive();
  
  const sidebarWidth = (isDesktop || isTablet) ? 220 : 0;
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userNovels, setUserNovels] = useState<{ id: number; title: string; coverUrl?: string }[]>([]);

  const loadPosts = useCallback(async () => {
    try {
      const data = await getTimelineFeed(user?.id ? parseInt(user.id) : null);
      setPosts(data);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  const loadUserNovels = useCallback(async () => {
    if (!user?.id) return;
    try {
      const novels = await getUserNovels(parseInt(user.id));
      setUserNovels(novels.map(n => ({
        id: n.id,
        title: n.title,
        coverUrl: n.coverUrl || undefined,
      })));
    } catch (error) {
      console.error("Error loading user novels:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPosts();
    if (user?.id) {
      loadUserNovels();
    }
  }, [loadPosts, loadUserNovels]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const handleCreatePost = async (content: string, imageUrl?: string, novelId?: number): Promise<boolean> => {
    if (!user?.id) return false;
    
    const result = await createTimelinePost(parseInt(user.id), content, imageUrl, novelId);
    if (result.success) {
      loadPosts();
      return true;
    }
    return false;
  };

  const handleLikePress = async (postId: number) => {
    if (!user?.id || isGuest) return;
    
    const result = await toggleTimelinePostLike(parseInt(user.id), postId);
    if (!result.error) {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, isLiked: result.isLiked, likesCount: result.likesCount }
            : post
        )
      );
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!user?.id) return;
    
    const result = await deleteTimelinePost(postId, parseInt(user.id), user.role);
    if (result.success) {
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    }
  };

  const handleFetchComments = async (postId: number) => {
    return await getTimelinePostComments(postId);
  };

  const handleAddComment = async (postId: number, content: string, parentId?: number) => {
    if (!user?.id) return false;
    
    const result = await addTimelinePostComment(parseInt(user.id), postId, content, parentId);
    if (result) {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, commentsCount: post.commentsCount + 1 }
            : post
        )
      );
      return true;
    }
    return false;
  };

  const handleDeleteComment = async (postId: number, commentId: number) => {
    if (!user?.id) return;
    
    const result = await deleteTimelinePostComment(commentId, parseInt(user.id), postId);
    if (result.success) {
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? { ...post, commentsCount: Math.max(0, post.commentsCount - 1) }
            : post
        )
      );
    }
  };

  const handleNovelPress = (novelId: number) => {
    // Navigate to Browse tab's NovelDetail screen
    navigation.getParent()?.navigate("BrowseTab", {
      screen: "NovelDetail",
      params: { novelId: novelId.toString() },
    });
  };

  const handleUserPress = (userId: number) => {
    // Navigate to Browse tab's UserProfile screen
    navigation.getParent()?.navigate("BrowseTab", {
      screen: "UserProfile",
      params: { userId: userId.toString() },
    });
  };

  const renderPost = ({ item }: { item: TimelinePost }) => (
    <PostCard
      post={item}
      currentUserId={user?.id ? parseInt(user.id) : undefined}
      currentUserRole={user?.role}
      onLikePress={handleLikePress}
      onDeletePress={handleDeletePost}
      onFetchComments={handleFetchComments}
      onAddComment={handleAddComment}
      onDeleteComment={handleDeleteComment}
      onNovelPress={handleNovelPress}
      onUserPress={handleUserPress}
      isGuest={isGuest}
    />
  );

  const renderEmptyState = () => (
    <View style={[styles.emptyState, { backgroundColor: theme.backgroundDefault }]}>
      <View style={[styles.emptyIconContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <MessageCircleIcon size={48} color={theme.primary} />
      </View>
      <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
        Linimasa Kosong
      </ThemedText>
      <ThemedText style={[styles.emptyText, { color: theme.textMuted }]}>
        {isGuest 
          ? "Masuk untuk melihat postingan dari penulis favoritmu dan bergabung dengan komunitas."
          : "Belum ada postingan dari penulis yang kamu ikuti. Ikuti lebih banyak penulis untuk melihat update mereka di sini."
        }
      </ThemedText>
      {!isGuest && user && (
        <Pressable
          onPress={() => setShowCreateModal(true)}
          style={[styles.createFirstBtn, { backgroundColor: theme.primary }]}
        >
          <ThemedText style={styles.createFirstBtnText}>
            Buat Postingan Pertamamu
          </ThemedText>
        </Pressable>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={[styles.loadingText, { color: theme.textMuted }]}>
          Memuat linimasa...
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot, marginLeft: sidebarWidth }]}>
      <ScreenFlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {!isGuest && user && (
        <Pressable
          onPress={() => setShowCreateModal(true)}
          style={[
            styles.fab,
            { 
              backgroundColor: theme.primary,
              bottom: insets.bottom + 90,
            },
          ]}
        >
          <PlusIcon size={24} color="#FFFFFF" />
        </Pressable>
      )}

      <CreatePostModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePost}
        userName={user?.name || "Pengguna"}
        userAvatar={user?.avatarUrl}
        userRole={user?.role || "pembaca"}
        novels={userNovels}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.body.fontSize,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xl,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.h2.fontSize,
    fontWeight: "700",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    fontSize: Typography.body.fontSize,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  createFirstBtn: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  createFirstBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: Typography.body.fontSize,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});
