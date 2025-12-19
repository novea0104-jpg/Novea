import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { Image } from "expo-image";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { Card } from "@/components/Card";
import { RoleBadge, UserRole } from "@/components/RoleBadge";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { BrowseStackParamList } from "@/navigation/BrowseStackNavigator";
import { getNewsComments, submitNewsComment, deleteNewsComment, NewsComment } from "@/utils/supabase";
import { Feather } from "@expo/vector-icons";

function toUserRole(role?: string): UserRole {
  const normalizedRole = role?.toLowerCase().replace(' ', '_');
  if (normalizedRole === 'penulis') return 'penulis';
  if (normalizedRole === 'editor') return 'editor';
  if (normalizedRole === 'co_admin') return 'co_admin';
  if (normalizedRole === 'super_admin') return 'super_admin';
  return 'pembaca';
}

const MessageCircleIcon = (props: { size: number; color: string }) => <Feather name="message-circle" {...props} />;
const SendIcon = (props: { size: number; color: string }) => <Feather name="send" {...props} />;
const TrashIcon = (props: { size: number; color: string }) => <Feather name="trash-2" {...props} />;
const UserIcon = (props: { size: number; color: string }) => <Feather name="user" {...props} />;
const CornerDownRightIcon = (props: { size: number; color: string }) => <Feather name="corner-down-right" {...props} />;

type NewsDetailRouteProp = RouteProp<BrowseStackParamList, "NewsDetail">;

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface CommentItemProps {
  comment: NewsComment;
  theme: any;
  user: any;
  onReply: (commentId: number) => void;
  onDelete: (commentId: number) => void;
  replyingToId: number | null;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onSubmitReply: () => void;
  isSubmitting: boolean;
  depth?: number;
  navigation: any;
}

