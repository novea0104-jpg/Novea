import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, ActivityIndicator, FlatList } from "react-native";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { PlusIcon } from "@/components/icons/PlusIcon";
import { FileTextIcon } from "@/components/icons/FileTextIcon";
import { TypeIcon } from "@/components/icons/TypeIcon";
import { CalendarIcon } from "@/components/icons/CalendarIcon";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/utils/supabase";
import { Spacing, Typography, BorderRadius, GradientColors } from "@/constants/theme";
import type { Chapter } from "@/types/models";

type ManageChaptersRouteParams = {
  ManageChapters: {
    novelId: string;
  };
};

export default function ManageChaptersScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ManageChaptersRouteParams, 'ManageChapters'>>();
  const { novelId } = route.params;

  const [novelTitle, setNovelTitle] = useState("");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadChapters();
    }, [novelId])
  );

  async function loadChapters() {
    setIsLoading(true);
    try {
      const { data: novelData, error: novelError } = await supabase
        .from('novels')
        .select('title')
        .eq('id', parseInt(novelId))
        .single();

      if (novelError) throw novelError;
      setNovelTitle(novelData.title);

      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('novel_id', parseInt(novelId))
        .order('chapter_number', { ascending: true });

      if (chaptersError) throw chaptersError;

      const mappedChapters: Chapter[] = (chaptersData || []).map((c: any) => ({
        id: c.id.toString(),
        novelId: c.novel_id.toString(),
        chapterNumber: c.chapter_number,
        title: c.title,
        content: c.content,
        isFree: c.is_free,
        isUnlocked: false,
        publishedAt: new Date(c.published_at),
        wordCount: c.word_count,
      }));

      setChapters(mappedChapters);
    } catch (error) {
      console.error('Error loading chapters:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreateChapter() {
    const nextChapterNumber = chapters.length + 1;
    (navigation as any).navigate('CreateChapter', {
      novelId,
      chapterNumber: nextChapterNumber,
    });
  }

  return (
    <ScreenScrollView>
      <View style={styles.container}>
        <Card elevation={1} style={styles.headerCard}>
          <ThemedText style={Typography.h2} numberOfLines={2}>
            {novelTitle}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {chapters.length} chapter dipublish
          </ThemedText>

          <Pressable onPress={handleCreateChapter} style={styles.createButton}>
            <LinearGradient
              colors={GradientColors.purplePink.colors}
              start={GradientColors.purplePink.start}
              end={GradientColors.purplePink.end}
              style={styles.createButtonGradient}
            >
              <PlusIcon size={20} color="#FFFFFF" />
              <ThemedText style={styles.createButtonText}>Tambah Chapter</ThemedText>
            </LinearGradient>
          </Pressable>
        </Card>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={GradientColors.purplePink.colors[0]} />
          </View>
        ) : chapters.length === 0 ? (
          <Card elevation={1} style={styles.emptyCard}>
            <FileTextIcon size={48} color={theme.textMuted} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Belum ada chapter. Tambah chapter pertama sekarang!
            </ThemedText>
          </Card>
        ) : (
          <View style={styles.chaptersList}>
            {chapters.map((chapter) => (
              <ChapterCard key={chapter.id} chapter={chapter} theme={theme} />
            ))}
          </View>
        )}
      </View>
    </ScreenScrollView>
  );
}

function ChapterCard({ chapter, theme }: { chapter: Chapter; theme: any }) {
  return (
    <Card elevation={1} style={styles.chapterCard}>
      <View style={styles.chapterHeader}>
        <ThemedText style={Typography.h3}>
          Chapter {chapter.chapterNumber}
        </ThemedText>
        <View style={[styles.badge, chapter.isFree ? styles.badgeFree : styles.badgePaid]}>
          <ThemedText style={styles.badgeText}>
            {chapter.isFree ? "Gratis" : "Berbayar"}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={styles.chapterTitle} numberOfLines={2}>
        {chapter.title}
      </ThemedText>

      <View style={styles.chapterStats}>
        <View style={styles.chapterStat}>
          <TypeIcon size={14} color={theme.textSecondary} />
          <ThemedText style={[styles.chapterStatText, { color: theme.textSecondary }]}>
            {chapter.wordCount} kata
          </ThemedText>
        </View>
        <View style={styles.chapterStat}>
          <CalendarIcon size={14} color={theme.textSecondary} />
          <ThemedText style={[styles.chapterStatText, { color: theme.textSecondary }]}>
            {new Date(chapter.publishedAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </ThemedText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.xl,
  },
  headerCard: {
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  subtitle: {
    fontSize: 14,
  },
  createButton: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginTop: Spacing.sm,
  },
  createButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingContainer: {
    paddingVertical: Spacing["3xl"],
    alignItems: "center",
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
  },
  chaptersList: {
    gap: Spacing.md,
  },
  chapterCard: {
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  chapterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  badgeFree: {
    backgroundColor: "#10b981",
  },
  badgePaid: {
    backgroundColor: "#f59e0b",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  chapterTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  chapterStats: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.xs,
  },
  chapterStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  chapterStatText: {
    fontSize: 12,
  },
});
