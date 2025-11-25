import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { StarIcon } from "@/components/icons/StarIcon";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { LibraryStackParamList } from "@/navigation/LibraryStackNavigator";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { Novel } from "@/types/models";

type NavigationProp = NativeStackNavigationProp<LibraryStackParamList>;

export default function LibraryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const screenInsets = useScreenInsets();
  const { novels, followingNovels, readingHistory } = useApp();
  const { user, showAuthPrompt } = useAuth();
  const [activeTab, setActiveTab] = useState<"following" | "history">("following");

  useEffect(() => {
    if (!user) {
      showAuthPrompt("Masuk untuk melihat koleksi novelmu");
    }
  }, [user]);

  if (!user) {
    return (
      <EmptyState
        type="library"
        title="Masuk Diperlukan"
        message="Silakan masuk untuk melihat koleksi novel yang kamu ikuti dan riwayat bacamu"
      />
    );
  }

  const followingNovelsList = novels.filter((n) => followingNovels.has(n.id));
  
  const historyNovelsList = readingHistory
    .filter(h => !followingNovels.has(h.novelId))
    .map(h => {
      const novel = novels.find(n => n.id === h.novelId);
      return novel ? { ...novel, lastReadAt: h.lastReadAt } : null;
    })
    .filter((n): n is Novel & { lastReadAt: Date } => n !== null);

  const coverImageSource = {
    romance: require("@/assets/images/novels/romance.png"),
    fantasy: require("@/assets/images/novels/fantasy.png"),
    thriller: require("@/assets/images/novels/thriller.png"),
    mystery: require("@/assets/images/novels/mystery.png"),
    adventure: require("@/assets/images/novels/adventure.png"),
  };

  const formatLastRead = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const renderFollowingNovel = ({ item }: { item: Novel }) => {
    const placeholderImage = coverImageSource[item.genre.toLowerCase() as keyof typeof coverImageSource];
    const imageSource = item.coverImage ? { uri: item.coverImage } : placeholderImage;

    return (
      <Pressable
        onPress={() => navigation.navigate("NovelDetail", { novelId: item.id })}
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
          <View style={styles.novelMeta}>
            <View style={styles.rating}>
              <StarIcon size={12} color={theme.secondary} filled />
              <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>
                {item.rating.toFixed(1)}
              </ThemedText>
            </View>
            <View style={[styles.followingBadge, { backgroundColor: theme.primary + '20' }]}>
              <ThemedText style={[styles.followingText, { color: theme.primary }]}>
                Mengikuti
              </ThemedText>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderHistoryNovel = ({ item }: { item: Novel & { lastReadAt: Date } }) => {
    const placeholderImage = coverImageSource[item.genre.toLowerCase() as keyof typeof coverImageSource];
    const imageSource = item.coverImage ? { uri: item.coverImage } : placeholderImage;

    return (
      <Pressable
        onPress={() => navigation.navigate("NovelDetail", { novelId: item.id })}
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
          <View style={styles.novelMeta}>
            <View style={styles.rating}>
              <StarIcon size={12} color={theme.secondary} filled />
              <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>
                {item.rating.toFixed(1)}
              </ThemedText>
            </View>
            <ThemedText style={[styles.lastReadText, { color: theme.textSecondary }]}>
              {formatLastRead(item.lastReadAt)}
            </ThemedText>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.tabs, { paddingTop: screenInsets.paddingTop }]}>
        <Pressable
          onPress={() => setActiveTab("following")}
          style={[
            styles.tab,
            activeTab === "following" && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
          ]}
        >
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === "following" ? theme.primary : theme.textSecondary },
            ]}
          >
            Mengikuti ({followingNovelsList.length})
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("history")}
          style={[
            styles.tab,
            activeTab === "history" && { borderBottomColor: theme.primary, borderBottomWidth: 2 },
          ]}
        >
          <ThemedText
            style={[
              styles.tabText,
              { color: activeTab === "history" ? theme.primary : theme.textSecondary },
            ]}
          >
            Riwayat ({historyNovelsList.length})
          </ThemedText>
        </Pressable>
      </View>

      {activeTab === "following" ? (
        followingNovelsList.length === 0 ? (
          <EmptyState
            type="library"
            title="Belum Ada Novel Diikuti"
            message="Mulai ikuti novel favoritmu untuk melihatnya di sini"
          />
        ) : (
          <FlatList
            data={followingNovelsList}
            renderItem={renderFollowingNovel}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: screenInsets.paddingBottom },
            ]}
          />
        )
      ) : (
        historyNovelsList.length === 0 ? (
          <EmptyState
            type="library"
            title="Belum Ada Riwayat Baca"
            message="Novel yang kamu baca akan muncul di sini"
          />
        ) : (
          <FlatList
            data={historyNovelsList}
            renderItem={renderHistoryNovel}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: screenInsets.paddingBottom },
            ]}
          />
        )
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  novelCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    padding: Spacing.sm,
    gap: Spacing.md,
  },
  novelCover: {
    width: 70,
    height: 100,
    borderRadius: BorderRadius.sm,
  },
  novelInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  novelTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  novelAuthor: {
    fontSize: 13,
  },
  novelMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 4,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  followingBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  followingText: {
    fontSize: 11,
    fontWeight: "600",
  },
  lastReadText: {
    fontSize: 11,
  },
});
