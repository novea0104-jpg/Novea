import React from "react";
import { View, StyleSheet, Pressable, Image, Switch } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user, logout, toggleWriterMode } = useAuth();

  if (!user) return null;

  const MenuItem = ({ icon, title, onPress, badge }: any) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        { opacity: pressed ? 0.7 : 1, backgroundColor: theme.backgroundDefault },
      ]}
    >
      <View style={styles.menuItemLeft}>
        <Feather name={icon} size={20} color={theme.text} />
        <ThemedText style={styles.menuItemText}>{title}</ThemedText>
      </View>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.badgeText}>{badge}</ThemedText>
        </View>
      ) : (
        <Feather name="chevron-right" size={20} color={theme.textMuted} />
      )}
    </Pressable>
  );

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.avatarText}>
            {user.name.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <ThemedText style={[Typography.h2, styles.userName]}>{user.name}</ThemedText>
        <ThemedText style={[styles.userEmail, { color: theme.textSecondary }]}>
          {user.email}
        </ThemedText>
        {user.isWriter && (
          <View style={[styles.writerBadge, { backgroundColor: theme.secondary }]}>
            <Feather name="feather" size={12} color="#000" />
            <ThemedText style={styles.writerBadgeText}>Writer</ThemedText>
          </View>
        )}
      </View>

      <Card elevation={1}>
        <Pressable
          onPress={() => navigation.navigate("CoinStore")}
          style={styles.coinCard}
        >
          <View style={styles.coinCardLeft}>
            <Image
              source={require("@/assets/images/icons/coin.png")}
              style={styles.coinIconLarge}
            />
            <View>
              <ThemedText style={styles.coinLabel}>Coin Balance</ThemedText>
              <ThemedText style={[Typography.h2, { color: theme.secondary }]}>
                {user.coinBalance}
              </ThemedText>
            </View>
          </View>
          <Feather name="plus-circle" size={24} color={theme.primary} />
        </Pressable>
      </Card>

      <View style={styles.section}>
        <View style={[styles.writerToggleRow, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.writerToggleLeft}>
            <Feather name="feather" size={20} color={theme.text} />
            <ThemedText style={styles.menuItemText}>Writer Mode</ThemedText>
          </View>
          <Switch value={user.isWriter} onValueChange={toggleWriterMode} />
        </View>
      </View>

      {user.isWriter && (
        <View style={styles.section}>
          <MenuItem
            icon="book"
            title="My Novels"
            onPress={() => navigation.navigate("WriterDashboard")}
          />
        </View>
      )}

      <View style={styles.section}>
        <MenuItem icon="settings" title="Settings" onPress={() => {}} />
        <MenuItem icon="help-circle" title="Help & Support" onPress={() => {}} />
        <MenuItem icon="shield" title="Privacy Policy" onPress={() => {}} />
      </View>

      <View style={styles.section}>
        <Pressable
          onPress={logout}
          style={({ pressed }) => [
            styles.logoutButton,
            { backgroundColor: theme.error, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="log-out" size={20} color="#FFFFFF" />
          <ThemedText style={styles.logoutText}>Log Out</ThemedText>
        </Pressable>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  userName: {
    marginBottom: Spacing.xs,
  },
  userEmail: {
    marginBottom: Spacing.sm,
  },
  writerBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    gap: Spacing.xs,
  },
  writerBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  coinCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  coinCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  coinIconLarge: {
    width: 48,
    height: 48,
  },
  coinLabel: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  section: {
    marginTop: Spacing.lg,
  },
  writerToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
  },
  writerToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
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
  },
  menuItemText: {
    fontSize: 16,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
