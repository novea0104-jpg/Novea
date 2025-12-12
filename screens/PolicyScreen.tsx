import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { ChevronRightIcon } from "@/components/icons/ChevronRightIcon";
import { ChevronDownIcon } from "@/components/icons/ChevronDownIcon";
import { ShieldIcon } from "@/components/icons/ShieldIcon";
import { FileTextIcon } from "@/components/icons/FileTextIcon";
import { AlertCircleIcon } from "@/components/icons/AlertCircleIcon";
import { TrashIcon } from "@/components/icons/TrashIcon";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

type PolicySection = {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string[];
};

export default function PolicyScreen() {
  const { theme } = useTheme();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const policySections: PolicySection[] = [
    {
      id: "privacy",
      title: "Kebijakan Privasi",
      icon: <ShieldIcon size={24} color={theme.primary} />,
      content: [
        "1. Pengumpulan Data",
        "Kami mengumpulkan informasi yang Anda berikan saat mendaftar, seperti nama, email, dan informasi profil. Kami juga mengumpulkan data penggunaan untuk meningkatkan layanan.",
        "",
        "2. Penggunaan Data",
        "Data Anda digunakan untuk menyediakan layanan Novea, memproses transaksi, mengirim notifikasi penting, dan meningkatkan pengalaman pengguna.",
        "",
        "3. Keamanan Data",
        "Kami menggunakan enkripsi dan langkah-langkah keamanan industri untuk melindungi data Anda dari akses tidak sah.",
        "",
        "4. Berbagi Data",
        "Kami tidak menjual data pribadi Anda. Data hanya dibagikan dengan penyedia layanan yang diperlukan untuk operasional platform.",
        "",
        "5. Hak Pengguna",
        "Anda berhak mengakses, memperbarui, atau menghapus data pribadi Anda kapan saja melalui pengaturan akun.",
      ],
    },
    {
      id: "terms",
      title: "Syarat dan Ketentuan",
      icon: <FileTextIcon size={24} color={theme.secondary} />,
      content: [
        "1. Ketentuan Umum",
        "Dengan menggunakan Novea, Anda menyetujui syarat dan ketentuan ini. Jika tidak setuju, mohon tidak menggunakan layanan kami.",
        "",
        "2. Akun Pengguna",
        "Anda bertanggung jawab menjaga kerahasiaan akun dan kata sandi Anda. Setiap aktivitas di akun Anda adalah tanggung jawab Anda.",
        "",
        "3. Konten Pengguna",
        "Konten yang Anda unggah harus original dan tidak melanggar hak cipta pihak lain. Konten tidak boleh mengandung unsur SARA, pornografi, atau kekerasan berlebihan.",
        "",
        "4. Sistem Novoin",
        "Novoin adalah mata uang virtual yang hanya berlaku di platform Novea. 1 Novoin = Rp 1.000. Novoin yang sudah dibeli tidak dapat dikembalikan atau ditukar dengan uang tunai.",
        "",
        "5. Pembagian Pendapatan Penulis",
        "Penulis menerima 80% dari pendapatan penjualan chapter. Platform mengambil 20% untuk biaya operasional.",
        "",
        "6. Penarikan Dana",
        "Penulis dapat melakukan penarikan dana dengan minimal saldo Rp 100.000. Proses penarikan membutuhkan waktu 3-7 hari kerja.",
      ],
    },
    {
      id: "community",
      title: "Pedoman Komunitas",
      icon: <AlertCircleIcon size={24} color={theme.warning} />,
      content: [
        "1. Hormati Sesama Pengguna",
        "Berkomunikasi dengan sopan dan menghormati pendapat orang lain. Tidak diperbolehkan melakukan bullying, pelecehan, atau ujaran kebencian.",
        "",
        "2. Konten yang Dilarang",
        "- Konten plagiat atau melanggar hak cipta",
        "- Konten SARA, pornografi, atau kekerasan ekstrem",
        "- Spam, iklan tanpa izin, atau penipuan",
        "- Informasi palsu yang merugikan",
        "",
        "3. Komentar dan Ulasan",
        "Berikan komentar yang konstruktif. Kritik diperbolehkan selama disampaikan dengan sopan dan tidak menyerang pribadi.",
        "",
        "4. Pelanggaran dan Sanksi",
        "Pelanggaran dapat mengakibatkan peringatan, pembatasan akun, atau pemblokiran permanen tergantung tingkat pelanggaran.",
        "",
        "5. Laporkan Pelanggaran",
        "Jika menemukan konten atau perilaku yang melanggar, silakan laporkan melalui fitur laporan di aplikasi.",
      ],
    },
    {
      id: "account",
      title: "Pengaturan Akun",
      icon: <TrashIcon size={24} color={theme.error} />,
      content: [
        "1. Mengubah Informasi Akun",
        "Anda dapat mengubah nama, foto profil, dan informasi lainnya melalui menu Edit Profil.",
        "",
        "2. Mengubah Kata Sandi",
        "Untuk keamanan, disarankan mengubah kata sandi secara berkala. Gunakan kombinasi huruf, angka, dan simbol.",
        "",
        "3. Notifikasi",
        "Kelola preferensi notifikasi melalui menu pengaturan untuk mengontrol jenis notifikasi yang ingin Anda terima.",
        "",
        "4. Menonaktifkan Akun",
        "Anda dapat menonaktifkan akun sementara. Selama periode ini, profil dan konten Anda tidak akan terlihat oleh pengguna lain.",
        "",
        "5. Menghapus Akun",
        "Jika ingin menghapus akun secara permanen, hubungi tim support kami. Perlu diingat bahwa penghapusan akun bersifat permanen dan semua data akan dihapus.",
        "",
        "6. Kontak Dukungan",
        "Untuk bantuan lebih lanjut, hubungi kami melalui email: support@noveaindonesia.com",
      ],
    },
  ];

  const renderSectionContent = (content: string[]) => (
    <View style={styles.sectionContent}>
      {content.map((line, index) => {
        if (line === "") {
          return <View key={index} style={{ height: Spacing.md }} />;
        }
        const isTitle = /^\d+\./.test(line);
        return (
          <ThemedText
            key={index}
            style={[
              isTitle ? styles.contentTitle : styles.contentText,
              { color: isTitle ? theme.text : theme.textSecondary },
            ]}
          >
            {line}
          </ThemedText>
        );
      })}
    </View>
  );

  return (
    <ScreenScrollView>
      <View style={styles.container}>
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <ShieldIcon size={40} color={theme.primary} />
            <View style={styles.headerTextContainer}>
              <ThemedText style={[Typography.h2, { color: theme.text }]}>
                Kebijakan dan Akun
              </ThemedText>
              <ThemedText style={[styles.headerSubtitle, { color: theme.textMuted }]}>
                Privasi, syarat penggunaan, dan pengaturan akun
              </ThemedText>
            </View>
          </View>
        </Card>

        <View style={styles.sectionsContainer}>
          {policySections.map((section) => (
            <Card key={section.id} style={styles.sectionCard}>
              <Pressable
                onPress={() => toggleSection(section.id)}
                style={({ pressed }) => [
                  styles.sectionHeader,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View style={styles.sectionHeaderLeft}>
                  {section.icon}
                  <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                    {section.title}
                  </ThemedText>
                </View>
                {expandedSection === section.id ? (
                  <ChevronDownIcon size={24} color={theme.textMuted} />
                ) : (
                  <ChevronRightIcon size={24} color={theme.textMuted} />
                )}
              </Pressable>
              {expandedSection === section.id && renderSectionContent(section.content)}
            </Card>
          ))}
        </View>

        <Card style={styles.footerCard}>
          <ThemedText style={[styles.footerText, { color: theme.textMuted }]}>
            Terakhir diperbarui: Desember 2025
          </ThemedText>
          <ThemedText style={[styles.footerText, { color: theme.textMuted }]}>
            Novea Indonesia - Platform Novel Digital
          </ThemedText>
        </Card>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  headerCard: {
    padding: Spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  sectionsContainer: {
    gap: Spacing.sm,
  },
  sectionCard: {
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
    paddingTop: Spacing.md,
  },
  contentTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
  },
  footerCard: {
    padding: Spacing.md,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
  },
});
