import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator, Image } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { ImageIcon } from "@/components/icons/ImageIcon";
import { SaveIcon } from "@/components/icons/SaveIcon";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/utils/supabase";
import { uploadNovelCoverAsync } from "@/utils/novelCoverStorage";
import { Spacing, Typography, BorderRadius, GradientColors } from "@/constants/theme";
import type { Genre } from "@/types/models";

const GENRES: Genre[] = ["Romance", "Fantasy", "Thriller", "Mystery", "Adventure"];

export default function EditNovelScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { novels, refreshNovels } = useApp();
  const navigation = useNavigation();
  const route = useRoute();

  const { novelId } = route.params as { novelId: string };
  const novel = novels.find((n) => n.id === novelId);

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState<Genre | "">("");
  const [description, setDescription] = useState("");
  const [coverUri, setCoverUri] = useState<string>("");
  const [existingCoverUrl, setExistingCoverUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (novel) {
      setTitle(novel.title);
      setGenre(novel.genre as Genre);
      setDescription(novel.synopsis || "");
      if (novel.coverImage) {
        setExistingCoverUrl(novel.coverImage);
      }
    }
  }, [novel]);

  async function pickCoverImage() {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Izin Diperlukan', 'Mohon izinkan akses galeri untuk upload cover.');
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
      Alert.alert('Error', 'Gagal memilih gambar. Coba lagi.');
    }
  }

  async function handleUpdateNovel() {
    if (!title.trim()) {
      Alert.alert("Error", "Judul novel harus diisi!");
      return;
    }

    if (!genre) {
      Alert.alert("Error", "Pilih genre novel!");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Error", "Sinopsis novel harus diisi!");
      return;
    }

    if (!user) {
      Alert.alert("Error", "User tidak ditemukan!");
      return;
    }

    const novelIdNum = parseInt(novelId, 10);
    if (isNaN(novelIdNum)) {
      Alert.alert("Error", "Novel ID tidak valid!");
      return;
    }

    setIsLoading(true);

    try {
      let coverUrl = existingCoverUrl;

      if (coverUri) {
        setIsUploadingImage(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          throw new Error('Not authenticated');
        }

        coverUrl = await uploadNovelCoverAsync(coverUri, session.user.id);
        setIsUploadingImage(false);
      }

      const { error } = await supabase
        .from('novels')
        .update({
          title: title.trim(),
          genre: genre,
          description: description.trim(),
          cover_url: coverUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', novelIdNum);

      if (error) throw error;

      await refreshNovels();

      Alert.alert(
        "Berhasil!",
        "Novel berhasil diupdate!",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error updating novel:', error);
      Alert.alert("Error", error.message || "Gagal update novel. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!novel) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const displayCover = coverUri || existingCoverUrl;

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.container}>
        <Card elevation={1} style={styles.formCard}>
          <ThemedText style={Typography.h2}>Edit Novel</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Perbarui informasi novel kamu
          </ThemedText>

          <View style={styles.coverSection}>
            <Pressable
              onPress={pickCoverImage}
              style={[styles.coverUploadButton, { borderColor: theme.cardBorder }]}
            >
              {displayCover ? (
                <Image source={{ uri: displayCover }} style={styles.coverPreview} />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <ImageIcon size={40} color={theme.textMuted} />
                  <ThemedText style={[styles.coverPlaceholderText, { color: theme.textSecondary }]}>
                    Tap untuk ganti cover
                  </ThemedText>
                  <ThemedText style={[styles.coverHint, { color: theme.textMuted }]}>
                    Rasio 2:3 (contoh: 400x600)
                  </ThemedText>
                </View>
              )}
            </Pressable>
            {displayCover ? (
              <ThemedText style={[styles.coverHint, { color: theme.textMuted, marginTop: Spacing.sm }]}>
                Tap cover untuk ganti gambar
              </ThemedText>
            ) : null}
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
            <ThemedText style={styles.label}>Genre</ThemedText>
            <View style={styles.genreGrid}>
              {GENRES.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGenre(g)}
                  style={[
                    styles.genreChip,
                    { backgroundColor: theme.backgroundSecondary },
                    genre === g && styles.genreChipActive,
                  ]}
                >
                  {genre === g && (
                    <LinearGradient
                      colors={GradientColors.purplePink.colors}
                      start={GradientColors.purplePink.start}
                      end={GradientColors.purplePink.end}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <ThemedText
                    style={[
                      styles.genreChipText,
                      genre === g && { color: "#FFFFFF" },
                    ]}
                  >
                    {g}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>Sinopsis</ThemedText>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              placeholder="Ceritakan tentang novel kamu..."
              placeholderTextColor={theme.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <Pressable
            onPress={handleUpdateNovel}
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
                  <SaveIcon size={20} color="#FFFFFF" />
                  <ThemedText style={styles.submitButtonText}>Simpan Perubahan</ThemedText>
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
