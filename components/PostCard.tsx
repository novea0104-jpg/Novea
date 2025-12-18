import React, { useState } from "react";
import { View, StyleSheet, Pressable, TextInput, FlatList, Alert, Platform } from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { RoleBadge, UserRole } from "@/components/RoleBadge";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { HeartIcon } from "@/components/icons/HeartIcon";
import { MessageCircleIcon } from "@/components/icons/MessageCircleIcon";
import { SendIcon } from "@/components/icons/SendIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import { ChevronUpIcon } from "@/components/icons/ChevronUpIcon";
import { UserIcon } from "@/components/icons/UserIcon";
import { TimelinePost, TimelinePostComment } from "@/utils/supabase";

interface PostCardProps {
  post: TimelinePost;
  currentUserId?: number;
  currentUserRole?: string;
  onLikePress: (postId: number) => void;
  onAddComment: (postId: number, content: string, parentId?: number) => Promise<boolean>;
  onDeletePress: (postId: number) => void;
  onDeleteComment?: (postId: number, commentId: number) => void;
  onUserPress?: (userId: number) => void;
  onNovelPress?: (novelId: number) => void;
  onFetchComments?: (postId: number) => Promise<TimelinePostComment[]>;
  isGuest?: boolean;
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Baru saja";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} hari lalu`;
  
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CommentItem({
  comment,
  currentUserId,
  theme,
  onReply,
  onDelete,
  onUserPress,
  depth = 0,
}: {
  comment: TimelinePostComment;
  currentUserId?: number;
  theme: any;
  onReply: (parentId: number) => void;
  onDelete: (commentId: number) => void;
  onUserPress?: (userId: number) => void;
  depth?: number;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;
  const isOwner = currentUserId === comment.userId;
  const maxDepth = 2;

  return (
    <View style={[styles.commentItem, { marginLeft: depth * 16 }]}>
      <Pressable 
        onPress={() => onUserPress?.(comment.userId)}
        style={styles.commentHeader}
      >
        {comment.userAvatar ? (
          <Image
            source={{ uri: comment.userAvatar }}
            style={styles.commentAvatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.commentAvatarPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
            <UserIcon size={14} color={theme.textMuted} />
          </View>
        )}
        <View style={styles.commentHeaderInfo}>
          <ThemedText style={[styles.commentUserName, { color: theme.text }]}>
            {comment.userName}
          </ThemedText>
          <ThemedText style={[styles.commentTime, { color: theme.textMuted }]}>
            {formatTimeAgo(comment.createdAt)}
          </ThemedText>
        </View>
      </Pressable>
      
      <ThemedText style={[styles.commentContent, { color: theme.text }]}>
        {comment.content}
      </ThemedText>
      
      <View style={styles.commentActions}>
        {depth < maxDepth && (
          <Pressable onPress={() => onReply(comment.id)} style={styles.commentActionBtn}>
            <ThemedText style={[styles.commentActionText, { color: theme.primary }]}>
              Balas
            </ThemedText>
          </Pressable>
        )}
        {isOwner && (
          <Pressable onPress={() => onDelete(comment.id)} style={styles.commentActionBtn}>
            <ThemedText style={[styles.commentActionText, { color: theme.error }]}>
              Hapus
            </ThemedText>
          </Pressable>
        )}
      </View>

      {hasReplies && (
        <View>
          <Pressable 
            onPress={() => setShowReplies(!showReplies)} 
            style={styles.showRepliesBtn}
          >
            {showReplies ? (
              <ChevronUpIcon size={14} color={theme.primary} />
            ) : (
              <ChevronDownIcon size={14} color={theme.primary} />
            )}
            <ThemedText style={[styles.showRepliesText, { color: theme.primary }]}>
              {showReplies ? "Sembunyikan" : `Lihat ${comment.replies!.length} balasan`}
            </ThemedText>
          </Pressable>
          
          {showReplies && comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              theme={theme}
              onReply={onReply}
              onDelete={onDelete}
              onUserPress={onUserPress}
              depth={depth + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export function PostCard({
  post,
  currentUserId,
  currentUserRole,
  onLikePress,
  onAddComment,
  onDeletePress,
  onDeleteComment,
  onUserPress,
  onNovelPress,
  onFetchComments,
  isGuest = false,
}: PostCardProps) {
  const { theme } = useTheme();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<TimelinePostComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const isOwner = currentUserId === post.userId;
  const adminRoles = ['admin', 'co_admin', 'editor', 'super_admin'];
  const isAdminOrEditor = currentUserRole && adminRoles.includes(currentUserRole);
  const canDelete = isOwner || isAdminOrEditor;

  const handleLike = async () => {
    if (isLiking || isGuest) return;
    setIsLiking(true);
    await onLikePress(post.id);
    setIsLiking(false);
  };

  const loadComments = async () => {
    if (!onFetchComments) return;
    setIsLoadingComments(true);
    try {
      const fetchedComments = await onFetchComments(post.id);
      setComments(fetchedComments);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || isSubmittingComment || isGuest) return;
    setIsSubmittingComment(true);
    try {
      const success = await onAddComment(post.id, commentText.trim(), replyingTo || undefined);
      if (success) {
        setCommentText("");
        setReplyingTo(null);
        loadComments();
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = () => {
    if (Platform.OS === "web") {
      if (confirm("Yakin ingin menghapus postingan ini?")) {
        onDeletePress(post.id);
      }
    } else {
      Alert.alert(
        "Hapus Postingan",
        "Yakin ingin menghapus postingan ini?",
        [
          { text: "Batal", style: "cancel" },
          { text: "Hapus", style: "destructive", onPress: () => onDeletePress(post.id) },
        ]
      );
    }
  };

  const handleReply = (parentId: number) => {
    if (isGuest) return;
    setReplyingTo(parentId);
  };

  const handleDeleteComment = (commentId: number) => {
    if (!onDeleteComment) return;
    
    if (Platform.OS === "web") {
      if (confirm("Yakin ingin menghapus komentar ini?")) {
        onDeleteComment(post.id, commentId);
        loadComments();
      }
    } else {
      Alert.alert(
        "Hapus Komentar",
        "Yakin ingin menghapus komentar ini?",
        [
          { text: "Batal", style: "cancel" },
          { 
            text: "Hapus", 
            style: "destructive", 
            onPress: () => {
              onDeleteComment(post.id, commentId);
              loadComments();
            } 
          },
        ]
      );
    }
  };

  return (
    <Card elevation={1} style={styles.card}>
      <View style={styles.header}>
        <Pressable 
          onPress={() => onUserPress?.(post.userId)}
          style={styles.userInfo}
        >
          {post.userAvatar ? (
            <Image
              source={{ uri: post.userAvatar }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
              <UserIcon size={20} color={theme.textMuted} />
            </View>
          )}
          <View style={styles.headerTextContainer}>
            <View style={styles.nameRow}>
              <ThemedText style={[styles.userName, { color: theme.text }]}>
                {post.userName}
              </ThemedText>
              <RoleBadge role={post.userRole as UserRole} size="small" />
            </View>
            <ThemedText style={[styles.timeText, { color: theme.textMuted }]}>
              {formatTimeAgo(post.createdAt)}
            </ThemedText>
          </View>
        </Pressable>
        
        {canDelete && (
          <Pressable onPress={handleDelete} style={styles.deleteBtn}>
            <TrashIcon size={18} color={theme.error} />
          </Pressable>
        )}
      </View>

      <ThemedText style={[styles.content, { color: theme.text }]}>
        {post.content}
      </ThemedText>

      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          contentFit="cover"
        />
      )}

      {post.novelId && post.novelTitle && (
        <Pressable 
          onPress={() => onNovelPress?.(post.novelId!)}
          style={[styles.novelCard, { backgroundColor: theme.backgroundSecondary }]}
        >
          {post.novelCover && (
            <Image
              source={{ uri: post.novelCover }}
              style={styles.novelCover}
              contentFit="cover"
            />
          )}
          <ThemedText style={[styles.novelTitle, { color: theme.text }]} numberOfLines={2}>
            {post.novelTitle}
          </ThemedText>
        </Pressable>
      )}

      <View style={[styles.actions, { borderTopColor: theme.cardBorder }]}>
        <Pressable 
          onPress={handleLike}
          style={[styles.actionBtn, post.isLiked && styles.actionBtnActive]}
        >
          <HeartIcon 
            size={20} 
            color={post.isLiked ? theme.error : theme.textMuted} 
            filled={post.isLiked}
          />
          <ThemedText 
            style={[
              styles.actionText, 
              { color: post.isLiked ? theme.error : theme.textMuted }
            ]}
          >
            {post.likesCount > 0 ? post.likesCount : "Suka"}
          </ThemedText>
        </Pressable>

        <Pressable onPress={handleToggleComments} style={styles.actionBtn}>
          <MessageCircleIcon size={20} color={theme.textMuted} />
          <ThemedText style={[styles.actionText, { color: theme.textMuted }]}>
            {post.commentsCount > 0 ? post.commentsCount : "Komentar"}
          </ThemedText>
        </Pressable>
      </View>

      {showComments && (
        <View style={[styles.commentsSection, { borderTopColor: theme.cardBorder }]}>
          {replyingTo && (
            <View style={[styles.replyingBanner, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={[styles.replyingText, { color: theme.textMuted }]}>
                Membalas komentar...
              </ThemedText>
              <Pressable onPress={() => setReplyingTo(null)}>
                <ThemedText style={[styles.cancelReply, { color: theme.primary }]}>
                  Batal
                </ThemedText>
              </Pressable>
            </View>
          )}
          
          <View style={[styles.commentInputContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <TextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder={replyingTo ? "Tulis balasan..." : "Tulis komentar..."}
              placeholderTextColor={theme.textMuted}
              style={[styles.commentInput, { color: theme.text }]}
              multiline
            />
            <Pressable 
              onPress={handleSubmitComment}
              disabled={!commentText.trim()}
              style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]}
            >
              <SendIcon size={20} color={commentText.trim() ? theme.primary : theme.textMuted} />
            </Pressable>
          </View>

          {isLoadingComments ? (
            <ThemedText style={[styles.loadingText, { color: theme.textMuted }]}>
              Memuat komentar...
            </ThemedText>
          ) : comments.length === 0 ? (
            <ThemedText style={[styles.noCommentsText, { color: theme.textMuted }]}>
              Belum ada komentar. Jadilah yang pertama!
            </ThemedText>
          ) : (
            <View style={styles.commentsList}>
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  theme={theme}
                  onReply={handleReply}
                  onDelete={handleDeleteComment}
                  onUserPress={onUserPress}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    padding: 0,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    flexWrap: "wrap",
  },
  userName: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
  },
  timeText: {
    fontSize: Typography.caption.fontSize,
    marginTop: 2,
  },
  deleteBtn: {
    padding: Spacing.sm,
  },
  content: {
    fontSize: Typography.body.fontSize,
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  postImage: {
    width: "100%",
    height: 200,
  },
  novelCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  novelCover: {
    width: 40,
    height: 56,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.sm,
  },
  novelTitle: {
    flex: 1,
    fontSize: Typography.caption.fontSize,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingVertical: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  actionBtnActive: {},
  actionText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: "500",
  },
  commentsSection: {
    borderTopWidth: 1,
    padding: Spacing.md,
  },
  replyingBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  replyingText: {
    fontSize: Typography.caption.fontSize,
  },
  cancelReply: {
    fontSize: Typography.caption.fontSize,
    fontWeight: "600",
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
  },
  commentInput: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
  },
  sendBtn: {
    padding: Spacing.sm,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  loadingText: {
    textAlign: "center",
    fontSize: Typography.caption.fontSize,
    paddingVertical: Spacing.md,
  },
  noCommentsText: {
    textAlign: "center",
    fontSize: Typography.caption.fontSize,
    paddingVertical: Spacing.md,
  },
  commentsList: {
    gap: Spacing.md,
  },
  commentItem: {
    marginTop: Spacing.sm,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  commentAvatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  commentHeaderInfo: {
    marginLeft: Spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  commentUserName: {
    fontSize: Typography.caption.fontSize,
    fontWeight: "600",
  },
  commentTime: {
    fontSize: Typography.caption.fontSize,
  },
  commentContent: {
    fontSize: Typography.caption.fontSize,
    lineHeight: 18,
    marginLeft: 36,
  },
  commentActions: {
    flexDirection: "row",
    marginLeft: 36,
    marginTop: Spacing.xs,
    gap: Spacing.md,
  },
  commentActionBtn: {
    paddingVertical: 2,
  },
  commentActionText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: "600",
  },
  showRepliesBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 36,
    marginTop: Spacing.xs,
    gap: 4,
  },
  showRepliesText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: "600",
  },
});
