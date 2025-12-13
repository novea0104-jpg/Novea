import React from "react";
import { View, StyleSheet, Modal, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { XIcon } from "@/components/icons/XIcon";
import { FeatherIcon } from "@/components/icons/FeatherIcon";
import { LinearGradient } from "expo-linear-gradient";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

interface WriterTermsModalProps {
  visible: boolean;
  onClose: () => void;
  onAgree: () => void;
  isLoading?: boolean;
}

export function WriterTermsModal({ visible, onClose, onAgree, isLoading }: WriterTermsModalProps) {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
                <FeatherIcon size={24} color={theme.primary} />
              </View>
              <ThemedText style={[Typography.h3, { flex: 1 }]}>Menjadi Penulis</ThemedText>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <XIcon size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <ThemedText style={[styles.introText, { color: theme.textSecondary }]}>
              Dengan menjadi penulis di Novea, kamu dapat membagikan karya tulismu kepada jutaan pembaca. Silakan baca dan setujui syarat dan ketentuan berikut:
            </ThemedText>

            <View style={[styles.termSection, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={styles.termTitle}>1. Persyaratan Umum</ThemedText>
              <ThemedText style={[styles.termText, { color: theme.textSecondary }]}>
                {"\u2022"} Penulis harus berusia minimal 17 tahun atau memiliki izin orang tua/wali.{"\n"}
                {"\u2022"} Penulis wajib menggunakan bahasa yang sopan dan tidak mengandung SARA.{"\n"}
                {"\u2022"} Penulis bertanggung jawab penuh atas konten yang diunggah.
              </ThemedText>
            </View>

            <View style={[styles.termSection, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={styles.termTitle}>2. Hak Cipta dan Kepemilikan</ThemedText>
              <ThemedText style={[styles.termText, { color: theme.textSecondary }]}>
                {"\u2022"} Penulis menjamin bahwa karya yang diunggah adalah karya asli dan bukan plagiat.{"\n"}
                {"\u2022"} Hak cipta karya tetap menjadi milik penulis sepenuhnya.{"\n"}
                {"\u2022"} Novea memiliki hak untuk menampilkan dan mendistribusikan karya di platform.
              </ThemedText>
            </View>

            <View style={[styles.termSection, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={styles.termTitle}>3. Konten yang Dilarang</ThemedText>
              <ThemedText style={[styles.termText, { color: theme.textSecondary }]}>
                {"\u2022"} Konten pornografi atau eksplisit yang berlebihan.{"\n"}
                {"\u2022"} Konten yang mengandung kekerasan ekstrem atau gore.{"\n"}
                {"\u2022"} Konten yang mempromosikan kebencian, diskriminasi, atau terorisme.{"\n"}
                {"\u2022"} Konten yang melanggar hukum Indonesia.
              </ThemedText>
            </View>

            <View style={[styles.termSection, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={styles.termTitle}>4. Pembagian Pendapatan</ThemedText>
              <ThemedText style={[styles.termText, { color: theme.textSecondary }]}>
                {"\u2022"} Penulis akan menerima 80% dari pendapatan bab premium.{"\n"}
                {"\u2022"} Novea akan memotong 20% sebagai biaya platform dan layanan.{"\n"}
                {"\u2022"} Pencairan dapat dilakukan kapan saja dengan minimum Rp 50.000.{"\n"}
                {"\u2022"} Pembayaran akan diproses dalam 7 hari kerja.
              </ThemedText>
            </View>

            <View style={[styles.termSection, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={styles.termTitle}>5. Pelanggaran dan Sanksi</ThemedText>
              <ThemedText style={[styles.termText, { color: theme.textSecondary }]}>
                {"\u2022"} Pelanggaran ringan: Peringatan tertulis.{"\n"}
                {"\u2022"} Pelanggaran sedang: Penghapusan konten terkait.{"\n"}
                {"\u2022"} Pelanggaran berat: Penangguhan atau penghapusan akun permanen.{"\n"}
                {"\u2022"} Keputusan Novea bersifat final dan tidak dapat diganggu gugat.
              </ThemedText>
            </View>

            <ThemedText style={[styles.agreementText, { color: theme.textSecondary }]}>
              Dengan menekan tombol "Setuju dan Lanjutkan", kamu menyatakan telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan di atas.
            </ThemedText>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelButton,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <ThemedText style={[styles.cancelButtonText, { color: theme.text }]}>
                Batal
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={onAgree}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.agreeButton,
                { opacity: pressed || isLoading ? 0.7 : 1 },
              ]}
            >
              <LinearGradient
                colors={["#8B5CF6", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.agreeButtonGradient}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.agreeButtonText}>
                    Setuju dan Lanjutkan
                  </ThemedText>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    padding: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  introText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  termSection: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  termTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  termText: {
    fontSize: 14,
    lineHeight: 22,
  },
  agreementText: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: Spacing.md,
    fontStyle: "italic",
  },
  footer: {
    flexDirection: "row",
    padding: Spacing.xl,
    paddingBottom: 40,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  agreeButton: {
    flex: 2,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  agreeButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  agreeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
