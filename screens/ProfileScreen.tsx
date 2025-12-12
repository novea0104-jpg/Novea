import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, Pressable, Image, Modal, TextInput, ActivityIndicator, Alert } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { RoleBadge } from "@/components/RoleBadge";
import { UserIcon } from "@/components/icons/UserIcon";
import { CheckIcon } from "@/components/icons/CheckIcon";
import { ChevronRightIcon } from "@/components/icons/ChevronRightIcon";
import { AwardIcon } from "@/components/icons/AwardIcon";
import { ShieldIcon } from "@/components/icons/ShieldIcon";
import { BookIcon } from "@/components/icons/BookIcon";
import { FeatherIcon } from "@/components/icons/FeatherIcon";
import { AlertCircleIcon } from "@/components/icons/AlertCircleIcon";
import { LogOutIcon } from "@/components/icons/LogOutIcon";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { MessageSquareIcon } from "@/components/icons/MessageSquareIcon";
import { ShareIcon } from "@/components/icons/ShareIcon";
import { XIcon } from "@/components/icons/XIcon";
import { ShareModal } from "@/components/ShareModal";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFollowStats, FollowStats, getTotalUnreadCount, createTimelinePost } from "@/utils/supabase";
import { formatRupiah, NOVOIN_TO_RUPIAH } from "@/constants/pricing";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user, logout, upgradeToWriter, showAuthPrompt } = useAuth();
  const [followStats, setFollowStats] = useState<FollowStats>({ followersCount: 0, followingCount: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCaption, setShareCaption] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [showSocialShareModal, setShowSocialShareModal] = useState(false);

  useEffect(() => {
    if (!user) {
      showAuthPrompt("Masuk untuk melihat profilmu");
    }
  }, [user]);

  const loadFollowStats = useCallback(async () => {
    if (user) {
      setIsLoadingStats(true);
      const stats = await getUserFollowStats(parseInt(user.id));
      setFollowStats(stats);
      setIsLoadingStats(false);
    }
  }, [user]);

  const loadUnreadCount = useCallback(async () => {
    if (user) {
      const count = await getTotalUnreadCount(parseInt(user.id));
      setUnreadMessageCount(count);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadFollowStats();
      loadUnreadCount();
    }, [loadFollowStats, loadUnreadCount])
  );

  const handleOpenShareModal = () => {
    if (!user) return;
    const roleText = user.role === 'penulis' ? 'Penulis' : user.role === 'pembaca' ? 'Pembaca' : user.role;
    setShareCaption(`Hai! Aku ${user.name}, seorang ${roleText} di Novea. Yuk follow aku untuk update terbaru!`);
    setShowShareModal(true);
  };

  const handleShareToTimeline = async () => {
    if (!user || !shareCaption.trim()) return;
    
    setIsSharing(true);
    try {
      const result = await createTimelinePost(
        parseInt(user.id),
        shareCaption.trim(),
        undefined,
        undefined
      );
      
      if (result.success) {
        setShowShareModal(false);
        setShareCaption("");
        Alert.alert("Berhasil", "Profil berhasil dibagikan ke Linimasa!");
      } else {
        Alert.alert("Gagal", result.error || "Gagal membagikan profil");
      }
    } catch (error) {
      Alert.alert("Error", "Terjadi kesalahan saat membagikan");
    } finally {
      setIsSharing(false);
    }
  };

  if (!user) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ alignItems: 'center', gap: 16, padding: 24 }}>
          <UserIcon size={64} color={theme.textMuted} />
          <ThemedText style={{ fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
            Masuk Diperlukan
          </ThemedText>
          <ThemedText style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center' }}>
            Silakan masuk untuk mengakses profil, pengaturan, dan saldo Novoin kamu
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

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
    message: <MessageSquareIcon size={20} color={theme.text} />,
  };

  const MenuItem = ({ icon, title, subtitle, onPress, badge }: any) => (
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
      <View style={styles.menuItemRight}>
        {badge && badge > 0 ? (
          <View style={styles.menuBadge}>
            <ThemedText style={styles.menuBadgeText}>
              {badge > 99 ? '99+' : badge}
            </ThemedText>
          </View>
        ) : null}
        <ChevronRightIcon size={18} color={theme.textMuted} />
      </View>
    </Pressable>
  );

  return (
    <ScreenScrollView>
      <Card elevation={1} style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
                <UserIcon size={24} color={theme.text} />
              </View>
            )}
            <View style={styles.editBadge}>
              <CheckIcon size={10} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <ThemedText style={styles.userName}>{user.name}</ThemedText>
            <ThemedText style={[styles.userHandle, { color: theme.textSecondary }]}>
              @{user.email.split("@")[0]}
            </ThemedText>
            <RoleBadge role={user.role} size="small" />
          </View>
          <Pressable 
            onPress={handleOpenShareModal}
            style={[styles.shareButton, { backgroundColor: theme.backgroundSecondary }]}
          >
            <ShareIcon size={20} color={theme.text} />
          </Pressable>
        </View>

        {user.bio ? (
          <ThemedText style={[styles.bioText, { color: theme.textSecondary }]} numberOfLines={2}>
            {user.bio}
          </ThemedText>
        ) : null}

        <View style={styles.followStatsContainer}>
          <Pressable 
            style={styles.followStatItem}
            onPress={() => navigation.navigate("FollowList", { userId: user.id, type: "followers", userName: user.name })}
          >
            <ThemedText style={styles.followStatValue}>
              {isLoadingStats ? '-' : followStats.followersCount}
            </ThemedText>
            <ThemedText style={[styles.followStatLabel, { color: theme.textSecondary }]}>
              Pengikut
            </ThemedText>
          </Pressable>
          <View style={[styles.followStatDivider, { backgroundColor: theme.backgroundSecondary }]} />
          <Pressable 
            style={styles.followStatItem}
            onPress={() => navigation.navigate("FollowList", { userId: user.id, type: "following", userName: user.name })}
          >
            <ThemedText style={styles.followStatValue}>
              {isLoadingStats ? '-' : followStats.followingCount}
            </ThemedText>
            <ThemedText style={[styles.followStatLabel, { color: theme.textSecondary }]}>
              Mengikuti
            </ThemedText>
          </Pressable>
        </View>
      </Card>

      <Pressable 
        onPress={() => navigation.navigate("CoinStore")}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <LinearGradient
          colors={["#FFD700", "#FFA500"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.coinBalanceCard}
        >
          <View style={styles.coinBalanceLeft}>
            <CoinIcon size={28} color="#000000" />
            <View>
              <ThemedText style={styles.coinBalanceLabel}>Saldo Novoin</ThemedText>
              <ThemedText style={styles.coinBalanceValue}>
                {user?.coinBalance || 0} Novoin
              </ThemedText>
            </View>
          </View>
          <View style={styles.coinBalanceRight}>
            <ThemedText style={styles.coinBalanceAction}>Beli Novoin</ThemedText>
            <ChevronRightIcon size={18} color="#000000" />
          </View>
        </LinearGradient>
      </Pressable>

      <View style={styles.section}>
        <ThemedText style={[Typography.h3, styles.sectionTitle]}>Akun</ThemedText>
        <MenuItem
          icon="user"
          title="Edit Profil"
          subtitle="Ubah foto & informasi"
          onPress={() => navigation.navigate("EditProfile")}
        />
        <MenuItem
          icon="message"
          title="Pesan Pribadi"
          subtitle="Chat dengan pengguna lain"
          onPress={() => navigation.navigate("Messages")}
          badge={unreadMessageCount}
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
          onPress={() => navigation.navigate("Policy")}
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

      <Modal
        visible={showShareModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.shareModalOverlay}>
          <View style={[styles.shareModalContent, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.shareModalHeader}>
              <ThemedText style={[Typography.h3, { flex: 1 }]}>Bagikan Profilmu</ThemedText>
              <Pressable onPress={() => setShowShareModal(false)} style={styles.shareModalClose}>
                <XIcon size={24} color={theme.text} />
              </Pressable>
            </View>

            <View style={[styles.shareProfilePreview, { backgroundColor: theme.backgroundSecondary }]}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.shareProfileAvatar} />
              ) : (
                <View style={[styles.shareProfileAvatar, { backgroundColor: theme.backgroundRoot, justifyContent: 'center', alignItems: 'center' }]}>
                  <UserIcon size={24} color={theme.textMuted} />
                </View>
              )}
              <View style={styles.shareProfileInfo}>
                <ThemedText style={styles.shareProfileName}>{user.name}</ThemedText>
                <ThemedText style={[styles.shareProfileHandle, { color: theme.textSecondary }]}>
                  @{user.email.split("@")[0]}
                </ThemedText>
                <RoleBadge role={user.role} size="small" />
              </View>
            </View>

            <TextInput
              value={shareCaption}
              onChangeText={setShareCaption}
              placeholder="Tulis caption..."
              placeholderTextColor={theme.textMuted}
              multiline
              style={[styles.shareCaptionInput, { 
                backgroundColor: theme.backgroundSecondary, 
                color: theme.text,
                borderColor: theme.cardBorder,
              }]}
            />

            <Pressable
              onPress={handleShareToTimeline}
              disabled={isSharing || !shareCaption.trim()}
              style={({ pressed }) => [
                styles.shareSubmitButton,
                { 
                  backgroundColor: shareCaption.trim() ? theme.primary : theme.backgroundSecondary,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              {isSharing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <ThemedText style={[styles.shareSubmitButtonText, { color: shareCaption.trim() ? "#FFFFFF" : theme.textMuted }]}>
                  Bagikan ke Linimasa
                </ThemedText>
              )}
            </Pressable>

            <View style={styles.shareDivider}>
              <View style={[styles.shareDividerLine, { backgroundColor: theme.cardBorder }]} />
              <ThemedText style={[styles.shareDividerText, { color: theme.textMuted }]}>atau</ThemedText>
              <View style={[styles.shareDividerLine, { backgroundColor: theme.cardBorder }]} />
            </View>

            <Pressable
              onPress={() => {
                setShowShareModal(false);
                setShowSocialShareModal(true);
              }}
              style={({ pressed }) => [
                styles.shareSubmitButton,
                { 
                  backgroundColor: theme.backgroundSecondary,
                  borderWidth: 1,
                  borderColor: theme.cardBorder,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <ThemedText style={[styles.shareSubmitButtonText, { color: theme.text }]}>
                Bagikan ke Media Sosial
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ShareModal
        visible={showSocialShareModal}
        onClose={() => setShowSocialShareModal(false)}
        title={user?.name || "Profil Novea"}
        message={`Ikuti ${user?.name || "aku"} di Novea untuk update novel terbaru!`}
        url={`https://noveaindonesia.com/user/${user?.id}`}
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    padding: Spacing.lg,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  editBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#14B8A6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1A1A1A",
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
  },
  userHandle: {
    fontSize: 13,
    marginBottom: 4,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  followStatsContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  followStatItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  followStatValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  followStatLabel: {
    fontSize: 13,
  },
  followStatDivider: {
    width: 1,
    height: 24,
    marginHorizontal: Spacing.lg,
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
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  menuBadge: {
    backgroundColor: "#EF4444",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  menuBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
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
  coinBalanceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  coinBalanceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  coinBalanceLabel: {
    fontSize: 12,
    color: "#000000",
    opacity: 0.7,
  },
  coinBalanceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  coinBalanceRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  coinBalanceAction: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  shareModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  shareModalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  shareModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  shareModalClose: {
    padding: Spacing.xs,
  },
  shareProfilePreview: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    alignItems: "center",
  },
  shareProfileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  shareProfileInfo: {
    flex: 1,
    gap: 2,
  },
  shareProfileName: {
    fontSize: 16,
    fontWeight: "600",
  },
  shareProfileHandle: {
    fontSize: 13,
    marginBottom: 4,
  },
  shareCaptionInput: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  shareSubmitButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  shareSubmitButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  shareDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  shareDividerLine: {
    flex: 1,
    height: 1,
  },
  shareDividerText: {
    fontSize: 12,
  },
});
