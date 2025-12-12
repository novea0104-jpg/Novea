import React from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Linking,
  Platform,
  Share,
  Alert,
} from "react-native";
import { BlurView } from "expo-blur";
import { ThemedText } from "@/components/ThemedText";
import { XIcon } from "@/components/icons/XIcon";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface ShareOption {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const SHARE_OPTIONS: ShareOption[] = [
  { id: "whatsapp", name: "WhatsApp", icon: "W", color: "#25D366" },
  { id: "telegram", name: "Telegram", icon: "T", color: "#0088cc" },
  { id: "facebook", name: "Facebook", icon: "f", color: "#1877F2" },
  { id: "twitter", name: "X", icon: "X", color: "#000000" },
  { id: "copy", name: "Salin Link", icon: "C", color: "#6B7280" },
  { id: "more", name: "Lainnya", icon: "...", color: "#9CA3AF" },
];

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  url?: string;
}

export function ShareModal({
  visible,
  onClose,
  title,
  message,
  url,
}: ShareModalProps) {
  const { theme } = useTheme();

  const shareUrl = url || "https://noveaindonesia.com";
  const fullMessage = `${message}\n\n${shareUrl}`;

  const handleShare = async (optionId: string) => {
    const encodedMessage = encodeURIComponent(fullMessage);
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);

    try {
      switch (optionId) {
        case "whatsapp":
          const waUrl = `https://wa.me/?text=${encodedMessage}`;
          const canOpenWA = await Linking.canOpenURL(waUrl);
          if (canOpenWA) {
            await Linking.openURL(waUrl);
          } else {
            await Linking.openURL(`https://web.whatsapp.com/send?text=${encodedMessage}`);
          }
          break;

        case "telegram":
          const tgUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(message)}`;
          await Linking.openURL(tgUrl);
          break;

        case "facebook":
          const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodeURIComponent(message)}`;
          await Linking.openURL(fbUrl);
          break;

        case "twitter":
          const twUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}`;
          await Linking.openURL(twUrl);
          break;

        case "copy":
          if (Platform.OS === "web") {
            await navigator.clipboard.writeText(fullMessage);
            Alert.alert("Berhasil", "Link berhasil disalin!");
          } else {
            const Clipboard = require("expo-clipboard");
            await Clipboard.setStringAsync(fullMessage);
            Alert.alert("Berhasil", "Link berhasil disalin!");
          }
          break;

        case "more":
          await Share.share({
            message: fullMessage,
            title: title,
          });
          break;
      }
      onClose();
    } catch (error) {
      console.error("Share error:", error);
      Alert.alert("Gagal", "Tidak dapat membagikan konten");
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.modalContainer}>
          <BlurView
            intensity={80}
            tint="dark"
            style={[styles.content, { backgroundColor: theme.backgroundSecondary + "E6" }]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.header}>
                <ThemedText style={[Typography.h3, { flex: 1 }]}>
                  Bagikan
                </ThemedText>
                <Pressable
                  onPress={onClose}
                  style={[styles.closeButton, { backgroundColor: theme.backgroundDefault }]}
                  hitSlop={10}
                >
                  <XIcon size={20} color={theme.textSecondary} />
                </Pressable>
              </View>

              <ThemedText
                style={[styles.previewText, { color: theme.textSecondary }]}
                numberOfLines={2}
              >
                {message}
              </ThemedText>

              <View style={styles.optionsGrid}>
                {SHARE_OPTIONS.map((option) => (
                  <Pressable
                    key={option.id}
                    style={({ pressed }) => [
                      styles.optionButton,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={() => handleShare(option.id)}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        { backgroundColor: option.color },
                      ]}
                    >
                      <ThemedText style={styles.optionIconText}>
                        {option.icon}
                      </ThemedText>
                    </View>
                    <ThemedText
                      style={[styles.optionName, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {option.name}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </BlurView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    width: "100%",
  },
  content: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing["3xl"],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  previewText: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: Spacing.md,
  },
  optionButton: {
    width: "30%",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  optionIconText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  optionName: {
    fontSize: 12,
    textAlign: "center",
  },
});
