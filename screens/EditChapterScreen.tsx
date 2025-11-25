import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Alert, ActivityIndicator, Switch, Pressable } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/utils/supabase";
import { Spacing, BorderRadius, GradientColors } from "@/constants/theme";

export default function EditChapterScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { novels, refreshNovels } = useApp();

  const { novelId, chapterId } = route.params as { novelId: string; chapterId?: string };
  const novel = novels.find((n) => n.id === novelId);
  const isEditing = !!chapterId;
  
  const novelIdNum = parseInt(novelId, 10);
  const chapterIdNum = chapterId ? parseInt(chapterId, 10) : null;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingChapter, setIsFetchingChapter] = useState(false);
  const [chapterNumber, setChapterNumber] = useState(1);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  useEffect(() => {
    if (isEditing) {
      loadChapter();
    } else {
      loadNextChapterNumber();
    }
  }, [chapterId, novelId]);

  async function loadChapter() {
    if (!chapterIdNum || isNaN(chapterIdNum)) {
      Alert.alert("Error", "Chapter ID tidak valid!");
      return;
    }
    
    setIsFetchingChapter(true);
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterIdNum)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title);
        setContent(data.content);
        setIsFree(data.is_free);
        setChapterNumber(data.chapter_number);
      }
    } catch (error) {
      console.error('Error loading chapter:', error);
      Alert.alert("Error", "Gagal memuat chapter.");
    } finally {
      setIsFetchingChapter(false);
    }
  }

  async function loadNextChapterNumber() {
    if (isNaN(novelIdNum)) return;
    
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('chapter_number')
        .eq('novel_id', novelIdNum)
        .order('chapter_number', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setChapterNumber(data[0].chapter_number + 1);
      } else {
        setChapterNumber(1);
      }
    } catch (error) {
      console.error('Error getting next chapter number:', error);
    }
  }

  async function handleSave() {
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

    if (isNaN(novelIdNum)) {
      Alert.alert("Error", "Novel ID tidak valid!");
      return;
    }

    if (isEditing && (!chapterIdNum || isNaN(chapterIdNum))) {
      Alert.alert("Error", "Chapter ID tidak valid!");
      return;
    }

    setIsLoading(true);

    try {
      const novelData = await supabase
        .from('novels')
        .select('chapter_price')
        .eq('id', novelIdNum)
        .single();

      if (novelData.error) throw novelData.error;

      const chapterPrice = novelData.data.chapter_price || 10;

      if (isEditing && chapterIdNum) {
        const { error } = await supabase
          .from('chapters')
          .update({
            title: title.trim(),
            content: content.trim(),
            word_count: wordCount,
            is_free: isFree,
            price: isFree ? 0 : chapterPrice,
            updated_at: new Date().toISOString(),
          })
          .eq('id', chapterIdNum);

        if (error) throw error;

        await refreshNovels();

        Alert.alert("Berhasil!", "Chapter berhasil diupdate!", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      } else {
        const { error } = await supabase
          .from('chapters')
          .insert({
            novel_id: novelIdNum,
            chapter_number: chapterNumber,
            title: title.trim(),
            content: content.trim(),
            word_count: wordCount,
            is_free: isFree,
            price: isFree ? 0 : chapterPrice,
          });

        if (error) throw error;

        const { error: updateError } = await supabase
          .from('novels')
          .update({
            total_chapters: chapterNumber,
            updated_at: new Date().toISOString(),
          })
          .eq('id', novelIdNum);

        if (updateError) {
          console.error('Error updating novel total_chapters:', updateError);
        }

        await refreshNovels();

        Alert.alert("Berhasil!", "Chapter berhasil dipublish!", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error: any) {
      console.error('Error saving chapter:', error);
      Alert.alert("Error", error.message || "Gagal menyimpan chapter. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetchingChapter) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
          Memuat chapter...
        </ThemedText>
      </View>
    );
  }

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.container}>
        <Card elevation={1} style={styles.formCard}>
          <ThemedText style={styles.screenTitle}>
            {isEditing ? "Edit Chapter" : `Chapter ${chapterNumber}`}
          </ThemedText>
          {novel && (
            <ThemedText style={[styles.novelName, { color: theme.textSecondary }]}>
              {novel.title}
            </ThemedText>
          )}

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Judul Chapter</ThemedText>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Masukkan judul chapter..."
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <ThemedText style={styles.label}>Konten Chapter</ThemedText>
              <ThemedText style={[styles.wordCount, { color: theme.textSecondary }]}>
                {wordCount.toLocaleString()} kata
              </ThemedText>
            </View>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Tulis konten chapter di sini..."
              placeholderTextColor={theme.textMuted}
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: theme.backgroundSecondary, color: theme.text },
              ]}
              multiline
              numberOfLines={20}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.switchRow}>
            <View>
              <ThemedText style={styles.label}>Chapter Gratis</ThemedText>
              <ThemedText style={[styles.switchHint, { color: theme.textSecondary }]}>
                {isFree ? "Pembaca bisa baca tanpa koin" : "Pembaca perlu koin untuk membaca"}
              </ThemedText>
            </View>
            <Switch
              value={isFree}
              onValueChange={setIsFree}
              trackColor={{ false: theme.backgroundSecondary, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <Pressable
            onPress={handleSave}
            disabled={isLoading}
            style={styles.submitButton}
          >
            <LinearGradient
              colors={GradientColors.purplePink.colors}
              start={GradientColors.purplePink.start}
              end={GradientColors.purplePink.end}
              style={styles.submitButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name={isEditing ? "save" : "send"} size={20} color="#FFFFFF" />
                  <ThemedText style={styles.submitButtonText}>
                    {isEditing ? "Simpan Perubahan" : "Publish Chapter"}
                  </ThemedText>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  formCard: {
    gap: Spacing.xl,
    padding: Spacing.xl,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  novelName: {
    fontSize: 14,
    marginTop: -Spacing.md,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  wordCount: {
    fontSize: 12,
  },
  input: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
  },
  textArea: {
    minHeight: 400,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  switchHint: {
    fontSize: 12,
    marginTop: 2,
  },
  submitButton: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginTop: Spacing.md,
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
