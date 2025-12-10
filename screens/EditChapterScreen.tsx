import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Alert, ActivityIndicator, Switch, Pressable } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { RichTextEditor } from "@/components/RichTextEditor";
import { stripMarkdown } from "@/components/MarkdownText";
import { SaveIcon } from "@/components/icons/SaveIcon";
import { SendIcon } from "@/components/icons/SendIcon";
import { LockIcon } from "@/components/icons/LockIcon";
import { UnlockIcon } from "@/components/icons/UnlockIcon";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/utils/supabase";
import { rupiahToNovoin, formatRupiah, NOVOIN_TO_RUPIAH } from "@/constants/pricing";
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
  const [isLocked, setIsLocked] = useState(false);
  const [priceRupiah, setPriceRupiah] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingChapter, setIsFetchingChapter] = useState(false);
  const [chapterNumber, setChapterNumber] = useState(1);

  const wordCount = stripMarkdown(content).trim().split(/\s+/).filter(Boolean).length;
  const priceInNovoin = priceRupiah ? rupiahToNovoin(parseInt(priceRupiah.replace(/\D/g, ""), 10) || 0) : 0;

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
        setIsLocked(!data.is_free);
        setChapterNumber(data.chapter_number);
        if (!data.is_free && data.price > 0) {
          const rupiahValue = data.price * NOVOIN_TO_RUPIAH;
          setPriceRupiah(rupiahValue.toString());
        }
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

  function handlePriceChange(text: string) {
    const numericValue = text.replace(/\D/g, "");
    setPriceRupiah(numericValue);
  }

  function formatPriceDisplay(value: string): string {
    if (!value) return "";
    const num = parseInt(value, 10);
    if (isNaN(num)) return "";
    return num.toLocaleString("id-ID");
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

    if (isLocked && priceInNovoin <= 0) {
      Alert.alert("Error", "Harga chapter terkunci harus lebih dari Rp 0!");
      return;
    }

    const priceValue = parseInt(priceRupiah.replace(/\D/g, ""), 10) || 0;
    if (isLocked && priceValue % 1000 !== 0) {
      Alert.alert(
        "Harga Tidak Valid", 
        "Harga harus kelipatan Rp 1.000.\n\nContoh: Rp 1.000, Rp 2.000, Rp 5.000, dll.\n\nHarga Rp " + priceValue.toLocaleString("id-ID") + " tidak valid karena bukan kelipatan 1.000."
      );
      return;
    }

    setIsLoading(true);

    try {
      const isFree = !isLocked;
      const chapterPrice = isLocked ? priceInNovoin : 0;

      if (isEditing && chapterIdNum) {
        const { error } = await supabase
          .from('chapters')
          .update({
            title: title.trim(),
            content: content.trim(),
            word_count: wordCount,
            is_free: isFree,
            price: chapterPrice,
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
            price: chapterPrice,
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
          {novel ? (
            <ThemedText style={[styles.novelName, { color: theme.textSecondary }]}>
              {novel.title}
            </ThemedText>
          ) : null}

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
            <RichTextEditor
              value={content}
              onChangeText={setContent}
              placeholder="Tulis konten chapter di sini..."
              minHeight={300}
              maxHeight={500}
            />
          </View>

          <View style={[styles.pricingSection, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.switchRow}>
              <View style={styles.lockInfo}>
                {isLocked ? (
                  <LockIcon size={20} color={theme.warning} />
                ) : (
                  <UnlockIcon size={20} color={theme.success} />
                )}
                <View>
                  <ThemedText style={styles.label}>
                    {isLocked ? "Chapter Terkunci" : "Chapter Gratis"}
                  </ThemedText>
                  <ThemedText style={[styles.switchHint, { color: theme.textSecondary }]}>
                    {isLocked 
                      ? "Pembaca perlu Novoin untuk membaca" 
                      : "Pembaca bisa baca tanpa Novoin"}
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={isLocked}
                onValueChange={setIsLocked}
                trackColor={{ false: theme.backgroundDefault, true: theme.warning }}
                thumbColor="#FFFFFF"
              />
            </View>

            {isLocked ? (
              <View style={styles.priceInputContainer}>
                <ThemedText style={styles.label}>Harga Chapter</ThemedText>
                <View style={styles.priceInputRow}>
                  <ThemedText style={[styles.currencyLabel, { color: theme.textSecondary }]}>
                    Rp
                  </ThemedText>
                  <TextInput
                    value={formatPriceDisplay(priceRupiah)}
                    onChangeText={handlePriceChange}
                    placeholder="0"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    style={[styles.priceInput, { backgroundColor: theme.backgroundDefault, color: theme.text }]}
                  />
                </View>
                <View style={styles.conversionInfo}>
                  <ThemedText style={[styles.conversionText, { color: theme.textSecondary }]}>
                    = {priceInNovoin} Novoin
                  </ThemedText>
                  <ThemedText style={[styles.rateText, { color: theme.textMuted }]}>
                    (1 Novoin = Rp 1.000)
                  </ThemedText>
                </View>
              </View>
            ) : null}
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
                  {isEditing ? (
                    <SaveIcon size={20} color="#FFFFFF" />
                  ) : (
                    <SendIcon size={20} color="#FFFFFF" />
                  )}
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
  pricingSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.lg,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lockInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  switchHint: {
    fontSize: 12,
    marginTop: 2,
  },
  priceInputContainer: {
    gap: Spacing.sm,
  },
  priceInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  priceInput: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 18,
    fontWeight: "600",
  },
  conversionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  conversionText: {
    fontSize: 14,
    fontWeight: "600",
  },
  rateText: {
    fontSize: 12,
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
