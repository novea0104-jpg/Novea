import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, ActivityIndicator } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { Chapter } from "@/types/models";

export default function ReaderScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { novels, unlockedChapters, unlockChapter, getChaptersForNovel, getChapter } = useApp();
  const { user, updateCoinBalance } = useAuth();

  const { novelId, chapterId } = route.params as { novelId: string; chapterId: string };
  const novel = novels.find((n) => n.id === novelId);

  const [showHeader, setShowHeader] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChapterData();
  }, [chapterId, novelId]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: showHeader,
      headerTransparent: true,
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={() => {}}>
          <Feather name="settings" size={24} color={theme.text} />
        </Pressable>
      ),
    });
  }, [navigation, showHeader, theme]);

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
        <Feather name="alert-circle" size={64} color={theme.warning} />
        <ThemedText style={[Typography.h2, { marginTop: Spacing.xl, textAlign: 'center' }]}>
          Chapter Not Found
        </ThemedText>
        <ThemedText style={[{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: 'center' }]}>
          This chapter could not be loaded. Please try again later.
        </ThemedText>
        <Button onPress={() => navigation.goBack()} style={{ marginTop: Spacing.xl }}>
          Go Back
        </Button>
      </ThemedView>
    );
  }

  const isUnlocked = currentChapter.isFree || unlockedChapters.has(chapterId);
  const currentIndex = chapters.findIndex(c => c.id === chapterId);
  const hasNext = currentIndex >= 0 && currentIndex < chapters.length - 1;
  const hasPrev = currentIndex > 0;

  const handleUnlock = async () => {
    if (!user || user.coinBalance < novel.coinPerChapter) {
      alert("Insufficient coins");
      return;
    }

    await unlockChapter(chapterId, novel.coinPerChapter);
    await updateCoinBalance(-novel.coinPerChapter);
    setShowUnlockModal(false);
  };

  if (!isUnlocked) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.lockedContainer, { paddingTop: insets.top }]}>
          <Feather name="lock" size={64} color={theme.warning} />
          <ThemedText style={[Typography.h2, { marginTop: Spacing.xl }]}>
            Chapter Locked
          </ThemedText>
          <ThemedText style={[styles.lockedText, { color: theme.textSecondary, marginTop: Spacing.md }]}>
            Unlock this chapter for {novel.coinPerChapter} coins
          </ThemedText>
          <Button onPress={handleUnlock} style={styles.unlockButton}>
            Unlock for {novel.coinPerChapter} coins
          </Button>
          <ThemedText style={[styles.balance, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
            Your balance: {user?.coinBalance || 0} coins
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Pressable onPress={() => setShowHeader(!showHeader)} style={styles.tapArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: showHeader ? insets.top + 60 : insets.top + Spacing.xl,
              paddingBottom: insets.bottom + 80,
            },
          ]}
        >
          <ThemedText style={[styles.chapterTitle, Typography.h3]}>
            {currentChapter.title}
          </ThemedText>
          <ThemedText style={[styles.chapterContent, { fontSize }]}>
            {currentChapter.content}
          </ThemedText>
        </ScrollView>
      </Pressable>

      <View style={[styles.footer, { bottom: insets.bottom, backgroundColor: theme.backgroundRoot }]}>
        <Button
          onPress={() => {
            if (hasPrev) {
              navigation.setParams({ chapterId: chapters[currentIndex - 1].id } as any);
            }
          }}
          style={[styles.navButton, !hasPrev && styles.disabledButton]}
          disabled={!hasPrev}
        >
          <Feather name="chevron-left" size={20} color={hasPrev ? "#FFFFFF" : theme.textMuted} />
        </Button>
        <ThemedText style={{ color: theme.textSecondary }}>
          {currentChapter.chapterNumber} / {novel.totalChapters}
        </ThemedText>
        <Button
          onPress={() => {
            if (hasNext) {
              navigation.setParams({ chapterId: chapters[currentIndex + 1].id } as any);
            }
          }}
          style={[styles.navButton, !hasNext && styles.disabledButton]}
          disabled={!hasNext}
        >
          <Feather name="chevron-right" size={20} color={hasNext ? "#FFFFFF" : theme.textMuted} />
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tapArea: {
    flex: 1,
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
    lineHeight: 28,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  navButton: {
    minWidth: 48,
    paddingHorizontal: Spacing.md,
  },
  disabledButton: {
    opacity: 0.3,
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
});
