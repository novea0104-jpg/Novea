import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform, NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { XIcon } from "@/components/icons/XIcon";
import { AlertCircleIcon } from "@/components/icons/AlertCircleIcon";
import { LockIcon } from "@/components/icons/LockIcon";
import { ChevronLeftIcon } from "@/components/icons/ChevronLeftIcon";
import { ChevronRightIcon } from "@/components/icons/ChevronRightIcon";
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
  const scrollViewRef = useRef<ScrollView>(null);

  const { novelId, chapterId } = route.params as { novelId: string; chapterId: string };
  const novel = novels.find((n) => n.id === novelId);

  const [showHeader, setShowHeader] = useState(true);
  const [fontSize, setFontSize] = useState(18);
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
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerNovelTitle} numberOfLines={1}>
            {novel?.title || ""}
          </ThemedText>
          {currentChapter ? (
            <ThemedText style={[styles.headerChapterTitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {currentChapter.title}
            </ThemedText>
          ) : null}
        </View>
      ),
      headerLeft: () => (
        <Pressable 
          onPress={() => navigation.goBack()} 
          style={styles.headerButton}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true, radius: 24 }}
        >
          <XIcon size={24} color={theme.text} />
        </Pressable>
      ),
      headerRight: () => null,
    });
  }, [navigation, showHeader, theme, novel, currentChapter]);

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

  const toggleHeader = () => {
    setShowHeader(prev => !prev);
  };

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isScrollingRef = useRef(false);

  const handleTouchStart = (e: any) => {
    const touch = e.nativeEvent;
    touchStartRef.current = {
      x: touch.pageX,
      y: touch.pageY,
      time: Date.now(),
    };
    isScrollingRef.current = false;
  };

  const handleTouchEnd = (e: any) => {
    if (!touchStartRef.current || isScrollingRef.current) return;

    const touch = e.nativeEvent;
    const deltaX = Math.abs(touch.pageX - touchStartRef.current.x);
    const deltaY = Math.abs(touch.pageY - touchStartRef.current.y);
    const deltaTime = Date.now() - touchStartRef.current.time;

    if (deltaX < 10 && deltaY < 10 && deltaTime < 200) {
      toggleHeader();
    }

    touchStartRef.current = null;
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    isScrollingRef.current = true;
  };

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

  const isUnlocked = currentChapter.isFree || unlockedChapters.has(chapterId);
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
            paddingTop: showHeader ? insets.top + 80 : insets.top + Spacing.xl,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        overScrollMode="never"
        bounces={Platform.OS === 'ios'}
        decelerationRate={Platform.OS === 'ios' ? 'normal' : 0.985}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onScroll={handleScroll}
      >
        <ThemedText style={[styles.chapterTitle, Typography.h3]}>
          {currentChapter.title}
        </ThemedText>
        <ThemedText style={[styles.chapterContent, { fontSize, lineHeight: fontSize * 1.8 }]}>
          {currentChapter.content}
        </ThemedText>
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
    flex: 1,
    paddingHorizontal: Spacing.md,
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
});
