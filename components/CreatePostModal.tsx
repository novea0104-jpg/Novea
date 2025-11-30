import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { XIcon } from "@/components/icons/XIcon";
import { UserIcon } from "@/components/icons/UserIcon";
import { ImageIcon } from "@/components/icons/ImageIcon";
import { BookOpenIcon } from "@/components/icons/BookOpenIcon";
import { RoleBadge, UserRole } from "@/components/RoleBadge";

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (content: string, imageUrl?: string, novelId?: number) => Promise<boolean>;
  userName: string;
  userAvatar?: string;
  userRole: string;
  novels?: { id: number; title: string; coverUrl?: string }[];
}

export function CreatePostModal({
  visible,
  onClose,
  onSubmit,
  userName,
  userAvatar,
  userRole,
  novels = [],
}: CreatePostModalProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState("");
  const [selectedNovelId, setSelectedNovelId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNovelPicker, setShowNovelPicker] = useState(false);

  const selectedNovel = novels.find((n) => n.id === selectedNovelId);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const success = await onSubmit(
      content.trim(),
      undefined,
      selectedNovelId || undefined
    );

    if (success) {
      setContent("");
      setSelectedNovelId(null);
      onClose();
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setContent("");
    setSelectedNovelId(null);
    setShowNovelPicker(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: theme.backgroundDefault, borderBottomColor: theme.cardBorder },
          ]}
        >
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <XIcon size={24} color={theme.text} />
          </Pressable>
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
            Buat Postingan
          </ThemedText>
          <Button
            onPress={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            style={styles.submitBtn}
          >
            <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
              {isSubmitting ? "Mengirim..." : "Kirim"}
            </ThemedText>
          </Button>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.userInfo}>
            {userAvatar ? (
              <Image
                source={{ uri: userAvatar }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
                <UserIcon size={20} color={theme.textMuted} />
              </View>
            )}
            <View style={styles.userDetails}>
              <ThemedText style={[styles.userName, { color: theme.text }]}>
                {userName}
              </ThemedText>
              <RoleBadge role={userRole as UserRole} size="small" />
            </View>
          </View>

          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Apa yang ingin kamu bagikan?"
            placeholderTextColor={theme.textMuted}
            style={[
              styles.textInput,
              { color: theme.text, borderColor: theme.cardBorder },
            ]}
            multiline
            textAlignVertical="top"
            maxLength={1000}
            autoFocus
          />

          <ThemedText style={[styles.charCount, { color: theme.textMuted }]}>
            {content.length}/1000
          </ThemedText>

          {selectedNovel && (
            <View style={[styles.attachedNovel, { backgroundColor: theme.backgroundSecondary }]}>
              {selectedNovel.coverUrl && (
                <Image
                  source={{ uri: selectedNovel.coverUrl }}
                  style={styles.novelCover}
                  contentFit="cover"
                />
              )}
              <ThemedText style={[styles.novelTitle, { color: theme.text }]} numberOfLines={2}>
                {selectedNovel.title}
              </ThemedText>
              <Pressable
                onPress={() => setSelectedNovelId(null)}
                style={styles.removeNovelBtn}
              >
                <XIcon size={18} color={theme.textMuted} />
              </Pressable>
            </View>
          )}

          {novels.length > 0 && !selectedNovel && (
            <Pressable
              onPress={() => setShowNovelPicker(!showNovelPicker)}
              style={[styles.attachBtn, { borderColor: theme.cardBorder }]}
            >
              <BookOpenIcon size={20} color={theme.primary} />
              <ThemedText style={[styles.attachBtnText, { color: theme.primary }]}>
                Lampirkan Novel
              </ThemedText>
            </Pressable>
          )}

          {showNovelPicker && (
            <View style={[styles.novelPicker, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={[styles.novelPickerTitle, { color: theme.text }]}>
                Pilih Novel
              </ThemedText>
              {novels.map((novel) => (
                <Pressable
                  key={novel.id}
                  onPress={() => {
                    setSelectedNovelId(novel.id);
                    setShowNovelPicker(false);
                  }}
                  style={[
                    styles.novelPickerItem,
                    { borderBottomColor: theme.cardBorder },
                  ]}
                >
                  {novel.coverUrl && (
                    <Image
                      source={{ uri: novel.coverUrl }}
                      style={styles.novelPickerCover}
                      contentFit="cover"
                    />
                  )}
                  <ThemedText style={[styles.novelPickerText, { color: theme.text }]} numberOfLines={1}>
                    {novel.title}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        {isSubmitting && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  closeBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
  },
  submitBtn: {
    minWidth: 80,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  userDetails: {
    marginLeft: Spacing.sm,
    gap: Spacing.xs,
  },
  userName: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
  },
  textInput: {
    fontSize: Typography.body.fontSize,
    minHeight: 150,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    lineHeight: 22,
  },
  charCount: {
    fontSize: Typography.caption.fontSize,
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  attachedNovel: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  novelCover: {
    width: 36,
    height: 50,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.sm,
  },
  novelTitle: {
    flex: 1,
    fontSize: Typography.caption.fontSize,
    fontWeight: "500",
  },
  removeNovelBtn: {
    padding: Spacing.xs,
  },
  attachBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    borderStyle: "dashed",
    gap: Spacing.sm,
  },
  attachBtnText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: "600",
  },
  novelPicker: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  novelPickerTitle: {
    fontSize: Typography.caption.fontSize,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  novelPickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
  },
  novelPickerCover: {
    width: 28,
    height: 40,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  novelPickerText: {
    flex: 1,
    fontSize: Typography.caption.fontSize,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
});