function CommentItem({
  comment,
  theme,
  user,
  onReply,
  onDelete,
  replyingToId,
  replyText,
  onReplyTextChange,
  onSubmitReply,
  isSubmitting,
  depth = 0,
  navigation,
}: CommentItemProps) {
  const isReplying = replyingToId === comment.id;
  const canDelete = user && user.id === comment.userId;
  const maxDepth = 2;

  return (
    <View style={[styles.commentItem, depth > 0 && { marginLeft: Spacing.lg }]}>
      <View style={styles.commentHeader}>
        <Pressable 
          style={styles.commentUser}
          onPress={() => navigation.navigate("UserProfile", { userId: String(comment.userId) })}
        >
          {comment.userAvatar ? (
            <Image source={{ uri: comment.userAvatar }} style={styles.commentAvatar} />
          ) : (
            <View style={[styles.commentAvatar, { backgroundColor: theme.backgroundSecondary }]}>
              <UserIcon size={14} color={theme.textMuted} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <View style={styles.commentUserRow}>
              <ThemedText style={[styles.commentUserName, { color: theme.primary }]}>
                {comment.userName}
              </ThemedText>
              <RoleBadge role={toUserRole(comment.userRole)} size="small" />
            </View>
            <ThemedText style={[styles.commentDate, { color: theme.textMuted }]}>
              {formatDate(comment.createdAt)}
            </ThemedText>
          </View>
        </Pressable>
        {canDelete ? (
          <Pressable onPress={() => onDelete(comment.id)} style={styles.deleteButton}>
            <TrashIcon size={14} color={theme.error} />
          </Pressable>
        ) : null}
      </View>

      <ThemedText style={[styles.commentContent, { color: theme.textSecondary }]}>
        {comment.content}
      </ThemedText>

      <View style={styles.commentActions}>
        {user && depth < maxDepth ? (
          <Pressable onPress={() => onReply(isReplying ? -1 : comment.id)} style={styles.replyButton}>
            <MessageCircleIcon size={14} color={theme.primary} />
            <ThemedText style={[styles.replyButtonText, { color: theme.primary }]}>
              {isReplying ? "Batal" : "Balas"}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      {isReplying ? (
        <View style={[styles.replyInputContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <TextInput
            style={[styles.replyInput, { color: theme.text, borderColor: theme.cardBorder }]}
            placeholder="Tulis balasan..."
            placeholderTextColor={theme.textMuted}
            value={replyText}
            onChangeText={onReplyTextChange}
            multiline
          />
          <Pressable
            onPress={onSubmitReply}
            disabled={isSubmitting || !replyText.trim()}
            style={[
              styles.sendReplyButton,
              { backgroundColor: theme.primary, opacity: isSubmitting || !replyText.trim() ? 0.5 : 1 },
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <SendIcon size={16} color="#fff" />
            )}
          </Pressable>
        </View>
      ) : null}

      {comment.replies && comment.replies.length > 0 ? (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              theme={theme}
              user={user}
              onReply={onReply}
              onDelete={onDelete}
              replyingToId={replyingToId}
              replyText={replyText}
              onReplyTextChange={onReplyTextChange}
              onSubmitReply={onSubmitReply}
              isSubmitting={isSubmitting}
              depth={depth + 1}
              navigation={navigation}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function NewsDetailScreen() {
  const route = useRoute<NewsDetailRouteProp>();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { newsId, title, content, imageUrl, createdAt } = route.params;

  const [comments, setComments] = useState<NewsComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const formattedDate = new Date(createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    loadComments();
  }, [newsId]);

  const loadComments = async () => {
    setIsLoadingComments(true);
    const data = await getNewsComments(newsId);
    setComments(data);
    setIsLoadingComments(false);
  };

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim()) return;

    setIsSubmitting(true);
    const result = await submitNewsComment(newsId, parseInt(user.id), newComment.trim());
    setIsSubmitting(false);

    if (result.success && result.comment) {
      setComments([...comments, result.comment]);
      setNewComment("");
    } else {
      Alert.alert("Error", result.error || "Gagal mengirim komentar");
    }
  };

  const handleSubmitReply = async () => {
    if (!user || !replyText.trim() || replyingToId === null) return;

    setIsSubmitting(true);
    const result = await submitNewsComment(newsId, parseInt(user.id), replyText.trim(), replyingToId);
    setIsSubmitting(false);

    if (result.success) {
      await loadComments();
      setReplyText("");
      setReplyingToId(null);
    } else {
      Alert.alert("Error", result.error || "Gagal mengirim balasan");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user) return;

    Alert.alert("Hapus Komentar", "Yakin ingin menghapus komentar ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          const result = await deleteNewsComment(commentId, parseInt(user.id));
          if (result.success) {
            await loadComments();
          } else {
            Alert.alert("Error", result.error || "Gagal menghapus komentar");
          }
        },
      },
    ]);
  };

  const handleReply = (commentId: number) => {
    if (commentId === -1) {
      setReplyingToId(null);
      setReplyText("");
    } else {
      setReplyingToId(commentId);
      setReplyText("");
    }
  };

  const totalCommentsCount = comments.reduce((acc, comment) => {
    return acc + 1 + (comment.replies?.length || 0);
  }, 0);

  return (
    <ScreenScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Image
            source={require("@/assets/images/novea-logo.png")}
            style={styles.logoImage}
            contentFit="contain"
          />
          <ThemedText style={styles.brandLabel}>News</ThemedText>
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
          <ThemedText style={[styles.date, { color: theme.textSecondary }]}>
            {formattedDate}
          </ThemedText>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.cardBorder }]} />

        <ThemedText style={styles.body}>{content}</ThemedText>
      </View>

      <View style={styles.commentsSection}>
        <ThemedText style={[Typography.h3, styles.commentsSectionTitle]}>
          Komentar ({totalCommentsCount})
        </ThemedText>

        {user ? (
          <Card elevation={1} style={styles.writeCommentCard}>
            <TextInput
              style={[styles.commentInput, { color: theme.text, borderColor: theme.cardBorder }]}
              placeholder="Tulis komentar..."
              placeholderTextColor={theme.textMuted}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <Pressable
              onPress={handleSubmitComment}
              disabled={isSubmitting || !newComment.trim()}
              style={[
                styles.submitCommentButton,
                { backgroundColor: theme.primary, opacity: isSubmitting || !newComment.trim() ? 0.5 : 1 },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <SendIcon size={16} color="#fff" />
                  <ThemedText style={styles.submitButtonText}>Kirim</ThemedText>
                </>
              )}
            </Pressable>
          </Card>
        ) : (
          <Card elevation={1} style={styles.loginPromptCard}>
            <ThemedText style={[styles.loginPromptText, { color: theme.textSecondary }]}>
              Login untuk menulis komentar
            </ThemedText>
          </Card>
        )}

        {isLoadingComments ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : comments.length === 0 ? (
          <Card elevation={1} style={styles.emptyCommentsCard}>
            <MessageCircleIcon size={32} color={theme.textMuted} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Belum ada komentar
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: theme.textMuted }]}>
              Jadilah yang pertama berkomentar!
            </ThemedText>
          </Card>
        ) : (
          <View style={styles.commentsList}>
            {comments.map((comment) => (
              <Card key={comment.id} elevation={1} style={styles.commentCard}>
                <CommentItem
                  comment={comment}
                  theme={theme}
                  user={user}
                  onReply={handleReply}
                  onDelete={handleDeleteComment}
                  replyingToId={replyingToId}
                  replyText={replyText}
                  onReplyTextChange={setReplyText}
                  onSubmitReply={handleSubmitReply}
                  isSubmitting={isSubmitting}
                  navigation={navigation}
                />
              </Card>
            ))}
          </View>
        )}
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
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
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
    paddingBottom: Spacing.lg,
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
    marginBottom: Spacing.md,
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
  commentsSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  commentsSectionTitle: {
    marginBottom: Spacing.md,
  },
  writeCommentCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  commentInput: {
    minHeight: 60,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    fontSize: 14,
    textAlignVertical: "top",
  },
  submitCommentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignSelf: "flex-end",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  loginPromptCard: {
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  loginPromptText: {
    fontSize: 14,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  emptyCommentsCard: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  commentsList: {
    gap: Spacing.md,
  },
  commentCard: {
    padding: Spacing.md,
  },
  commentItem: {
    marginBottom: Spacing.xs,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  commentUser: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.sm,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  commentUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: "600",
  },
  commentDate: {
    fontSize: 12,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  replyButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  replyInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  replyInput: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 14,
    textAlignVertical: "top",
  },
  sendReplyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  repliesContainer: {
    marginTop: Spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: "#8B5CF620",
    paddingLeft: Spacing.sm,
  },
});
