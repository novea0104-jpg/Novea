import React from "react";
import { View, StyleSheet } from "react-native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, Typography, BorderRadius } from "@/constants/theme";

export default function AdminDashboardScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();

  return (
    <ScreenScrollView>
      <View style={styles.container}>
        <Card elevation={1} style={styles.comingSoonCard}>
          <View style={[styles.iconCircle, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="shield" size={48} color={theme.text} />
          </View>
          
          <ThemedText style={[Typography.h1, styles.title]}>
            Coming Soon
          </ThemedText>
          
          <ThemedText style={[styles.roleText, { color: theme.textSecondary }]}>
            Admin Dashboard for {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'co_admin' ? 'Co Admin' : 'Editor'}
          </ThemedText>
          
          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            Dashboard Admin is under development. Here you'll be able to:
          </ThemedText>
          
          <View style={styles.featureList}>
            <FeatureItem icon="users" text="Manage all users and roles" theme={theme} />
            <FeatureItem icon="book" text="Review and moderate novels" theme={theme} />
            <FeatureItem icon="file-text" text="Approve/reject chapter submissions" theme={theme} />
            <FeatureItem icon="bar-chart-2" text="View platform analytics" theme={theme} />
            <FeatureItem icon="settings" text="Configure app settings" theme={theme} />
            <FeatureItem icon="flag" text="Handle user reports" theme={theme} />
            <FeatureItem icon="dollar-sign" text="Manage monetization & payouts" theme={theme} />
          </View>
          
          <ThemedText style={[styles.footer, { color: theme.textMuted }]}>
            Advanced admin features coming soon.
          </ThemedText>
        </Card>
      </View>
    </ScreenScrollView>
  );
}

function FeatureItem({ icon, text, theme }: { icon: any; text: string; theme: any }) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIconCircle, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name={icon} size={16} color={theme.text} />
      </View>
      <ThemedText style={styles.featureText}>{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing["2xl"],
  },
  comingSoonCard: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    paddingHorizontal: Spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  roleText: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.lg,
    fontWeight: "600",
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: Spacing["2xl"],
    lineHeight: 24,
  },
  featureList: {
    width: "100%",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    fontSize: 15,
    flex: 1,
  },
  footer: {
    fontSize: 13,
    textAlign: "center",
    fontStyle: "italic",
  },
});
