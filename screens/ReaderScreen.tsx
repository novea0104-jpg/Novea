import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform, TextInput, Image, Modal, FlatList, Keyboard } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { MarkdownText } from "@/components/MarkdownText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { XIcon } from "@/components/icons/XIcon";
import { AlertCircleIcon } from "@/components/icons/AlertCircleIcon";
import { LockIcon } from "@/components/icons/LockIcon";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { ChevronRightIcon } from "@/components/icons/ChevronRightIcon";
import { MessageCircleIcon } from "@/components/icons/MessageCircleIcon";
import { SendIcon } from "@/components/icons/SendIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { UserIcon } from "@/components/icons/UserIcon";
import { TypeIcon } from "@/components/icons/TypeIcon";
import { SettingsIcon } from "@/components/icons/SettingsIcon";
import { PlusIcon } from "@/components/icons/PlusIcon";
import { ListIcon } from "@/components/icons/ListIcon";
import { LockIcon as LockSmallIcon } from "@/components/icons/LockIcon";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/utils/supabase";
import { Spacing, BorderRadius, Typography, Colors } from "@/constants/theme";
import { Chapter } from "@/types/models";

const FONT_FAMILIES = [
  { id: 'system', name: 'Default', fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' },
  { id: 'serif', name: 'Serif', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  { id: 'mono', name: 'Monospace', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
];

const FONT_SIZES = [14, 16, 18, 20, 22, 24];

interface ChapterComment {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string | null;
  content: string;
  parentCommentId: number | null;
  repliesCount: number;
  createdAt: Date;
  replies?: ChapterComment[];
}

export default function ReaderScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { novels, unlockedChapters, unlockChapter, getChaptersForNovel, getChapter } = useApp();
  const { user, updateCoinBalance } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  
  const commentInputAnimatedStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: Math.max(insets.bottom + Spacing.sm, -keyboardHeight.value + Spacing.sm),
    };
  });

  const { novelId, chapterId } = route.params as { novelId: string; chapterId: string };
  const novel = novels.find((n) => n.id === novelId);

  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0].fontFamily);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<ChapterComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showChaptersModal, setShowChaptersModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChapterComment | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadReaderSettings();
  }, []);

  const loadReaderSettings = async () => {
    try {
      const savedFontSize = await AsyncStorage.getItem('reader_font_size');
      const savedFontFamily = await AsyncStorage.getItem('reader_font_family');
      if (savedFontSize) setFontSize(parseInt(savedFontSize));
      if (savedFontFamily) setFontFamily(savedFontFamily);
    } catch (e) {
      console.log('Error loading reader settings:', e);
    }
  };

  const saveReaderSettings = async (size: number, family: string) => {
    try {
      await AsyncStorage.setItem('reader_font_size', size.toString());
      await AsyncStorage.setItem('reader_font_family', family);
    } catch (e) {
      console.log('Error saving reader settings:', e);
    }
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    saveReaderSettings(size, fontFamily);
  };

  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family);
    saveReaderSettings(fontSize, family);
  };

  useEffect(() => {
    loadChapterData();
  }, [chapterId, novelId]);

  useEffect(() => {
    if (chapterId) {
      loadComments();
    }
  }, [chapterId]);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chapter_comments')
        .select(`
          id,
          user_id,
          content,
          created_at,
          users (name, avatar_url)
        `)
        .eq('chapter_id', parseInt(chapterId))
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mappedComments: ChapterComment[] = (data || []).map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        userName: c.users?.name || 'Anonim',
        userAvatar: c.users?.avatar_url || null,
        content: c.content,
        parentCommentId: c.parent_comment_id || null,
        repliesCount: c.replies_count || 0,
        createdAt: new Date(c.created_at),
      }));

      setComments(mappedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  }, [chapterId]);

  const submitComment = async () => {
    if (!user || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase
        .from('chapter_comments')
        .insert({
          user_id: parseInt(user.id),
          chapter_id: parseInt(chapterId),
          novel_id: parseInt(novelId),
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment("");
      await loadComments();
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const deleteComment = async (commentId: number) => {
    try {
      const { error } = await supabase
        .from('chapter_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', parseInt(user?.id || '0'));

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleOpenChaptersModal = useCallback(() => {
    setShowChaptersModal(true);
  }, []);

  const handleOpenCommentsModal = useCallback(() => {
    setShowCommentsModal(true);
  }, []);

  const handleOpenSettingsModal = useCallback(() => {
    setShowSettingsModal(true);
  }, []);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: false,
      headerStyle: {
        backgroundColor: theme.backgroundSecondary,
      },
      headerShadowVisible: false,
      headerTitle: () => null,
      headerLeft: () => (
        <Pressable 
          onPress={handleGoBack} 
          style={styles.headerIconButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true, radius: 24 }}
          accessibilityLabel="Tutup"
          accessibilityRole="button"
        >
          <XIcon size={24} color={theme.text} />
        </Pressable>
      ),
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <Pressable 
            onPress={handleOpenChaptersModal}
            style={styles.headerIconButton}
            hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
            android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true, radius: 24 }}
            accessibilityLabel="Daftar Chapter"
            accessibilityRole="button"
          >
            <ListIcon size={22} color={theme.text} />
          </Pressable>
          <Pressable 
            onPress={handleOpenCommentsModal}
            style={styles.headerIconButton}
            hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
            android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true, radius: 24 }}
            accessibilityLabel="Komentar"
            accessibilityRole="button"
          >
            <MessageCircleIcon size={22} color={theme.text} />
            {comments.filter(c => !c.parentCommentId).length > 0 ? (
              <View style={[styles.headerBadge, { backgroundColor: theme.primary }]} pointerEvents="none">
                <ThemedText style={styles.headerBadgeText}>
                  {comments.filter(c => !c.parentCommentId).length > 99 ? '99+' : comments.filter(c => !c.parentCommentId).length}
                </ThemedText>
              </View>
            ) : null}
          </Pressable>
          <Pressable 
            onPress={handleOpenSettingsModal}
            style={styles.headerIconButton}
            hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
            android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true, radius: 24 }}
            accessibilityLabel="Pengaturan Bacaan"
            accessibilityRole="button"
          >
            <TypeIcon size={22} color={theme.text} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, theme, comments, handleGoBack, handleOpenChaptersModal, handleOpenCommentsModal, handleOpenSettingsModal]);

  async function loadChapterData() {
    setIsLoading(true);
    try {
      const [fetchedChapters, fetchedChapter] = await Promise.all([
        getChaptersForNovel(novelId),
        getChapter(chapterId),
      ]);
      
      if (!fetchedChapter) {
        console.error('Chapter not found:', chapterId);
        setCurrentChapter(null);
        setIsLoading(false);
        return;
      }
      
      setChapters(fetchedChapters);
      setCurrentChapter(fetchedChapter);
    } catch (error) {
      console.error('Error loading chapter:', error);
      setCurrentChapter(null);
    } finally {
      setIsLoading(false);
    }
  }


  if (!novel || isLoading) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  if (!currentChapter) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: Spacing.xl }]}>
        <AlertCircleIcon size={64} color={theme.warning} />
        <ThemedText style={[Typography.h2, { marginTop: Spacing.xl, textAlign: 'center' }]}>
          Chapter Tidak Ditemukan
        </ThemedText>
        <ThemedText style={[{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: 'center' }]}>
          Chapter ini tidak dapat dimuat. Silakan coba lagi nanti.
        </ThemedText>
        <Button onPress={() => navigation.goBack()} style={{ marginTop: Spacing.xl }}>
          Kembali
        </Button>
      </ThemedView>
    );
  }

  // Author, Admin, Editor always have access to chapters (bypass lock)
  const isAuthor = user?.id === novel.authorId;
  const isAdminOrEditor = user?.role === 'super_admin' || user?.role === 'co_admin' || user?.role === 'editor';
  const isUnlocked = currentChapter.isFree || unlockedChapters.has(chapterId) || isAuthor || isAdminOrEditor;
  const currentIndex = chapters.findIndex(c => c.id === chapterId);
  const hasNext = currentIndex >= 0 && currentIndex < chapters.length - 1;
  const hasPrev = currentIndex > 0;

  const handleUnlock = async () => {
    if (!user || user.coinBalance < novel.coinPerChapter) {
      alert("Koin tidak cukup");
      return;
    }

    await unlockChapter(chapterId, novel.coinPerChapter);
    await updateCoinBalance(-novel.coinPerChapter);
  };

  const goToPrevChapter = () => {
    if (hasPrev && chapters[currentIndex - 1]) {
      navigation.setParams({ chapterId: chapters[currentIndex - 1].id } as any);
    }
  };

  const goToNextChapter = () => {
    if (hasNext && chapters[currentIndex + 1]) {
      navigation.setParams({ chapterId: chapters[currentIndex + 1].id } as any);
    }
  };

  if (!isUnlocked) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.lockedContainer, { paddingTop: insets.top }]}>
          <LockIcon size={64} color={theme.warning} />
          <ThemedText style={[Typography.h2, { marginTop: Spacing.xl }]}>
            Chapter Terkunci
          </ThemedText>
          <ThemedText style={[styles.lockedText, { color: theme.textSecondary, marginTop: Spacing.md }]}>
            Buka chapter ini dengan {novel.coinPerChapter} koin
          </ThemedText>
          <Button onPress={handleUnlock} style={styles.unlockButton}>
            Buka dengan {novel.coinPerChapter} koin
          </Button>
          <ThemedText style={[styles.balance, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
            Saldo kamu: {user?.coinBalance || 0} koin
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Spacing.lg,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        overScrollMode="never"
        bounces={Platform.OS === 'ios'}
        decelerationRate={Platform.OS === 'ios' ? 'normal' : 0.985}
      >
        <ThemedText style={[styles.chapterTitle, Typography.h3]}>
          {currentChapter.title}
        </ThemedText>
        <MarkdownText style={[styles.chapterContent, { fontSize, lineHeight: fontSize * 1.8, fontFamily }]}>
          {currentChapter.content}
        </MarkdownText>

        <View style={styles.chapterEndDivider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.textMuted }]} />
          <ThemedText style={[styles.dividerText, { color: theme.textMuted }]}>
            Akhir Chapter {currentChapter.chapterNumber}
          </ThemedText>
          <View style={[styles.dividerLine, { backgroundColor: theme.textMuted }]} />
        </View>

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.backgroundRoot }]}>
        <Pressable
          onPress={goToPrevChapter}
          disabled={!hasPrev}
          style={({ pressed }) => [
            styles.navButtonWide,
            { backgroundColor: hasPrev ? theme.primary : theme.backgroundSecondary },
            !hasPrev && styles.disabledButton,
            pressed && hasPrev && { opacity: 0.8 },
          ]}
        >
          <ChevronLeftIcon size={18} color={hasPrev ? "#FFFFFF" : theme.textMuted} />
          <ThemedText style={[styles.navButtonText, { color: hasPrev ? "#FFFFFF" : theme.textMuted }]}>
            Sebelumnya
          </ThemedText>
        </Pressable>

        <View style={styles.chapterIndicator}>
          <ThemedText style={[styles.chapterNumber, { color: theme.textSecondary }]}>
            {currentChapter.chapterNumber}
          </ThemedText>
          <ThemedText style={[styles.chapterTotal, { color: theme.textMuted }]}>
            / {novel.totalChapters}
          </ThemedText>
        </View>

        <Pressable
          onPress={goToNextChapter}
          disabled={!hasNext}
          style={({ pressed }) => [
            styles.navButtonWide,
            { backgroundColor: hasNext ? theme.primary : theme.backgroundSecondary },
            !hasNext && styles.disabledButton,
            pressed && hasNext && { opacity: 0.8 },
          ]}
        >
          <ThemedText style={[styles.navButtonText, { color: hasNext ? "#FFFFFF" : theme.textMuted }]}>
            Selanjutnya
          </ThemedText>
          <ChevronRightIcon size={18} color={hasNext ? "#FFFFFF" : theme.textMuted} />
        </Pressable>
      </View>

      <Modal
        visible={showCommentsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowCommentsModal(false);
          setReplyingTo(null);
          setNewComment("");
        }}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.backgroundSecondary }]}>
              <ThemedText style={styles.modalTitle}>Komentar</ThemedText>
              <Pressable
                onPress={() => {
                  setShowCommentsModal(false);
                  setReplyingTo(null);
                  setNewComment("");
                }}
                style={styles.modalCloseButton}
              >
                <XIcon size={24} color={theme.text} />
              </Pressable>
            </View>

            <FlatList
              data={comments.filter(c => !c.parentCommentId)}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.commentsListModal}
              ListEmptyComponent={
                commentsLoading ? (
                  <View style={styles.commentsLoading}>
                    <ActivityIndicator size="small" color={theme.primary} />
                  </View>
                ) : (
                  <View style={styles.noComments}>
                    <MessageCircleIcon size={48} color={theme.textMuted} />
                    <ThemedText style={[styles.noCommentsText, { color: theme.textSecondary }]}>
                      Belum ada komentar
                    </ThemedText>
                    <ThemedText style={[styles.noCommentsSubtext, { color: theme.textMuted }]}>
                      Jadilah yang pertama berkomentar!
                    </ThemedText>
                  </View>
                )
              }
              renderItem={({ item: comment }) => (
                <View style={styles.commentThread}>
                  <View style={[styles.commentCard, { backgroundColor: theme.backgroundSecondary }]}>
                    <View style={[styles.commentAvatar, { backgroundColor: theme.primary + '20' }]}>
                      {comment.userAvatar ? (
                        <Image source={{ uri: comment.userAvatar }} style={styles.commentAvatarImage} />
                      ) : (
                        <UserIcon size={18} color={theme.primary} />
                      )}
                    </View>
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <ThemedText style={styles.commentUserName}>{comment.userName}</ThemedText>
                        <ThemedText style={[styles.commentTime, { color: theme.textMuted }]}>
                          {formatTimeAgo(comment.createdAt)}
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.commentText, { color: theme.textSecondary }]}>
                        {comment.content}
                      </ThemedText>
                      <View style={styles.commentActions}>
                        {user ? (
                          <Pressable
                            onPress={() => setReplyingTo(comment)}
                            style={styles.replyButton}
                          >
                            <ThemedText style={[styles.replyButtonText, { color: theme.primary }]}>
                              Balas
                            </ThemedText>
                          </Pressable>
                        ) : null}
                        {comment.repliesCount > 0 ? (
                          <Pressable
                            onPress={() => {
                              setExpandedReplies(prev => {
                                const next = new Set(prev);
                                if (next.has(comment.id)) {
                                  next.delete(comment.id);
                                } else {
                                  next.add(comment.id);
                                }
                                return next;
                              });
                            }}
                            style={styles.viewRepliesButton}
                          >
                            <ThemedText style={[styles.viewRepliesText, { color: theme.textMuted }]}>
                              {expandedReplies.has(comment.id) ? 'Sembunyikan' : `${comment.repliesCount} balasan`}
                            </ThemedText>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                    {user && parseInt(user.id) === comment.userId ? (
                      <Pressable
                        onPress={() => deleteComment(comment.id)}
                        style={styles.deleteButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <TrashIcon size={16} color={theme.error} />
                      </Pressable>
                    ) : null}
                  </View>

                  {expandedReplies.has(comment.id) ? (
                    <View style={styles.repliesContainer}>
                      {comments
                        .filter(c => c.parentCommentId === comment.id)
                        .map(reply => (
                          <View key={reply.id} style={[styles.replyCard, { backgroundColor: theme.backgroundSecondary }]}>
                            <View style={[styles.commentAvatarSmall, { backgroundColor: theme.primary + '20' }]}>
                              {reply.userAvatar ? (
                                <Image source={{ uri: reply.userAvatar }} style={styles.commentAvatarImage} />
                              ) : (
                                <UserIcon size={14} color={theme.primary} />
                              )}
                            </View>
                            <View style={styles.commentContent}>
                              <View style={styles.commentHeader}>
                                <ThemedText style={[styles.commentUserName, { fontSize: 12 }]}>{reply.userName}</ThemedText>
                                <ThemedText style={[styles.commentTime, { color: theme.textMuted }]}>
                                  {formatTimeAgo(reply.createdAt)}
                                </ThemedText>
                              </View>
                              <ThemedText style={[styles.commentText, { color: theme.textSecondary, fontSize: 13 }]}>
                                {reply.content}
                              </ThemedText>
                            </View>
                            {user && parseInt(user.id) === reply.userId ? (
                              <Pressable
                                onPress={() => deleteComment(reply.id)}
                                style={styles.deleteButton}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              >
                                <TrashIcon size={14} color={theme.error} />
                              </Pressable>
                            ) : null}
                          </View>
                        ))}
                    </View>
                  ) : null}
                </View>
              )}
            />

            {user ? (
              <Animated.View style={[styles.commentInputContainer, { backgroundColor: theme.backgroundSecondary, borderTopColor: theme.backgroundSecondary }, commentInputAnimatedStyle]}>
                {replyingTo ? (
                  <View style={styles.replyingToBar}>
                    <ThemedText style={[styles.replyingToText, { color: theme.textMuted }]} numberOfLines={1}>
                      Membalas {replyingTo.userName}
                    </ThemedText>
                    <Pressable onPress={() => setReplyingTo(null)}>
                      <XIcon size={16} color={theme.textMuted} />
                    </Pressable>
                  </View>
                ) : null}
                <View style={styles.commentInputRow}>
                  <View style={[styles.commentAvatarSmall, { backgroundColor: theme.primary + '30' }]}>
                    {user.avatarUrl ? (
                      <Image source={{ uri: user.avatarUrl }} style={styles.commentAvatarImage} />
                    ) : (
                      <UserIcon size={16} color={theme.primary} />
                    )}
                  </View>
                  <TextInput
                    style={[styles.commentInput, { color: theme.text, backgroundColor: theme.backgroundRoot }]}
                    placeholder={replyingTo ? "Tulis balasan..." : "Tulis komentar..."}
                    placeholderTextColor={theme.textMuted}
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                    maxLength={500}
                  />
                  <Pressable
                    onPress={async () => {
                      if (!newComment.trim()) return;
                      setSubmittingComment(true);
                      try {
                        const insertData: any = {
                          user_id: parseInt(user.id),
                          chapter_id: parseInt(chapterId),
                          novel_id: parseInt(novelId),
                          content: newComment.trim(),
                        };
                        if (replyingTo) {
                          insertData.parent_comment_id = replyingTo.id;
                        }
                        const { error } = await supabase.from('chapter_comments').insert(insertData);
                        if (error) throw error;
                        if (replyingTo) {
                          await supabase.rpc('increment_comment_replies', { comment_id: replyingTo.id });
                          setExpandedReplies(prev => new Set(prev).add(replyingTo.id));
                        }
                        setNewComment("");
                        setReplyingTo(null);
                        Keyboard.dismiss();
                        await loadComments();
                      } catch (error) {
                        console.error('Error submitting comment:', error);
                      } finally {
                        setSubmittingComment(false);
                      }
                    }}
                    disabled={!newComment.trim() || submittingComment}
                    style={({ pressed }) => [
                      styles.sendButton,
                      { backgroundColor: newComment.trim() ? theme.primary : theme.backgroundRoot },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    {submittingComment ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <SendIcon size={18} color={newComment.trim() ? "#FFFFFF" : theme.textMuted} />
                    )}
                  </Pressable>
                </View>
              </Animated.View>
            ) : (
              <View style={[styles.loginPromptModal, { backgroundColor: theme.backgroundSecondary }]}>
                <ThemedText style={[styles.loginPromptText, { color: theme.textSecondary }]}>
                  Login untuk berkomentar
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSettingsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <Pressable 
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={() => setShowSettingsModal(false)}
        >
          <Pressable 
            style={[styles.settingsModalContainer, { backgroundColor: theme.backgroundRoot }]}
            onPress={() => {}}
          >
            <View style={[styles.modalHeader, { borderBottomColor: theme.backgroundSecondary }]}>
              <ThemedText style={styles.modalTitle}>Pengaturan Bacaan</ThemedText>
              <Pressable
                onPress={() => setShowSettingsModal(false)}
                style={styles.modalCloseButton}
              >
                <XIcon size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.settingsContent}>
              <View style={styles.settingSection}>
                <ThemedText style={[styles.settingLabel, { color: theme.textSecondary }]}>
                  Ukuran Huruf
                </ThemedText>
                <View style={styles.fontSizeControls}>
                  {FONT_SIZES.map((size) => (
                    <Pressable
                      key={size}
                      onPress={() => handleFontSizeChange(size)}
                      style={[
                        styles.fontSizeButton,
                        { 
                          backgroundColor: fontSize === size ? theme.primary : theme.backgroundSecondary,
                          borderColor: fontSize === size ? theme.primary : theme.backgroundSecondary,
                        },
                      ]}
                    >
                      <ThemedText style={[
                        styles.fontSizeButtonText,
                        { color: fontSize === size ? '#FFFFFF' : theme.text }
                      ]}>
                        {size}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.settingSection}>
                <ThemedText style={[styles.settingLabel, { color: theme.textSecondary }]}>
                  Jenis Huruf
                </ThemedText>
                <View style={styles.fontFamilyControls}>
                  {FONT_FAMILIES.map((font) => (
                    <Pressable
                      key={font.id}
                      onPress={() => handleFontFamilyChange(font.fontFamily)}
                      style={[
                        styles.fontFamilyButton,
                        { 
                          backgroundColor: fontFamily === font.fontFamily ? theme.primary : theme.backgroundSecondary,
                        },
                      ]}
                    >
                      <ThemedText style={[
                        styles.fontFamilyButtonText,
                        { 
                          color: fontFamily === font.fontFamily ? '#FFFFFF' : theme.text,
                          fontFamily: font.fontFamily,
                        }
                      ]}>
                        {font.name}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={[styles.previewSection, { backgroundColor: theme.backgroundSecondary }]}>
                <ThemedText style={[styles.previewLabel, { color: theme.textMuted }]}>
                  Pratinjau
                </ThemedText>
                <ThemedText style={[styles.previewText, { fontSize, fontFamily, color: theme.text }]} numberOfLines={3}>
                  {currentChapter?.content?.split('\n').find(p => p.trim().length > 0)?.trim() || 'Tidak ada konten tersedia.'}
                </ThemedText>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showChaptersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChaptersModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.backgroundSecondary }]}>
              <View>
                <ThemedText style={styles.modalTitle}>Daftar Chapter</ThemedText>
                {novel ? (
                  <ThemedText style={[styles.chaptersModalSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                    {novel.title}
                  </ThemedText>
                ) : null}
              </View>
              <Pressable
                onPress={() => setShowChaptersModal(false)}
                style={styles.modalCloseButton}
              >
                <XIcon size={24} color={theme.text} />
              </Pressable>
            </View>

            <FlatList
              data={chapters}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chaptersListModal}
              renderItem={({ item: chapter }) => {
                const isCurrentChapter = chapter.id === chapterId;
                const isUnlocked = chapter.isFree || unlockedChapters.has(chapter.id);
                
                return (
                  <Pressable
                    onPress={() => {
                      if (isUnlocked && chapter.id !== chapterId) {
                        setShowChaptersModal(false);
                        navigation.setParams({ chapterId: chapter.id } as any);
                        setCurrentChapter(null);
                        setIsLoading(true);
                      }
                    }}
                    disabled={!isUnlocked}
                    style={({ pressed }) => [
                      styles.chapterListItem,
                      { backgroundColor: isCurrentChapter ? theme.primary + '20' : theme.backgroundSecondary },
                      pressed && isUnlocked && { opacity: 0.7 },
                    ]}
                  >
                    <View style={styles.chapterListItemContent}>
                      <View style={styles.chapterListItemLeft}>
                        <View style={[
                          styles.chapterNumberBadge,
                          { backgroundColor: isCurrentChapter ? theme.primary : theme.backgroundRoot }
                        ]}>
                          <ThemedText style={[
                            styles.chapterNumberText,
                            { color: isCurrentChapter ? '#FFFFFF' : theme.text }
                          ]}>
                            {chapter.chapterNumber}
                          </ThemedText>
                        </View>
                        <View style={styles.chapterListItemInfo}>
                          <ThemedText 
                            style={[
                              styles.chapterListItemTitle,
                              isCurrentChapter && { color: theme.primary }
                            ]} 
                            numberOfLines={1}
                          >
                            {chapter.title}
                          </ThemedText>
                          {!isUnlocked && novel ? (
                            <View style={styles.chapterLockedRow}>
                              <LockSmallIcon size={12} color={theme.textMuted} />
                              <ThemedText style={[styles.chapterPriceText, { color: theme.textMuted }]}>
                                {novel.coinPerChapter} Novoin
                              </ThemedText>
                            </View>
                          ) : null}
                        </View>
                      </View>
                      {isCurrentChapter ? (
                        <View style={[styles.currentBadge, { backgroundColor: theme.primary }]}>
                          <ThemedText style={styles.currentBadgeText}>Dibaca</ThemedText>
                        </View>
                      ) : !isUnlocked ? (
                        <LockSmallIcon size={18} color={theme.textMuted} />
                      ) : (
                        <ChevronRightIcon size={18} color={theme.textMuted} />
                      )}
                    </View>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  headerTitleContainer: {
    alignItems: "center",
    maxWidth: "50%",
    paddingHorizontal: Spacing.sm,
  },
  headerNovelTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  headerChapterTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  chapterTitle: {
    marginBottom: Spacing.xl,
  },
  chapterContent: {
    lineHeight: 32,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
    gap: Spacing.sm,
  },
  navButtonWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 48,
    flex: 1,
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
  chapterIndicator: {
    flexDirection: "row",
    alignItems: "baseline",
    paddingHorizontal: Spacing.sm,
  },
  chapterNumber: {
    fontSize: 18,
    fontWeight: "700",
  },
  chapterTotal: {
    fontSize: 14,
  },
  lockedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing["3xl"],
  },
  lockedText: {
    fontSize: 16,
    textAlign: "center",
  },
  unlockButton: {
    marginTop: Spacing.xl,
    minWidth: 200,
  },
  balance: {
    fontSize: 14,
  },
  chapterEndDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing["3xl"],
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "500",
  },
  commentsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  commentsToggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  commentsBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    alignItems: "center",
  },
  commentsBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  commentsSection: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  commentInputContainer: {
    flexDirection: "column",
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  commentAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  loginPrompt: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  loginPromptText: {
    fontSize: 14,
  },
  commentsLoading: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
  },
  noComments: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
    gap: Spacing.sm,
  },
  noCommentsText: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
  noCommentsSubtext: {
    fontSize: 13,
  },
  commentsList: {
    gap: Spacing.sm,
  },
  commentCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  commentAvatarImage: {
    width: "100%",
    height: "100%",
  },
  commentContent: {
    flex: 1,
    gap: 4,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  commentUserName: {
    fontSize: 13,
    fontWeight: "600",
  },
  commentTime: {
    fontSize: 11,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    padding: Spacing.xs,
    alignSelf: "flex-start",
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerIconButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  headerBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  headerBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContainer: {
    height: "80%",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  settingsModalContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing["3xl"],
    borderRadius: BorderRadius.xl,
    maxHeight: "60%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  commentsListModal: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  commentThread: {
    gap: Spacing.sm,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  replyButton: {
    paddingVertical: Spacing.xs,
  },
  replyButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
  viewRepliesButton: {
    paddingVertical: Spacing.xs,
  },
  viewRepliesText: {
    fontSize: 12,
  },
  repliesContainer: {
    marginLeft: Spacing["2xl"],
    gap: Spacing.sm,
  },
  replyCard: {
    flexDirection: "row",
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  replyingToBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  replyingToText: {
    fontSize: 12,
    flex: 1,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  loginPromptModal: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  settingsContent: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  settingSection: {
    gap: Spacing.md,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  fontSizeControls: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  fontSizeButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 44,
    alignItems: "center",
  },
  fontSizeButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  fontFamilyControls: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  fontFamilyButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  fontFamilyButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  previewSection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  previewLabel: {
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  previewText: {
    lineHeight: 28,
  },
  chaptersModalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  chaptersListModal: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  chapterListItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  chapterListItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chapterListItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  chapterNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  chapterNumberText: {
    fontSize: 14,
    fontWeight: "700",
  },
  chapterListItemInfo: {
    flex: 1,
    gap: 2,
  },
  chapterListItemTitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  chapterLockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chapterPriceText: {
    fontSize: 11,
  },
  currentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
