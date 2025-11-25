import React from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { RoleBadge } from "@/components/RoleBadge";
import { UserIcon } from "@/components/icons/UserIcon";
import { CheckIcon } from "@/components/icons/CheckIcon";
import { ChevronRightIcon } from "@/components/icons/ChevronRightIcon";
import { BookOpenIcon } from "@/components/icons/BookOpenIcon";
import { FileTextIcon } from "@/components/icons/FileTextIcon";
import { ZapIcon } from "@/components/icons/ZapIcon";
import { AwardIcon } from "@/components/icons/AwardIcon";
import { ShieldIcon } from "@/components/icons/ShieldIcon";
import { BookIcon } from "@/components/icons/BookIcon";
import { FeatherIcon } from "@/components/icons/FeatherIcon";
import { AlertCircleIcon } from "@/components/icons/AlertCircleIcon";
import { LogOutIcon } from "@/components/icons/LogOutIcon";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStats } from "@/hooks/useUserStats";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user, logout, upgradeToWriter } = useAuth();
  const { stats, isLoading: statsLoading } = useUserStats();

  if (!user) return null;

  // Determine which role-based button to show
  const isAdmin = user.role === 'editor' || user.role === 'co_admin' || user.role === 'super_admin';
  const isPenulis = user.role === 'penulis';
  const isPembaca = user.role === 'pembaca';

  const iconMap: Record<string, React.ReactNode> = {
    user: <UserIcon size={20} color={theme.text} />,
    award: <AwardIcon size={20} color={theme.text} />,
    shield: <ShieldIcon size={20} color={theme.text} />,
    book: <BookIcon size={20} color={theme.text} />,
    feather: <FeatherIcon size={20} color={theme.text} />,
    "alert-circle": <AlertCircleIcon size={20} color={theme.text} />,
  };

  const MenuItem = ({ icon, title, subtitle, onPress }: any) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        { opacity: pressed ? 0.7 : 1, backgroundColor: theme.backgroundDefault },
      ]}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconCircle, { backgroundColor: theme.backgroundSecondary }]}>
          {iconMap[icon]}
        </View>
        <View>
          <ThemedText style={styles.menuItemText}>{title}</ThemedText>
          {subtitle ? (
            <ThemedText style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      </View>
      <ChevronRightIcon size={18} color={theme.textMuted} />
    </Pressable>
  );

  return (
    <ScreenScrollView>
      <Card elevation={1} style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
              <UserIcon size={32} color={theme.text} />
            </View>
          )}
          <View style={styles.editBadge}>
            <CheckIcon size={12} color="#FFFFFF" />
          </View>
        </View>

        <ThemedText style={[Typography.h2, styles.userName]}>{user.name}</ThemedText>
        <ThemedText style={[styles.userEmail, { color: theme.textSecondary }]}>
          @{user.email.split("@")[0]}
        </ThemedText>
        
        <View style={styles.badgeContainer}>
          <RoleBadge role={user.role} size="medium" />
        </View>

        <View style={[styles.bioContainer, { borderColor: theme.backgroundSecondary }]}>
          <ThemedText style={[styles.bioLabel, { color: theme.textMuted }]}>Bio</ThemedText>
          <ThemedText style={[styles.bioText, { color: theme.textSecondary }]}>
            {user.bio || "Belum ada bio. Tap Edit Profil untuk menambahkan."}
          </ThemedText>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: theme.backgroundSecondary }]}>
              <BookOpenIcon size={22} color={theme.text} />
            </View>
            <ThemedText style={[Typography.h2, styles.statValue]}>
              {statsLoading ? '-' : stats.novelsRead}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Buku Dibaca
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: theme.backgroundSecondary }]}>
              <FileTextIcon size={22} color={theme.text} />
            </View>
            <ThemedText style={[Typography.h2, styles.statValue]}>
              {statsLoading ? '-' : stats.chaptersRead}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Chapter
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: theme.backgroundSecondary }]}>
              <ZapIcon size={22} color={theme.text} />
            </View>
            <ThemedText style={[Typography.h2, styles.statValue]}>
              {statsLoading ? '-' : stats.dayStreak}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Hari Berturut
            </ThemedText>
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <ThemedText style={[Typography.h3, styles.sectionTitle]}>Akun</ThemedText>
        <MenuItem
          icon="user"
          title="Edit Profil"
          subtitle="Ubah foto & informasi"
          onPress={() => navigation.navigate("EditProfile")}
        />
        <MenuItem
          icon="award"
          title="Langganan Premium"
          subtitle="Akses tanpa batas"
          onPress={() => navigation.navigate("CoinStore")}
        />
        {isAdmin ? (
          <MenuItem
            icon="shield"
            title="Dashboard Admin"
            subtitle="Kelola platform & pengguna"
            onPress={() => navigation.navigate("AdminDashboard")}
          />
        ) : isPenulis ? (
          <MenuItem
            icon="book"
            title="Pusat Penulis"
            subtitle="Kelola cerita kamu"
            onPress={() => navigation.navigate("WriterCenter")}
          />
        ) : (
          <MenuItem
            icon="feather"
            title="Menjadi Penulis"
            subtitle="Bagikan ceritamu ke dunia"
            onPress={upgradeToWriter}
          />
        )}
        <MenuItem
          icon="alert-circle"
          title="Kebijakan dan Akun"
          subtitle="Privasi, Syarat & Ketentuan"
          onPress={() => {}}
        />
      </View>

      <View style={[styles.section, styles.logoutSection]}>
        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.logoutButton,
            { opacity: pressed ? 0.7 : 1, backgroundColor: theme.backgroundDefault },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.iconCircle, styles.logoutIconCircle]}>
              <LogOutIcon size={20} color="#EF4444" />
            </View>
            <ThemedText style={[styles.menuItemText, styles.logoutText]}>
              Keluar
            </ThemedText>
          </View>
          <ChevronRightIcon size={18} color={theme.textMuted} />
        </Pressable>
      </View>

      <View style={styles.spacer} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
  avatarContainer: {
    position: "relative",
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  editBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#14B8A6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#1A1A1A",
  },
  userName: {
    marginBottom: Spacing.xs,
  },
  userEmail: {
    marginBottom: 2,
    fontSize: 14,
  },
  badgeContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  bioContainer: {
    width: "100%",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: Spacing.xl,
  },
  bioLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    gap: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  section: {
    marginTop: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: "700",
  },
  logoutSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  logoutIconCircle: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  logoutText: {
    color: "#EF4444",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
  menuSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  spacer: {
    height: Spacing["3xl"],
  },
});
