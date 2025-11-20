import React from "react";
import { View, StyleSheet, Pressable, Image, Switch } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { RoleBadge } from "@/components/RoleBadge";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStats } from "@/hooks/useUserStats";
import { Spacing, BorderRadius, Typography, GradientColors } from "@/constants/theme";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user, logout, toggleWriterMode } = useAuth();
  const { stats, isLoading: statsLoading } = useUserStats();

  if (!user) return null;

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
          <Feather name={icon} size={18} color={theme.text} />
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
      <Feather name="chevron-right" size={20} color={theme.textMuted} />
    </Pressable>
  );

  return (
    <ScreenScrollView>
      <Card elevation={1} style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="user" size={32} color={theme.text} />
          </View>
          <View style={styles.editBadge}>
            <Feather name="check" size={12} color="#FFFFFF" />
          </View>
        </View>

        <ThemedText style={[Typography.h2, styles.userName]}>{user.name}</ThemedText>
        <ThemedText style={[styles.userEmail, { color: theme.textSecondary }]}>
          @{user.email.split("@")[0]}
        </ThemedText>
        
        <View style={styles.badgeContainer}>
          <RoleBadge role={user.role} size="medium" />
        </View>
        
        <ThemedText style={[styles.checkMark, { color: theme.textSecondary }]}>
          ✓ Terverifikasi
        </ThemedText>

        <LinearGradient
          colors={["#FACC15", "#84CC16"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.premiumButton}
        >
          <Pressable
            onPress={() => navigation.navigate("CoinStore")}
            style={({ pressed }) => [
              styles.premiumButtonInner,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="award" size={16} color="#000000" />
            <ThemedText style={styles.premiumButtonText}>Upgrade to Premium</ThemedText>
          </Pressable>
        </LinearGradient>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="book-open" size={16} color={theme.text} />
            </View>
            <ThemedText style={[Typography.h2, styles.statValue]}>
              {statsLoading ? '-' : stats.novelsRead}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Books Read
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="file-text" size={16} color={theme.text} />
            </View>
            <ThemedText style={[Typography.h2, styles.statValue]}>
              {statsLoading ? '-' : stats.chaptersRead}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Chapters
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="zap" size={16} color={theme.text} />
            </View>
            <ThemedText style={[Typography.h2, styles.statValue]}>
              {statsLoading ? '-' : stats.dayStreak}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Day Streak
            </ThemedText>
          </View>
        </View>
      </Card>

      <View style={styles.section}>
        <ThemedText style={[Typography.h3, styles.sectionTitle]}>Account</ThemedText>
        <MenuItem
          icon="user"
          title="Edit Profile"
          subtitle="Update your profile information"
          onPress={() => {}}
        />
        <MenuItem
          icon="award"
          title="Premium Membership"
          subtitle="Upgrade for unlimited access"
          onPress={() => navigation.navigate("CoinStore")}
        />
        {user.isWriter ? (
          <MenuItem
            icon="book"
            title="Writer Dashboard"
            subtitle="Manage your stories"
            onPress={() => navigation.navigate("WriterDashboard")}
          />
        ) : (
          <MenuItem
            icon="feather"
            title="Become a Writer"
            subtitle="Share your stories with the world"
            onPress={toggleWriterMode}
          />
        )}
        <MenuItem
          icon="alert-circle"
          title="Kebijakan dan Akun"
          subtitle="Privacy, Terms & Conditions"
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
              <Feather name="log-out" size={18} color="#EF4444" />
            </View>
            <ThemedText style={[styles.menuItemText, styles.logoutText]}>
              Logout
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textMuted} />
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
    marginBottom: Spacing.xs,
  },
  checkMark: {
    fontSize: 12,
    marginBottom: Spacing.lg,
  },
  premiumButton: {
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
    marginBottom: Spacing["2xl"],
  },
  premiumButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing["2xl"],
    gap: Spacing.sm,
  },
  premiumButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
