import React, { useState, useCallback } from "react";
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { Edit2Icon } from "@/components/icons/Edit2Icon";
import { BookOpenIcon } from "@/components/icons/BookOpenIcon";
import { ChevronRightIcon } from "@/components/icons/ChevronRightIcon";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/utils/supabase";
import { Spacing, BorderRadius, Typography, GradientColors } from "@/constants/theme";

interface Chapter {
  id: number;
  title: string;
  chapter_number: number;
  word_count: number;
  is_free: boolean;
  published_at: string;
}

export default function ManageNovelScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { novels } = useApp();

  const { novelId } = route.params as { novelId: string };
  const novel = novels.find((n) => n.id === novelId);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const novelIdNum = parseInt(novelId, 10);

  const loadChapters = useCallback(async () => {
    if (isNaN(novelIdNum)) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('id, title, chapter_number, word_count, is_free, published_at')
        .eq('novel_id', novelIdNum)
        .order('chapter_number', { ascending: true });

      if (error) throw error;

      setChapters(data || []);
    } catch (error) {
      console.error('Error loading chapters:', error);
    } finally {
      setIsLoading(false);
    }
  }, [novelIdNum]);

  useFocusEffect(
    useCallback(() => {
      loadChapters();
    }, [loadChapters])
  );

  if (!novel) return null;

  const renderChapter = ({ item }: { item: Chapter }) => (
    <Pressable
      onPress={() => navigation.navigate("EditChapter", { novelId, chapterId: item.id.toString() })}
      style={({ pressed }) => [
        styles.chapterItem,
        { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.chapterLeft}>
        <View style={styles.chapterHeader}>
          <ThemedText style={styles.chapterTitle}>{item.title}</ThemedText>
          {item.is_free && (
            <View style={[styles.freeBadge, { backgroundColor: theme.success + '20' }]}>
              <ThemedText style={[styles.freeBadgeText, { color: theme.success }]}>
                Gratis
              </ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={[styles.chapterMeta, { color: theme.textSecondary }]}>
          {item.word_count.toLocaleString()} kata
        </ThemedText>
      </View>
      <ChevronRightIcon size={20} color={theme.textMuted} />
    </Pressable>
  );

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ThemedText style={[Typography.h2, styles.novelTitle]}>{novel.title}</ThemedText>
          <ThemedText style={[styles.chapterCount, { color: theme.textSecondary }]}>
            {chapters.length} Chapter
          </ThemedText>
        </View>
        <Pressable
          onPress={() => navigation.navigate("EditNovel", { novelId })}
          style={({ pressed }) => [
            styles.editButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <LinearGradient
            colors={GradientColors.purplePink.colors}
            start={GradientColors.purplePink.start}
            end={GradientColors.purplePink.end}
            style={styles.editButtonGradient}
          >
            <Edit2Icon size={16} color="#FFFFFF" />
            <ThemedText style={styles.editButtonText}>Edit Novel</ThemedText>
          </LinearGradient>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : chapters.length === 0 ? (
        <View style={styles.emptyContainer}>
          <BookOpenIcon size={48} color={theme.textMuted} />
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Belum ada chapter
          </ThemedText>
          <ThemedText style={[styles.emptyHint, { color: theme.textMuted }]}>
            Tap tombol + untuk menambah chapter pertama
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={chapters}
          renderItem={renderChapter}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.chapterList}
        />
      )}

      <FloatingActionButton
        onPress={() => navigation.navigate("EditChapter", { novelId, chapterId: undefined })}
        icon="plus"
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  novelTitle: {
    marginBottom: Spacing.xs,
  },
  chapterCount: {
    fontSize: 14,
  },
  editButton: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  editButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    paddingVertical: Spacing["2xl"],
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: Spacing["2xl"],
    alignItems: "center",
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
  },
  emptyHint: {
    fontSize: 14,
    textAlign: "center",
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
  chapterHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  freeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  chapterMeta: {
    fontSize: 12,
  },
});
