import React, { useState, useEffect } from "react";
import { View, StyleSheet, Pressable, Image, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { BookIcon } from "@/components/icons/BookIcon";
import { FileTextIcon } from "@/components/icons/FileTextIcon";
import { EyeIcon } from "@/components/icons/EyeIcon";
import { PlusIcon } from "@/components/icons/PlusIcon";
import { ChevronRightIcon } from "@/components/icons/ChevronRightIcon";
import { TrendingUpIcon } from "@/components/icons/TrendingUpIcon";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/utils/supabase";
import { Spacing, Typography, BorderRadius, GradientColors } from "@/constants/theme";
import type { Novel } from "@/types/models";

export default function WriterCenterScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalNovels: 0,
    totalChapters: 0,
    totalReads: 0,
  });

  useEffect(() => {
    loadWriterData();
  }, [user]);

  async function loadWriterData() {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log('Loading writer data for user ID:', user.id);
      
      const { data: novelsData, error } = await supabase
        .from('novels')
        .select('*')
        .eq('author_id', parseInt(user.id))
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading novels:', error);
        throw error;
      }
      
      console.log('Loaded novels:', novelsData);

      const mappedNovels: Novel[] = (novelsData || []).map((n: any) => ({
        id: n.id.toString(),
        title: n.title,
        author: n.author,
        authorId: n.author_id?.toString() || '',
        coverImage: n.cover_url || '',
        genre: n.genre,
        status: n.status === 'completed' ? 'Completed' : 'On-Going',
        rating: n.rating || 0,
        ratingCount: 0,
        synopsis: n.description,
        coinPerChapter: n.chapter_price,
        totalChapters: n.total_chapters,
        followers: 0,
        lastUpdated: new Date(n.updated_at),
        createdAt: new Date(n.created_at),
      }));

      setNovels(mappedNovels);

      const totalChapters = novelsData?.reduce((sum: number, n: any) => sum + (n.total_chapters || 0), 0) || 0;
      const totalReads = novelsData?.reduce((sum: number, n: any) => sum + (n.total_reads || 0), 0) || 0;

      setStats({
        totalNovels: novelsData?.length || 0,
        totalChapters,
        totalReads,
      });
    } catch (error) {
      console.error('Error loading writer data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScreenScrollView>
      <View style={styles.container}>
        <View style={styles.statsGrid}>
          <StatCard
            IconComponent={BookIcon}
            label="Total Novel"
            value={stats.totalNovels.toString()}
            theme={theme}
          />
          <StatCard
            IconComponent={FileTextIcon}
            label="Total Chapter"
            value={stats.totalChapters.toString()}
            theme={theme}
          />
          <StatCard
            IconComponent={EyeIcon}
            label="Total Pembaca"
            value={stats.totalReads.toString()}
            theme={theme}
          />
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText style={Typography.h2}>Novel Saya</ThemedText>
          <Pressable
            onPress={() => navigation.navigate('CreateNovel' as never)}
            style={styles.createButton}
          >
            <LinearGradient
              colors={GradientColors.purplePink.colors}
              start={GradientColors.purplePink.start}
              end={GradientColors.purplePink.end}
              style={styles.createButtonGradient}
            >
              <PlusIcon size={20} color="#FFFFFF" />
              <ThemedText style={styles.createButtonText}>Buat Novel</ThemedText>
            </LinearGradient>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={GradientColors.purplePink.colors[0]} />
          </View>
        ) : novels.length === 0 ? (
          <Card elevation={1} style={styles.emptyCard}>
            <BookIcon size={48} color={theme.textMuted} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Belum ada novel. Mulai menulis sekarang!
            </ThemedText>
          </Card>
        ) : (
          <View style={styles.novelsList}>
            {novels.map((novel) => (
              <NovelCard
                key={novel.id}
                novel={novel}
                onPress={() => (navigation as any).navigate('ManageNovel', { novelId: novel.id })}
                theme={theme}
              />
            ))}
          </View>
        )}
      </View>
    </ScreenScrollView>
  );
}

function StatCard({ IconComponent, label, value, theme }: { IconComponent: React.ComponentType<{ size: number; color: string }>; label: string; value: string; theme: any }) {
  return (
    <Card elevation={1} style={styles.statCard}>
      <View style={[styles.statIconCircle, { backgroundColor: theme.backgroundSecondary }]}>
        <IconComponent size={20} color={theme.text} />
      </View>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
    </Card>
  );
}

function NovelCard({ novel, onPress, theme }: { novel: Novel; onPress: () => void; theme: any }) {
  return (
    <Pressable onPress={onPress}>
      <Card elevation={1} style={styles.novelCard}>
        <Image
          source={{ uri: novel.coverImage || 'https://via.placeholder.com/120x180' }}
          style={styles.novelCover}
        />
        <View style={styles.novelInfo}>
          <ThemedText style={Typography.h3} numberOfLines={2}>
            {novel.title}
          </ThemedText>
          <ThemedText style={[styles.novelGenre, { color: theme.textSecondary }]}>
            {novel.genre}
          </ThemedText>
          <View style={styles.novelStats}>
            <View style={styles.novelStat}>
              <FileTextIcon size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.novelStatText, { color: theme.textSecondary }]}>
                {novel.totalChapters} chapter
              </ThemedText>
            </View>
            <View style={styles.novelStat}>
              <TrendingUpIcon size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.novelStatText, { color: theme.textSecondary }]}>
                {novel.status}
              </ThemedText>
            </View>
          </View>
        </View>
        <ChevronRightIcon size={24} color={theme.textMuted} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Spacing.xl,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  createButton: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  createButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
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
  novelsList: {
    gap: Spacing.md,
  },
  novelCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
  },
  novelCover: {
    width: 80,
    height: 120,
    borderRadius: BorderRadius.md,
    backgroundColor: "#333",
  },
  novelInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  novelGenre: {
    fontSize: 13,
  },
  novelStats: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.xs,
  },
  novelStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  novelStatText: {
    fontSize: 12,
  },
});
