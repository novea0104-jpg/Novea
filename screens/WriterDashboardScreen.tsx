import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { AreaChart } from "@/components/charts/AreaChart";
import { BarChart } from "@/components/charts/BarChart";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { useAuth } from "@/contexts/AuthContext";
import { useWriterAnalytics } from "@/hooks/useWriterAnalytics";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import { Spacing, BorderRadius } from "@/constants/theme";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function WriterDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const screenInsets = useScreenInsets();
  const { user } = useAuth();
  
  const {
    stats,
    dailyEarnings,
    novelPerformance,
    loading,
    refresh,
  } = useWriterAnalytics(user?.id);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString("id-ID")}`;
  const formatNovoin = (amount: number) => `${amount.toLocaleString("id-ID")} Novoin`;

  const renderStatsCards = () => (
    <View style={styles.statsGrid}>
      <LinearGradient
        colors={["#8B5CF6", "#6D28D9"]}
        style={styles.mainStatCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.mainStatIcon}>
          <Image source={require("@/assets/images/icons/coin.png")} style={styles.coinIcon} />
        </View>
        <ThemedText style={styles.mainStatLabel}>Saldo Tersedia</ThemedText>
        <ThemedText style={styles.mainStatValue}>
          {formatNovoin(stats?.availableBalance || 0)}
        </ThemedText>
        <ThemedText style={styles.mainStatSubtext}>
          = {formatCurrency((stats?.availableBalance || 0) * 1000)}
        </ThemedText>
      </LinearGradient>

      <View style={styles.statsRow}>
        <Card elevation={1} style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: theme.success + "20" }]}>
            <Feather name="trending-up" size={18} color={theme.success} />
          </View>
          <ThemedText style={[styles.statValue, { color: theme.success }]}>
            {formatNovoin(stats?.thisMonthEarnings || 0)}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Bulan Ini
          </ThemedText>
          {stats && stats.growthPercent !== 0 && (
            <View style={[styles.growthBadge, { 
              backgroundColor: stats.growthPercent > 0 ? theme.success + "20" : theme.error + "20" 
            }]}>
              <Feather 
                name={stats.growthPercent > 0 ? "arrow-up" : "arrow-down"} 
                size={10} 
                color={stats.growthPercent > 0 ? theme.success : theme.error} 
              />
              <ThemedText style={[styles.growthText, { 
                color: stats.growthPercent > 0 ? theme.success : theme.error 
              }]}>
                {Math.abs(stats.growthPercent)}%
              </ThemedText>
            </View>
          )}
        </Card>

        <Card elevation={1} style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="award" size={18} color={theme.primary} />
          </View>
          <ThemedText style={[styles.statValue, { color: theme.primary }]}>
            {formatNovoin(stats?.totalEarnings || 0)}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Total Pendapatan
          </ThemedText>
        </Card>
      </View>

      <View style={styles.statsRow}>
        <Card elevation={1} style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: theme.warning + "20" }]}>
            <Feather name="clock" size={18} color={theme.warning} />
          </View>
          <ThemedText style={[styles.statValue, { color: theme.warning }]}>
            {formatNovoin(stats?.pendingWithdrawal || 0)}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Pending WD
          </ThemedText>
        </Card>

        <Card elevation={1} style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: theme.secondary + "20" }]}>
            <Feather name="book-open" size={18} color={theme.secondary} />
          </View>
          <ThemedText style={[styles.statValue, { color: theme.secondary }]}>
            {novelPerformance.length}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Novel Aktif
          </ThemedText>
        </Card>
      </View>
    </View>
  );

  const renderAnalyticsSection = () => (
    <View style={styles.analyticsSection}>
      <AreaChart
        data={dailyEarnings.map((d) => ({ label: d.label, value: d.writerShare }))}
        title="Pendapatan 14 Hari Terakhir"
        subtitle="Berdasarkan unlock chapter"
        gradientColors={["#8B5CF6", "#EC4899"]}
        lineColor="#8B5CF6"
        formatValue={formatNovoin}
      />

      <View style={{ height: Spacing.lg }} />

      <BarChart
        data={novelPerformance.slice(0, 5).map((n) => ({
          label: n.novelTitle.length > 12 ? n.novelTitle.slice(0, 12) + "..." : n.novelTitle,
          value: n.writerEarnings,
        }))}
        title="Performa Novel (Top 5)"
        horizontal
        gradientColors={["#10B981", "#059669"]}
        formatValue={formatNovoin}
      />

      <View style={{ height: Spacing.lg }} />

      <Card elevation={1} style={styles.novelListCard}>
        <ThemedText style={styles.sectionTitle}>Detail Per Novel</ThemedText>
        {novelPerformance.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="book" size={32} color={theme.textMuted} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Belum ada data penjualan
            </ThemedText>
          </View>
        ) : (
          novelPerformance.map((novel, index) => (
            <View 
              key={novel.novelId} 
              style={[
                styles.novelItem, 
                index < novelPerformance.length - 1 && styles.novelItemBorder,
                { borderColor: theme.cardBorder }
              ]}
            >
              <View style={styles.novelInfo}>
                <ThemedText style={styles.novelTitle} numberOfLines={1}>
                  {novel.novelTitle}
                </ThemedText>
                <View style={styles.novelStats}>
                  <View style={styles.novelStat}>
                    <Feather name="unlock" size={12} color={theme.textMuted} />
                    <ThemedText style={[styles.novelStatText, { color: theme.textSecondary }]}>
                      {novel.totalUnlocks} unlock
                    </ThemedText>
                  </View>
                  <View style={styles.novelStat}>
                    <Feather name="users" size={12} color={theme.textMuted} />
                    <ThemedText style={[styles.novelStatText, { color: theme.textSecondary }]}>
                      {novel.uniqueReaders} pembaca
                    </ThemedText>
                  </View>
                </View>
              </View>
              <View style={styles.novelEarnings}>
                <ThemedText style={[styles.novelEarningsValue, { color: theme.success }]}>
                  {formatNovoin(novel.writerEarnings)}
                </ThemedText>
              </View>
            </View>
          ))
        )}
      </Card>
    </View>
  );

  if (loading && !stats) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
          Memuat data...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: screenInsets.paddingTop, paddingBottom: screenInsets.paddingBottom + 80 },
        ]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {message && (
          <View style={[
            styles.messageBar, 
            { backgroundColor: message.type === "success" ? theme.success : theme.error }
          ]}>
            <Feather 
              name={message.type === "success" ? "check-circle" : "alert-circle"} 
              size={16} 
              color="#FFF" 
            />
            <ThemedText style={styles.messageText}>{message.text}</ThemedText>
            <Pressable onPress={() => setMessage(null)} hitSlop={8}>
              <Feather name="x" size={16} color="#FFF" />
            </Pressable>
          </View>
        )}

        {renderAnalyticsSection()}

        {renderStatsCards()}
      </ScrollView>

      <FloatingActionButton
        onPress={() => navigation.navigate("EditChapter", { novelId: "new", chapterId: undefined })}
        icon="plus"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  content: {
    padding: Spacing.lg,
  },
  messageBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  messageText: {
    flex: 1,
    color: "#FFF",
    fontSize: 13,
  },
  analyticsSection: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statsGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  mainStatCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  mainStatIcon: {
    marginBottom: Spacing.sm,
  },
  coinIcon: {
    width: 40,
    height: 40,
  },
  mainStatLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  mainStatValue: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "700",
  },
  mainStatSubtext: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: "center",
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  statLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
    gap: 2,
  },
  growthText: {
    fontSize: 10,
    fontWeight: "600",
  },
  tabBar: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: "transparent",
    gap: Spacing.sm,
  },
  tabButtonActive: {
    borderWidth: 1,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  tabContent: {
    gap: Spacing.lg,
  },
  sectionCard: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["3xl"],
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 13,
  },
  novelListCard: {
    padding: Spacing.lg,
  },
  novelItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  novelItemBorder: {
    borderBottomWidth: 1,
  },
  novelInfo: {
    flex: 1,
  },
  novelTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  novelStats: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  novelStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  novelStatText: {
    fontSize: 11,
  },
  novelEarnings: {
    alignItems: "flex-end",
  },
  novelEarningsValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  withdrawButton: {
    marginBottom: Spacing.lg,
  },
  withdrawButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  withdrawButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  bankAccountItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  bankAccountInfo: {
    flex: 1,
  },
  bankAccountHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  bankName: {
    fontSize: 14,
    fontWeight: "600",
  },
  primaryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  accountNumber: {
    fontSize: 13,
    marginBottom: 2,
  },
  accountHolder: {
    fontSize: 12,
  },
  withdrawalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  withdrawalInfo: {
    flex: 1,
  },
  withdrawalAmount: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  withdrawalBank: {
    fontSize: 12,
    marginBottom: 2,
  },
  withdrawalDate: {
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  modalBody: {
    padding: Spacing.lg,
  },
  modalFooter: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  submitButton: {},
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
  },
  bankList: {
    gap: Spacing.sm,
  },
  bankOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
  },
  bankOptionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  bankOptionSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  balanceInfo: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  feeInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  feeText: {
    fontSize: 12,
  },
});
