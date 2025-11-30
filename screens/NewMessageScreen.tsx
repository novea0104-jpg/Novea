import React, { useState, useCallback, useLayoutEffect } from "react";
import { View, StyleSheet, Pressable, Image, TextInput, ActivityIndicator, FlatList } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useHeaderHeight } from "@react-navigation/elements";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { RoleBadge } from "@/components/RoleBadge";
import { UserRole } from "@/types/models";
import { UserIcon } from "@/components/icons/UserIcon";
import { SearchIcon } from "@/components/icons/SearchIcon";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { searchUsersForPM, getOrCreateConversation } from "@/utils/supabase";
import { Spacing, BorderRadius } from "@/constants/theme";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

interface UserSearchResult {
  id: number;
  name: string;
  avatarUrl: string | null;
  role: string;
}

export default function NewMessageScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const headerHeight = useHeaderHeight();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useLayoutEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    
    return () => {
      parent?.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    const timeout = setTimeout(async () => {
      if (!user) return;
      setIsSearching(true);
      try {
        const results = await searchUsersForPM(query.trim(), parseInt(user.id));
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    
    setSearchTimeout(timeout);
  }, [user, searchTimeout]);

  const handleSelectUser = async (selectedUser: UserSearchResult) => {
    if (!user || isCreating) return;
    
    setIsCreating(true);
    try {
      const result = await getOrCreateConversation(parseInt(user.id), selectedUser.id);
      
      if (result.conversationId) {
        navigation.replace('MessageThread', {
          conversationId: result.conversationId,
          recipientName: selectedUser.name,
          recipientAvatar: selectedUser.avatarUrl || undefined,
          recipientRole: selectedUser.role,
        });
      } else {
        console.error('Failed to create conversation:', result.error);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const renderUserItem = ({ item }: { item: UserSearchResult }) => (
    <Pressable
      onPress={() => handleSelectUser(item)}
      disabled={isCreating}
      style={({ pressed }) => [
        styles.userItem,
        { 
          opacity: pressed || isCreating ? 0.7 : 1, 
          backgroundColor: theme.backgroundDefault,
        },
      ]}
    >
      <View style={styles.avatarContainer}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme.backgroundSecondary }]}>
            <UserIcon size={20} color={theme.textMuted} />
          </View>
        )}
      </View>
      
      <View style={styles.userInfo}>
        <View style={styles.nameRow}>
          <ThemedText style={styles.userName} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <RoleBadge role={item.role as UserRole} size="small" />
        </View>
      </View>
    </Pressable>
  );

  const renderEmpty = () => {
    if (searchQuery.trim().length < 2) {
      return (
        <View style={styles.emptyContainer}>
          <SearchIcon size={48} color={theme.textMuted} />
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
            Cari pengguna untuk memulai percakapan
          </ThemedText>
          <ThemedText style={[styles.emptyHint, { color: theme.textMuted }]}>
            Ketik minimal 2 karakter untuk mencari
          </ThemedText>
        </View>
      );
    }
    
    if (isSearching) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <UserIcon size={48} color={theme.textMuted} />
        <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
          Tidak ada pengguna ditemukan
        </ThemedText>
        <ThemedText style={[styles.emptyHint, { color: theme.textMuted }]}>
          Coba kata kunci lain
        </ThemedText>
      </View>
    );
  };

  if (!user) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Masuk diperlukan</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1, paddingTop: headerHeight }}>
      <View style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary }]}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.backgroundDefault }]}>
          <SearchIcon size={20} color={theme.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Cari nama pengguna..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
            autoFocus
          />
          {isSearching ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : null}
        </View>
      </View>
      
      {isCreating ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            Memulai percakapan...
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={searchResults.length === 0 ? { flex: 1 } : { paddingBottom: Spacing.xl }}
          ListEmptyComponent={renderEmpty}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.cardBorder }]} />
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    padding: Spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  avatarContainer: {},
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    marginLeft: 48 + Spacing.md + Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
});
