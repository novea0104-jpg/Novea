import React, { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, Image, ActivityIndicator } from "react-native";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { ScreenFlatList } from "@/components/ScreenFlatList";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { RoleBadge, UserRole } from "@/components/RoleBadge";
import { UserIcon } from "@/components/icons/UserIcon";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { getFollowers, getFollowing, FollowUser, followUser, unfollowUser, isFollowing } from "@/utils/supabase";
import { Spacing, BorderRadius } from "@/constants/theme";

function toUserRole(role?: string): UserRole {
  const normalizedRole = (role || 'Pembaca').toLowerCase().replace(' ', '_');
  const validRoles: UserRole[] = ['pembaca', 'penulis', 'editor', 'co_admin', 'super_admin'];
  return validRoles.includes(normalizedRole as UserRole) ? normalizedRole as UserRole : 'pembaca';
}

export default function FollowListScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { user: currentUser } = useAuth();
  
  const { userId, type, userName } = route.params as { 
    userId: string; 
    type: "followers" | "following";
    userName: string;
  };
  
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState<Record<number, boolean>>({});
  const [loadingFollow, setLoadingFollow] = useState<number | null>(null);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: type === "followers" ? "Pengikut" : "Mengikuti",
    });
  }, [navigation, type]);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    const fetchedUsers = type === "followers" 
      ? await getFollowers(parseInt(userId))
      : await getFollowing(parseInt(userId));
    setUsers(fetchedUsers);
    
    if (currentUser) {
      const statusMap: Record<number, boolean> = {};
      for (const u of fetchedUsers) {
        if (u.id !== parseInt(currentUser.id)) {
          statusMap[u.id] = await isFollowing(parseInt(currentUser.id), u.id);
        }
      }
      setFollowingStatus(statusMap);
    }
    
    setIsLoading(false);
  }, [userId, type, currentUser]);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const handleFollowToggle = async (targetUserId: number) => {
    if (!currentUser || loadingFollow !== null) return;
    
    setLoadingFollow(targetUserId);
    
    if (followingStatus[targetUserId]) {
      const result = await unfollowUser(parseInt(currentUser.id), targetUserId);
      if (result.success) {
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: false }));
      }
    } else {
      const result = await followUser(parseInt(currentUser.id), targetUserId);
      if (result.success) {
        setFollowingStatus(prev => ({ ...prev, [targetUserId]: true }));
      }
    }
    
    setLoadingFollow(null);
  };

  const handleUserPress = (userId: number) => {
    navigation.navigate("UserProfile", { userId: userId.toString() });
  };

  const renderUser = ({ item }: { item: FollowUser }) => {
    const isCurrentUser = currentUser && parseInt(currentUser.id) === item.id;
    const isFollowingUser = followingStatus[item.id];
    
    return (
      <Card elevation={1} style={styles.userCard}>
        <Pressable 
          style={styles.userInfo}
          onPress={() => handleUserPress(item.id)}
        >
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
              <UserIcon size={20} color={theme.textMuted} />
            </View>
          )}
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <ThemedText style={styles.userName}>{item.name}</ThemedText>
              <RoleBadge role={toUserRole(item.role)} size="small" />
            </View>
          </View>
        </Pressable>
        
        {currentUser && !isCurrentUser ? (
          <Pressable
            onPress={() => handleFollowToggle(item.id)}
            style={[
              styles.followButton,
              isFollowingUser 
                ? { backgroundColor: theme.backgroundSecondary }
                : { backgroundColor: theme.primary }
            ]}
            disabled={loadingFollow === item.id}
          >
            {loadingFollow === item.id ? (
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
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundDefault }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScreenFlatList
      data={users}
      renderItem={renderUser}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            {type === "followers" 
              ? "Belum ada pengikut"
              : "Belum mengikuti siapapun"
            }
          </ThemedText>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    flexGrow: 1,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  userDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
  },
  followButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    minWidth: 90,
    alignItems: "center",
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
  emptyText: {
    fontSize: 15,
  },
});
