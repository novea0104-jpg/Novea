import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator, Image, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { RichTextEditor } from "@/components/RichTextEditor";
import { TagSelector } from "@/components/TagSelector";
import { ImageIcon } from "@/components/icons/ImageIcon";
import { CheckIcon } from "@/components/icons/CheckIcon";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, saveNovelTags, Tag } from "@/utils/supabase";
import { uploadNovelCoverAsync } from "@/utils/novelCoverStorage";
import { Spacing, Typography, BorderRadius, GradientColors } from "@/constants/theme";

interface GenreOption {
  id: number;
  name: string;
  slug: string;
}

const MAX_GENRES = 3;

export default function CreateNovelScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();

  const [title, setTitle] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [availableGenres, setAvailableGenres] = useState<GenreOption[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [description, setDescription] = useState("");
  const [coverUri, setCoverUri] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      const { data, error } = await supabase
        .from("genres")
        .select("id, name, slug")
        .order("name");
      
      if (error) {
        console.log("Genres table not found, using fallback genres");
        const fallbackGenres: GenreOption[] = [
          { id: 1, name: "Romance", slug: "romance" },
          { id: 2, name: "Fantasy", slug: "fantasy" },
          { id: 3, name: "Thriller", slug: "thriller" },
          { id: 4, name: "Mystery", slug: "mystery" },
          { id: 5, name: "Sci-Fi", slug: "sci-fi" },
          { id: 6, name: "Adventure", slug: "adventure" },
          { id: 7, name: "Drama", slug: "drama" },
          { id: 8, name: "Horror", slug: "horror" },
          { id: 9, name: "Comedy", slug: "comedy" },
          { id: 10, name: "Action", slug: "action" },
          { id: 11, name: "Chicklit", slug: "chicklit" },
          { id: 12, name: "Teenlit", slug: "teenlit" },
          { id: 13, name: "Apocalypse", slug: "apocalypse" },
          { id: 14, name: "Pernikahan", slug: "pernikahan" },
          { id: 15, name: "Sistem", slug: "sistem" },
          { id: 16, name: "Urban", slug: "urban" },
          { id: 17, name: "Fanfiction", slug: "fanfiction" },
        ];
        setAvailableGenres(fallbackGenres);
        return;
      }
      setAvailableGenres(data || []);
    } catch (error) {
      console.error("Error fetching genres:", error);
      const fallbackGenres: GenreOption[] = [
        { id: 1, name: "Romance", slug: "romance" },
        { id: 2, name: "Fantasy", slug: "fantasy" },
        { id: 3, name: "Thriller", slug: "thriller" },
        { id: 4, name: "Mystery", slug: "mystery" },
        { id: 5, name: "Sci-Fi", slug: "sci-fi" },
        { id: 6, name: "Adventure", slug: "adventure" },
        { id: 7, name: "Drama", slug: "drama" },
        { id: 8, name: "Horror", slug: "horror" },
        { id: 9, name: "Comedy", slug: "comedy" },
        { id: 10, name: "Action", slug: "action" },
        { id: 11, name: "Chicklit", slug: "chicklit" },
        { id: 12, name: "Teenlit", slug: "teenlit" },
        { id: 13, name: "Apocalypse", slug: "apocalypse" },
        { id: 14, name: "Pernikahan", slug: "pernikahan" },
        { id: 15, name: "Sistem", slug: "sistem" },
        { id: 16, name: "Urban", slug: "urban" },
        { id: 17, name: "Fanfiction", slug: "fanfiction" },
      ];
      setAvailableGenres(fallbackGenres);
    }
  };

  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev => {
      if (prev.includes(genreId)) {
        return prev.filter(id => id !== genreId);
      }
      if (prev.length >= MAX_GENRES) {
        Alert.alert("Maksimal 3 Genre", "Kamu hanya bisa memilih maksimal 3 genre untuk setiap novel.");
        return prev;
      }
      return [...prev, genreId];
    });
  };

  async function pickCoverImage() {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow photo library access to upload cover image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [2, 3],
        quality: 0.85,
      });

      if (!result.canceled && result.assets[0]) {
        setCoverUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }

  async function handleCreateNovel() {
    if (!title.trim()) {
      Alert.alert("Error", "Judul novel harus diisi!");
      return;
    }

    if (selectedGenres.length === 0) {
      Alert.alert("Error", "Pilih minimal 1 genre novel!");
      return;
    }

    if (selectedTags.length < 3) {
      Alert.alert("Error", "Pilih minimal 3 tag untuk novel!");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Error", "Sinopsis novel harus diisi!");
      return;
    }

    if (!coverUri) {
      Alert.alert("Error", "Upload cover novel terlebih dahulu!");
      return;
    }

    if (!user) {
      Alert.alert("Error", "User tidak ditemukan!");
      return;
    }

    setIsLoading(true);

    try {
      let coverUrl = "";

      if (coverUri) {
        setIsUploadingImage(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          throw new Error('Not authenticated');
        }

        coverUrl = await uploadNovelCoverAsync(coverUri, session.user.id);
        setIsUploadingImage(false);
      }

      // Get primary genre name for legacy field
      const primaryGenre = availableGenres.find(g => g.id === selectedGenres[0]);
      
      const { data, error } = await supabase
        .from('novels')
        .insert({
          title: title.trim(),
          author: user.name,
          author_id: parseInt(user.id),
          genre: primaryGenre?.name || "Fantasy",
          description: description.trim(),
          cover_url: coverUrl,
          status: 'ongoing',
          chapter_price: 10,
          total_chapters: 0,
          free_chapters: 5,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert genre relations
      const genreInserts = selectedGenres.map((genreId, index) => ({
        novel_id: data.id,
        genre_id: genreId,
        is_primary: index === 0,
      }));

      const { error: genreError } = await supabase
        .from('novel_genres')
        .insert(genreInserts);

      if (genreError) {
        console.error('Error inserting genres:', genreError);
      }

      // Insert tag relations
      if (selectedTags.length > 0) {
        const tagResult = await saveNovelTags(data.id, selectedTags.map(t => t.id));
        if (!tagResult.success) {
          console.error('Error inserting tags:', tagResult.error);
        }
      }

      Alert.alert(
        "Berhasil!",
        "Novel berhasil dibuat! Sekarang tambahkan chapter pertama.",
        [
          {
            text: "OK",
            onPress: () => {
              navigation.goBack();
              (navigation as any).navigate('ManageChapters', { novelId: data.id });
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating novel:', error);
      Alert.alert("Error", error.message || "Gagal membuat novel. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.container}>
        <Card elevation={1} style={styles.formCard}>
          <ThemedText style={Typography.h2}>Buat Novel Baru</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Isi detail novel yang akan kamu tulis
          </ThemedText>

          <View style={styles.coverSection}>
            <Pressable
              onPress={pickCoverImage}
              style={[styles.coverUploadButton, { borderColor: theme.cardBorder }]}
            >
              {coverUri ? (
                <Image source={{ uri: coverUri }} style={styles.coverPreview} />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <ImageIcon size={40} color={theme.textMuted} />
                  <ThemedText style={[styles.coverPlaceholderText, { color: theme.textSecondary }]}>
                    Tap untuk upload cover
                  </ThemedText>
                  <ThemedText style={[styles.coverHint, { color: theme.textMuted }]}>
                    Rasio 2:3 (contoh: 400x600)
                  </ThemedText>
                </View>
              )}
            </Pressable>
            {isUploadingImage && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Judul Novel</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              placeholder="Masukkan judul novel..."
              placeholderTextColor={theme.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>
              Genre ({selectedGenres.length}/{MAX_GENRES})
            </ThemedText>
            <ThemedText style={[styles.genreHint, { color: theme.textMuted }]}>
              Pilih 1-3 genre. Genre pertama akan menjadi genre utama.
            </ThemedText>
            <View style={styles.genreGrid}>
              {availableGenres.map((g) => {
                const isSelected = selectedGenres.includes(g.id);
                const selectionIndex = selectedGenres.indexOf(g.id);
                return (
                  <Pressable
                    key={g.id}
                    onPress={() => toggleGenre(g.id)}
                    style={[
                      styles.genreChip,
                      { backgroundColor: theme.backgroundSecondary },
                      isSelected && styles.genreChipActive,
                    ]}
                  >
                    {isSelected ? (
                      <LinearGradient
                        colors={selectionIndex === 0 ? GradientColors.purplePink.colors : ["#6B7280", "#4B5563"]}
                        start={GradientColors.purplePink.start}
                        end={GradientColors.purplePink.end}
                        style={StyleSheet.absoluteFill}
                      />
                    ) : null}
                    <View style={styles.genreChipContent}>
                      {isSelected ? (
                        <View style={styles.genreOrderBadge}>
                          <ThemedText style={styles.genreOrderText}>{selectionIndex + 1}</ThemedText>
                        </View>
                      ) : null}
                      <ThemedText
                        style={[
                          styles.genreChipText,
                          isSelected && { color: "#FFFFFF" },
                        ]}
                      >
                        {g.name}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <TagSelector
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              minTags={3}
              maxTags={7}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Sinopsis</ThemedText>
            <RichTextEditor
              value={description}
              onChangeText={setDescription}
              placeholder="Ceritakan tentang novel kamu..."
              minHeight={150}
              maxHeight={300}
            />
          </View>

          <Pressable
            onPress={handleCreateNovel}
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
                  <CheckIcon size={20} color="#FFFFFF" />
                  <ThemedText style={styles.submitButtonText}>Buat Novel</ThemedText>
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
  subtitle: {
    fontSize: 14,
    marginTop: -Spacing.md,
  },
  coverSection: {
    alignItems: "center",
    marginVertical: Spacing.md,
  },
  coverUploadButton: {
    width: 200,
    height: 300,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  coverPreview: {
    width: "100%",
    height: "100%",
  },
  coverPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  coverPlaceholderText: {
    fontSize: 14,
    fontWeight: "600",
  },
  coverHint: {
    fontSize: 12,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
  },
  textArea: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
  },
  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  genreChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  genreChipActive: {
    borderWidth: 0,
  },
  genreChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  genreHint: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  genreChipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  genreOrderBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  genreOrderText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  hint: {
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
