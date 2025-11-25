import React, { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, Image, ActivityIndicator } from "react-native";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { RoleBadge, UserRole } from "@/components/RoleBadge";
import { UserIcon } from "@/components/icons/UserIcon";
import { BookIcon } from "@/components/icons/BookIcon";
import { StarIcon } from "@/components/icons/StarIcon";
import { EyeIcon } from "@/components/icons/EyeIcon";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getUserById, 
  getUserNovels, 
  getUserFollowStats, 
  isFollowing, 
  followUser, 
  unfollowUser,
  PublicUserProfile,
  UserNovel,
  FollowStats 
} from "@/utils/supabase";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

function toUserRole(role?: string): UserRole {
  const normalizedRole = (role || 'Pembaca').toLowerCase().replace(' ', '_');
  const validRoles: UserRole[] = ['pembaca', 'penulis', 'editor', 'co_admin', 'super_admin'];
  return validRoles.includes(normalizedRole as UserRole) ? normalizedRole as UserRole : 'pembaca';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export default function UserProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  
  const { userId } = route.params as { userId: string };
  
  const [userProfile, setUserProfile] = useState<PublicUserProfile | null>(null);
  const [userNovels, setUserNovels] = useState<UserNovel[]>([]);
  const [followStats, setFollowStats] = useState<FollowStats>({ followersCount: 0, followingCount: 0 });
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const isOwnProfile = currentUser && parseInt(currentUser.id) === parseInt(userId);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Profil",
    });
  }, [navigation]);

  const loadUserProfile = useCallback(async () => {
    setIsLoading(true);
    
    const [profile, novels, stats] = await Promise.all([
      getUserById(parseInt(userId)),
      getUserNovels(parseInt(userId)),
      getUserFollowStats(parseInt(userId)),
    ]);
    
    setUserProfile(profile);
    setUserNovels(novels);
    setFollowStats(stats);
    
    if (currentUser && !isOwnProfile) {
      const following = await isFollowing(parseInt(currentUser.id), parseInt(userId));
      setIsFollowingUser(following);
    }
    
    setIsLoading(false);
  }, [userId, currentUser, isOwnProfile]);

  useFocusEffect(
    useCallback(() => {
      loadUserProfile();
    }, [loadUserProfile])
  );

  const handleFollowToggle = async () => {
    if (!currentUser || isFollowLoading || isOwnProfile) return;
    
    setIsFollowLoading(true);
    
    if (isFollowingUser) {
      const result = await unfollowUser(parseInt(currentUser.id), parseInt(userId));
      if (result.success) {
        setIsFollowingUser(false);
        setFollowStats(prev => ({ ...prev, followersCount: Math.max(0, prev.followersCount - 1) }));
      }
    } else {
      const result = await followUser(parseInt(currentUser.id), parseInt(userId));
      if (result.success) {
        setIsFollowingUser(true);
        setFollowStats(prev => ({ ...prev, followersCount: prev.followersCount + 1 }));
      }
    }
    
    setIsFollowLoading(false);
  };

  const handleNovelPress = (novelId: number) => {
    // Get the tab navigator (parent of current stack navigator)
    const tabNav = navigation.getParent();
    if (tabNav) {
      // Navigate to BrowseTab with NovelDetail screen
      tabNav.navigate("BrowseTab", {
        screen: "NovelDetail",
        params: { novelId: novelId.toString() },
      });
    }
  };

  const handleFollowListPress = (type: "followers" | "following") => {
    if (!userProfile) return;
    // FollowList is available in the current stack (both BrowseStack and ProfileStack)
    navigation.navigate("FollowList", { userId: userId, type, userName: userProfile.name });
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </ThemedView>
    );
  }

  if (!userProfile) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText style={{ color: theme.textSecondary }}>
          Pengguna tidak ditemukan
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScreenScrollView>
      <Card elevation={1} style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {userProfile.avatarUrl ? (
            <Image source={{ uri: userProfile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
              <UserIcon size={40} color={theme.textMuted} />
            </View>
          )}
        </View>

        <ThemedText style={[Typography.h2, styles.userName]}>{userProfile.name}</ThemedText>
        
        <View style={styles.badgeContainer}>
          <RoleBadge role={toUserRole(userProfile.role)} size="medium" />
        </View>

        {userProfile.bio ? (
          <View style={[styles.bioContainer, { borderColor: theme.backgroundSecondary }]}>
            <ThemedText style={[styles.bioText, { color: theme.textSecondary }]}>
              {userProfile.bio}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.followStatsContainer}>
          <Pressable 
            style={styles.followStatItem}
            onPress={() => handleFollowListPress("followers")}
          >
            <ThemedText style={[Typography.h2, styles.followStatValue]}>
              {followStats.followersCount}
            </ThemedText>
            <ThemedText style={[styles.followStatLabel, { color: theme.textSecondary }]}>
              Pengikut
            </ThemedText>
          </Pressable>
          <View style={[styles.followStatDivider, { backgroundColor: theme.backgroundSecondary }]} />
          <Pressable 
            style={styles.followStatItem}
            onPress={() => handleFollowListPress("following")}
          >
            <ThemedText style={[Typography.h2, styles.followStatValue]}>
              {followStats.followingCount}
            </ThemedText>
            <ThemedText style={[styles.followStatLabel, { color: theme.textSecondary }]}>
              Mengikuti
            </ThemedText>
          </Pressable>
        </View>

        {currentUser && !isOwnProfile ? (
          <Pressable
            onPress={handleFollowToggle}
            disabled={isFollowLoading}
            style={[
              styles.followButton,
              isFollowingUser 
                ? { backgroundColor: theme.backgroundSecondary }
                : { backgroundColor: theme.primary }
            ]}
          >
            {isFollowLoading ? (
              <ActivityIndicator size="small" color={isFollowingUser ? theme.text : "#FFFFFF"} />
            ) : (
              <ThemedText style={[
                styles.followButtonText,
                { color: isFollowingUser ? theme.text : "#FFFFFF" }
              ]}>
                {isFollowingUser ? "Mengikuti" : "Ikuti"}
              </ThemedText>
            )}
          </Pressable>
        ) : null}

        <ThemedText style={[styles.joinDate, { color: theme.textMuted }]}>
          Bergabung {formatDate(userProfile.createdAt)}
        </ThemedText>
      </Card>

      {userNovels.length > 0 ? (
        <View style={styles.section}>
          <ThemedText style={[Typography.h3, styles.sectionTitle]}>
            Novel ({userNovels.length})
          </ThemedText>
          {userNovels.map((novel) => (
            <Pressable 
              key={novel.id} 
              onPress={() => handleNovelPress(novel.id)}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Card elevation={1} style={styles.novelCard}>
                {novel.coverUrl ? (
                  <Image source={{ uri: novel.coverUrl }} style={styles.novelCover} />
                ) : (
                  <View style={[styles.novelCover, { backgroundColor: theme.backgroundSecondary }]}>
                    <BookIcon size={24} color={theme.textMuted} />
                  </View>
                )}
                <View style={styles.novelInfo}>
                  <ThemedText style={styles.novelTitle} numberOfLines={2}>
                    {novel.title}
                  </ThemedText>
                  <ThemedText style={[styles.novelGenre, { color: theme.textSecondary }]}>
                    {novel.genre}
                  </ThemedText>
                  <View style={styles.novelStats}>
                    <View style={styles.novelStatItem}>
                      <StarIcon size={14} color="#F59E0B" />
                      <ThemedText style={[styles.novelStatText, { color: theme.textSecondary }]}>
                        {novel.rating.toFixed(1)}
                      </ThemedText>
                    </View>
                    <View style={styles.novelStatItem}>
                      <EyeIcon size={14} color={theme.textMuted} />
                      <ThemedText style={[styles.novelStatText, { color: theme.textSecondary }]}>
                        {novel.totalReads}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.novelStatText, { color: theme.textSecondary }]}>
                      {novel.totalChapters} chapter
                    </ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: novel.status === 'Ongoing' ? '#14B8A620' : '#10B98120' 
                  }]}>
                    <ThemedText style={[styles.statusText, { 
                      color: novel.status === 'Ongoing' ? '#14B8A6' : '#10B981' 
                    }]}>
                      {novel.status}
                    </ThemedText>
                  </View>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.spacer} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
  avatarContainer: {
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    marginBottom: Spacing.xs,
    textAlign: "center",
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
    marginBottom: Spacing.lg,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontStyle: "italic",
  },
  followStatsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  followStatItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  followStatValue: {
    marginBottom: 2,
  },
  followStatLabel: {
    fontSize: 13,
  },
  followStatDivider: {
    width: 1,
    height: 40,
    marginHorizontal: Spacing.xl,
  },
  followButton: {
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 140,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  joinDate: {
    fontSize: 12,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: "700",
  },
  novelCard: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  novelCover: {
    width: 70,
    height: 100,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  novelInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  novelTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  novelGenre: {
    fontSize: 12,
    marginBottom: 6,
  },
  novelStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: 8,
  },
  novelStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  novelStatText: {
    fontSize: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  spacer: {
    height: Spacing["2xl"],
  },
});
