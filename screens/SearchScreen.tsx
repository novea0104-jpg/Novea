import React, { useState, useEffect } from "react";
import { View, StyleSheet, TextInput, FlatList, Pressable, Image, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { SearchIcon } from "@/components/icons/SearchIcon";
import { XIcon } from "@/components/icons/XIcon";
import { UserIcon } from "@/components/icons/UserIcon";
import { BookIcon } from "@/components/icons/BookIcon";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/utils/supabase";
import { BrowseStackParamList } from "@/navigation/BrowseStackNavigator";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Novel } from "@/types/models";

type NavigationProp = NativeStackNavigationProp<BrowseStackParamList>;

interface UserResult {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
}

export default function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { searchNovels } = useApp();

  const [query, setQuery] = useState("");
  const [novelResults, setNovelResults] = useState<Novel[]>([]);
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [activeTab, setActiveTab] = useState<"novels" | "users">("novels");
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  const coverImageSource = {
    romance: require("@/assets/images/novels/romance.png"),
    fantasy: require("@/assets/images/novels/fantasy.png"),
    thriller: require("@/assets/images/novels/thriller.png"),
    mystery: require("@/assets/images/novels/mystery.png"),
    adventure: require("@/assets/images/novels/adventure.png"),
  };

  useEffect(() => {
    if (query.trim().length > 0) {
      setNovelResults(searchNovels(query));
      searchUsers(query);
    } else {
      setNovelResults([]);
      setUserResults([]);
    }
  }, [query]);

  const searchUsers = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setUserResults([]);
      return;
    }

    setIsSearchingUsers(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, avatar_url, role")
        .ilike("name", `%${searchQuery}%`)
        .limit(20);

      if (error) throw error;

      const mappedUsers: UserResult[] = (data || []).map((u: any) => ({
        id: u.id.toString(),
        name: u.name,
        avatarUrl: u.avatar_url,
        role: u.role,
      }));

      setUserResults(mappedUsers);
    } catch (error) {
      console.error("Error searching users:", error);
      setUserResults([]);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleSearch = (text: string) => {
    setQuery(text);
  };

  const renderNovel = ({ item }: { item: Novel }) => {
    const placeholderImage = coverImageSource[item.genre.toLowerCase() as keyof typeof coverImageSource];
    const imageSource = item.coverImage ? { uri: item.coverImage } : placeholderImage;

    return (
      <Pressable
        onPress={() => {
          navigation.goBack();
          navigation.navigate("NovelDetail", { novelId: item.id });
        }}
        style={({ pressed }) => [
          styles.novelCard,
          { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Image source={imageSource} style={styles.novelCover} resizeMode="cover" />
        <View style={styles.novelInfo}>
          <ThemedText style={styles.novelTitle} numberOfLines={2}>
            {item.title}
          </ThemedText>
          <ThemedText style={[styles.novelAuthor, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.author}
          </ThemedText>
          <View style={[styles.genreTag, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.genreText}>{item.genre}</ThemedText>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderUser = ({ item }: { item: UserResult }) => {
    return (
      <Pressable
        onPress={() => {
          navigation.goBack();
          navigation.navigate("UserProfile", { userId: item.id });
        }}
        style={({ pressed }) => [
          styles.userCard,
          { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.userAvatar} />
        ) : (
          <View style={[styles.userAvatarPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
            <UserIcon size={24} color={theme.textSecondary} />
          </View>
        )}
        <View style={styles.userInfo}>
          <ThemedText style={styles.userName} numberOfLines={1}>
            {item.name}
          </ThemedText>
          <ThemedText style={[styles.userRole, { color: theme.textSecondary }]}>
            {item.role === "penulis" ? "Penulis" : "Pembaca"}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  const hasResults = activeTab === "novels" ? novelResults.length > 0 : userResults.length > 0;
  const isLoading = activeTab === "users" && isSearchingUsers;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.searchBar, { paddingTop: insets.top, backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.searchInput, { backgroundColor: theme.backgroundDefault }]}>
          <SearchIcon size={20} color={theme.textSecondary} />
          <TextInput
            value={query}
            onChangeText={handleSearch}
            placeholder="Cari novel atau penulis..."
            placeholderTextColor={isDark ? "#9BA1A6" : "#687076"}
            style={[styles.input, { color: theme.text }]}
            autoFocus
          />
          {query.length > 0 ? (
            <Pressable onPress={() => handleSearch("")}>
              <XIcon size={20} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.tabContainer}>
          <Pressable
            onPress={() => setActiveTab("novels")}
            style={[
              styles.tab,
              activeTab === "novels" && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
            ]}
          >
            <BookIcon size={16} color={activeTab === "novels" ? theme.primary : theme.textSecondary} />
            <ThemedText
              style={[
                styles.tabText,
                { color: activeTab === "novels" ? theme.primary : theme.textSecondary },
              ]}
            >
              Novel
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("users")}
            style={[
              styles.tab,
              activeTab === "users" && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
            ]}
          >
            <UserIcon size={16} color={activeTab === "users" ? theme.primary : theme.textSecondary} />
            <ThemedText
              style={[
                styles.tabText,
                { color: activeTab === "users" ? theme.primary : theme.textSecondary },
              ]}
            >
              Penulis
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {query.trim().length === 0 ? (
        <View style={styles.placeholder}>
          <SearchIcon size={48} color={theme.textMuted} />
          <ThemedText style={[styles.placeholderText, { color: theme.textSecondary }]}>
            Cari novel atau penulis favoritmu
          </ThemedText>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : !hasResults ? (
        <EmptyState
          type="search"
          title="Tidak Ditemukan"
          message={`Tidak ada ${activeTab === "novels" ? "novel" : "penulis"} untuk "${query}"`}
        />
      ) : activeTab === "novels" ? (
        <FlatList
          data={novelResults}
          renderItem={renderNovel}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.resultsList, { paddingBottom: insets.bottom }]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={userResults}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.resultsList, { paddingBottom: insets.bottom }]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBar: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 48,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(128, 128, 128, 0.3)",
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: 48,
    paddingVertical: 0,
  },
  tabContainer: {
    flexDirection: "row",
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.md,
  },
  placeholderText: {
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resultsList: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  novelCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  novelCover: {
    width: 80,
    height: 120,
    borderRadius: BorderRadius.xs,
  },
  novelInfo: {
    flex: 1,
    justifyContent: "center",
  },
  novelTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  novelAuthor: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  genreTag: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  genreText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  userCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
    alignItems: "center",
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  userRole: {
    fontSize: 14,
  },
});
