import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/utils/supabase";
import { Spacing, Typography, BorderRadius, GradientColors } from "@/constants/theme";

type CreateChapterRouteParams = {
  CreateChapter: {
    novelId: string;
    chapterNumber: number;
  };
};

export default function CreateChapterScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<CreateChapterRouteParams, 'CreateChapter'>>();
  const { novelId, chapterNumber } = route.params;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isFree = chapterNumber <= 5;
  const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length;

  async function handlePublishChapter() {
    if (!title.trim()) {
      Alert.alert("Error", "Judul chapter harus diisi!");
      return;
    }

    if (!content.trim()) {
      Alert.alert("Error", "Konten chapter harus diisi!");
      return;
    }

    if (wordCount < 100) {
      Alert.alert("Error", "Chapter minimal 100 kata!");
      return;
    }

    setIsLoading(true);

    try {
      const novelData = await supabase
        .from('novels')
        .select('chapter_price')
        .eq('id', parseInt(novelId))
        .single();

      if (novelData.error) throw novelData.error;

      const chapterPrice = novelData.data.chapter_price || 10;

      const { error } = await supabase
        .from('chapters')
        .insert({
          novel_id: parseInt(novelId),
          chapter_number: chapterNumber,
          title: title.trim(),
          content: content.trim(),
          word_count: wordCount,
          is_free: isFree,
          price: isFree ? 0 : chapterPrice,
        });

      if (error) throw error;

      await supabase
        .from('novels')
        .update({
          total_chapters: chapterNumber,
          updated_at: new Date().toISOString(),
        })
        .eq('id', parseInt(novelId));

      Alert.alert(
        "Berhasil!",
        "Chapter berhasil dipublish!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error publishing chapter:', error);
      Alert.alert("Error", error.message || "Gagal mempublish chapter. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.container}>
        <Card elevation={1} style={styles.formCard}>
          <View style={styles.header}>
            <ThemedText style={Typography.h2}>Chapter {chapterNumber}</ThemedText>
            <View style={[styles.badge, isFree ? styles.badgeFree : styles.badgePaid]}>
              <ThemedText style={styles.badgeText}>
                {isFree ? "Gratis" : "Berbayar"}
              </ThemedText>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Judul Chapter</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              placeholder={`Contoh: Chapter ${chapterNumber} - Pertemuan Pertama`}
              placeholderTextColor={theme.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.label}>Konten Chapter</ThemedText>
              <ThemedText style={[styles.wordCount, { color: theme.textSecondary }]}>
                {wordCount} kata
              </ThemedText>
            </View>
            <TextInput
              style={[styles.contentInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              placeholder="Mulai tulis cerita kamu di sini... &#10;&#10;Gunakan enter untuk membuat paragraf baru.&#10;&#10;Tips:&#10;- Minimal 100 kata&#10;- Gunakan dialog untuk membuat cerita lebih hidup&#10;- Buat paragraf pendek agar mudah dibaca"
              placeholderTextColor={theme.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={[styles.infoBox, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="info" size={16} color={theme.textSecondary} />
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
                {isFree 
                  ? "Chapter ini GRATIS untuk semua pembaca" 
                  : `Pembaca harus membayar untuk membaca chapter ini`
                }
              </ThemedText>
            </View>
          </View>

          <Pressable
            onPress={handlePublishChapter}
            disabled={isLoading}
            style={styles.publishButton}
          >
            <LinearGradient
              colors={GradientColors.purplePink.colors}
              start={GradientColors.purplePink.start}
              end={GradientColors.purplePink.end}
              style={styles.publishButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="send" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.publishButtonText}>Publish Chapter</ThemedText>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Card>
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formCard: {
    gap: Spacing.xl,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  badgeFree: {
    backgroundColor: "#10b981",
  },
  badgePaid: {
    backgroundColor: "#f59e0b",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wordCount: {
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
  },
  contentInput: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
    minHeight: 400,
    lineHeight: 24,
  },
  infoBox: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  publishButton: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginTop: Spacing.md,
  },
  publishButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  publishButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
