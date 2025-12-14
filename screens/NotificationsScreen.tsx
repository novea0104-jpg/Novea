import React, { useEffect, useState, useCallback } from "react";
import { FlatList, StyleSheet, Pressable, View, RefreshControl, ActivityIndicator } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { BookIcon } from "@/components/icons/BookIcon";
import { GiftIcon } from "@/components/icons/GiftIcon";
import { BellIcon } from "@/components/icons/BellIcon";
import { UserIcon } from "@/components/icons/UserIcon";
import { MessageSquareIcon } from "@/components/icons/MessageSquareIcon";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { useResponsive } from "@/hooks/useResponsive";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationsStackParamList } from "@/navigation/NotificationsStackNavigator";
import { Spacing, BorderRadius } from "@/constants/theme";
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  Notification 
} from "@/utils/supabase";

type NavigationProp = NativeStackNavigationProp<NotificationsStackParamList>;

export default function NotificationsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const screenInsets = useScreenInsets();
  const { isDesktop, isTablet } = useResponsive();
  const { user, showAuthPrompt } = useAuth();
  
  const sidebarWidth = (isDesktop || isTablet) ? 220 : 0;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getNotifications(parseInt(user.id));
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  useEffect(() => {
    if (!user) {
      showAuthPrompt("Masuk untuk melihat notifikasi");
    }
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
    }

    // Navigate based on notification type and available data
    switch (notification.type) {
      case "new_chapter":
        // Go directly to the chapter reader
        if (notification.chapterId && notification.novelId) {
          navigation.navigate("Reader", { 
            chapterId: String(notification.chapterId), 
            novelId: String(notification.novelId) 
          });
        } else if (notification.novelId) {
          navigation.navigate("NovelDetail", { novelId: String(notification.novelId) });
        }
        break;
        
      case "new_novel":
        // Go to novel detail page
        if (notification.novelId) {
          navigation.navigate("NovelDetail", { novelId: String(notification.novelId) });
        }
        break;
        
      case "comment_reply":
        // Go to the novel detail where the review/comment is
        if (notification.novelId) {
          navigation.navigate("NovelDetail", { novelId: String(notification.novelId) });
        }
        break;
        
      case "new_timeline_post":
      case "admin_announcement":
      case "admin_timeline_post":
        // Go to Timeline tab
        navigation.getParent()?.navigate("TimelineTab");
        break;
        
      case "new_follower":
        // Go to the follower's profile
        if (notification.actorId) {
          navigation.navigate("UserProfile", { userId: notification.actorId });
        }
        break;
        
      default:
        // Fallback: try to navigate based on available data
        if (notification.novelId) {
          navigation.navigate("NovelDetail", { novelId: String(notification.novelId) });
        } else if (notification.timelinePostId) {
          navigation.getParent()?.navigate("TimelineTab");
        }
        break;
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(parseInt(user.id));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  if (!user) {
    return (
      <EmptyState
        type="notifications"
        title="Masuk Diperlukan"
        message="Silakan masuk untuk melihat notifikasi dan update terbaru dari novel favoritmu"
      />
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "new_chapter":
        return <BookIcon size={20} color="#FFFFFF" />;
      case "new_novel":
        return <BookIcon size={20} color="#FFFFFF" />;
      case "new_timeline_post":
      case "admin_timeline_post":
        return <MessageSquareIcon size={20} color="#FFFFFF" />;
      case "comment_reply":
        return <MessageSquareIcon size={20} color="#FFFFFF" />;
      case "new_follower":
        return <UserIcon size={20} color="#FFFFFF" />;
      case "promotion":
        return <GiftIcon size={20} color="#FFFFFF" />;
      default:
        return <BellIcon size={20} color="#FFFFFF" />;
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case "new_chapter":
      case "new_novel":
        return "#8B5CF6";
      case "admin_timeline_post":
        return "#EF4444";
      case "new_timeline_post":
        return "#3B82F6";
      case "comment_reply":
        return "#10B981";
      case "new_follower":
        return "#F59E0B";
      case "promotion":
        return "#EC4899";
      default:
        return theme.primary;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <Pressable
      onPress={() => handleNotificationPress(item)}
      style={({ pressed }) => [
        styles.notificationItem,
        {
          backgroundColor: item.isRead ? theme.backgroundRoot : theme.backgroundDefault,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: getIconColor(item.type) }]}>
        {getIcon(item.type)}
      </View>
      <View style={styles.notificationContent}>
        <ThemedText style={styles.notificationTitle}>{item.title}</ThemedText>
        <ThemedText style={[styles.notificationMessage, { color: theme.textSecondary }]}>
          {item.message}
        </ThemedText>
        <ThemedText style={[styles.notificationTime, { color: theme.textMuted }]}>
          {formatTime(new Date(item.createdAt))}
        </ThemedText>
      </View>
      {!item.isRead ? (
        <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
      ) : null}
    </Pressable>
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <ThemedView style={[styles.container, { marginLeft: sidebarWidth }]}>
      {unreadCount > 0 ? (
        <Pressable
          onPress={handleMarkAllRead}
          style={[styles.markAllReadButton, { backgroundColor: theme.backgroundDefault }]}
        >
          <ThemedText style={[styles.markAllReadText, { color: theme.primary }]}>
            Tandai Semua Sudah Dibaca ({unreadCount})
          </ThemedText>
        </Pressable>
      ) : null}
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState
          type="notifications"
          title="Belum Ada Notifikasi"
          message="Kamu akan menerima notifikasi saat ada update baru dari novel yang kamu ikuti"
        />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.list,
            { paddingTop: unreadCount > 0 ? 0 : screenInsets.paddingTop, paddingBottom: screenInsets.paddingBottom },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
            />
          }
        />
      )}
    </ThemedView>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  return date.toLocaleDateString("id-ID");
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  markAllReadButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
  markAllReadText: {
    fontSize: 14,
    fontWeight: "600",
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  notificationItem: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  notificationTime: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignSelf: "center",
  },
});
