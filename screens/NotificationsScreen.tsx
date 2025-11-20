import React from "react";
import { FlatList, StyleSheet, Pressable, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { NotificationsStackParamList } from "@/navigation/NotificationsStackNavigator";
import { Spacing, BorderRadius } from "@/constants/theme";
import { mockNotifications } from "@/utils/mockData";

type NavigationProp = NativeStackNavigationProp<NotificationsStackParamList>;

export default function NotificationsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const screenInsets = useScreenInsets();

  const getIcon = (type: string) => {
    switch (type) {
      case "new_chapter":
        return "book";
      case "promotion":
        return "gift";
      default:
        return "bell";
    }
  };

  const renderNotification = ({ item }: any) => (
    <Pressable
      onPress={() => {
        if (item.novelId) {
          navigation.navigate("NovelDetail", { novelId: item.novelId });
        }
      }}
      style={({ pressed }) => [
        styles.notificationItem,
        {
          backgroundColor: item.isRead ? theme.backgroundRoot : theme.backgroundDefault,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.primary }]}>
        <Feather name={getIcon(item.type) as any} size={20} color="#FFFFFF" />
      </View>
      <View style={styles.notificationContent}>
        <ThemedText style={styles.notificationTitle}>{item.title}</ThemedText>
        <ThemedText style={[styles.notificationMessage, { color: theme.textSecondary }]}>
          {item.message}
        </ThemedText>
        <ThemedText style={[styles.notificationTime, { color: theme.textMuted }]}>
          {formatTime(item.createdAt)}
        </ThemedText>
      </View>
      {!item.isRead && (
        <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
      )}
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      {mockNotifications.length === 0 ? (
        <EmptyState
          type="notifications"
          title="No Notifications"
          message="You're all caught up!"
        />
      ) : (
        <FlatList
          data={mockNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingTop: screenInsets.paddingTop, paddingBottom: screenInsets.paddingBottom },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
