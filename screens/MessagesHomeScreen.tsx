import React, { useState, useCallback } from "react";
import { View, StyleSheet, Pressable, Image, ActivityIndicator } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import { ScreenFlatList } from "@/components/ScreenFlatList";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { RoleBadge } from "@/components/RoleBadge";
import { UserRole } from "@/types/models";
import { UserIcon } from "@/components/icons/UserIcon";
import { MessageSquareIcon } from "@/components/icons/MessageSquareIcon";
import { PlusIcon } from "@/components/icons/PlusIcon";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { getConversations, PMConversation } from "@/utils/supabase";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Kemarin';
  } else if (days < 7) {
    return date.toLocaleDateString('id-ID', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }
}

export default function MessagesHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user, showAuthPrompt } = useAuth();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<PMConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadConversations = useCallback(async (showLoader = true) => {
    if (!user) return;
    if (showLoader) setIsLoading(true);
    try {
      const data = await getConversations(parseInt(user.id));
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadConversations(false);
  };

  const handleNewMessage = () => {
    navigation.navigate('NewMessage');
  };

  const handleOpenConversation = (conversation: PMConversation) => {
    const otherParticipant = conversation.participants.find(p => p.userId !== parseInt(user!.id));
    navigation.navigate('MessageThread', {
      conversationId: conversation.id,
      recipientName: otherParticipant?.userName || 'Pengguna',
      recipientAvatar: otherParticipant?.userAvatar || undefined,
      recipientRole: otherParticipant?.userRole || 'pembaca',
    });
  };

  if (!user) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ alignItems: 'center', gap: 16, padding: 24 }}>
          <MessageSquareIcon size={64} color={theme.textMuted} />
          <ThemedText style={{ fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
            Masuk Diperlukan
          </ThemedText>
          <ThemedText style={{ fontSize: 14, color: theme.textSecondary, textAlign: 'center' }}>
            Silakan masuk untuk mengakses pesan pribadi
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const renderConversation = ({ item }: { item: PMConversation }) => {
    const otherParticipant = item.participants.find(p => p.userId !== parseInt(user.id));
    
    return (
      <Pressable
        onPress={() => handleOpenConversation(item)}
        style={({ pressed }) => [
          styles.conversationItem,
          { opacity: pressed ? 0.7 : 1, backgroundColor: theme.backgroundDefault },
        ]}
      >
        <View style={styles.avatarContainer}>
          {otherParticipant?.userAvatar ? (
            <Image source={{ uri: otherParticipant.userAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
              <UserIcon size={24} color={theme.textMuted} />
            </View>
          )}
          {item.unreadCount > 0 ? (
            <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.unreadText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </ThemedText>
            </View>
          ) : null}
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <View style={styles.nameContainer}>
              <ThemedText style={[styles.userName, item.unreadCount > 0 && { fontWeight: '700' }]} numberOfLines={1}>
                {otherParticipant?.userName || 'Pengguna'}
              </ThemedText>
              <RoleBadge role={(otherParticipant?.userRole || 'pembaca') as UserRole} size="small" />
            </View>
            <ThemedText style={[styles.timestamp, { color: theme.textMuted }]}>
              {formatTime(item.lastMessageAt)}
            </ThemedText>
          </View>
          <ThemedText 
            style={[
              styles.preview, 
              { color: item.unreadCount > 0 ? theme.text : theme.textSecondary },
              item.unreadCount > 0 && { fontWeight: '500' }
            ]} 
            numberOfLines={2}
          >
            {item.lastMessagePreview || 'Belum ada pesan'}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MessageSquareIcon size={64} color={theme.textMuted} />
      <ThemedText style={[styles.emptyTitle, { color: theme.textSecondary }]}>
        Belum Ada Pesan
      </ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: theme.textMuted }]}>
        Mulai percakapan dengan pengguna lain
      </ThemedText>
      <Pressable
        onPress={handleNewMessage}
        style={({ pressed }) => [
          styles.startButton,
          { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <ThemedText style={styles.startButtonText}>Mulai Percakapan</ThemedText>
      </Pressable>
    </View>
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScreenFlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={conversations.length === 0 ? { flex: 1 } : undefined}
          ListEmptyComponent={renderEmpty}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.cardBorder }]} />
          )}
        />
      )}
      
      <Pressable
        onPress={handleNewMessage}
        style={({ pressed }) => [
          styles.fab,
          { 
            backgroundColor: theme.primary, 
            opacity: pressed ? 0.8 : 1,
            bottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <PlusIcon size={24} color="#FFFFFF" />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  preview: {
    fontSize: 14,
    lineHeight: 18,
  },
  separator: {
    height: 1,
    marginLeft: 52 + Spacing.md + Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  startButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
