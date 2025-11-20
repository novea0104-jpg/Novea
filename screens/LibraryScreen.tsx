import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { useApp } from "@/contexts/AppContext";
import { LibraryStackParamList } from "@/navigation/LibraryStackNavigator";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { Novel } from "@/types/models";

type NavigationProp = NativeStackNavigationProp<LibraryStackParamList>;

export default function LibraryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const screenInsets = useScreenInsets();
  const { novels, followingNovels } = useApp();
  const [activeTab, setActiveTab] = useState<"following" | "history">("following");

  const followingNovelsList = novels.filter((n) => followingNovels.has(n.id));

  const coverImageSource = {
    romance: require("@/assets/images/novels/romance.png"),
    fantasy: require("@/assets/images/novels/fantasy.png"),
    thriller: require("@/assets/images/novels/thriller.png"),
    mystery: require("@/assets/images/novels/mystery.png"),
    adventure: require("@/assets/images/novels/adventure.png"),
  };

  const renderNovel = ({ item }: { item: Novel }) => {
    const imageSource = coverImageSource[item.genre.toLowerCase() as keyof typeof coverImageSource];

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
              <Feather name="star" size={12} color={theme.secondary} />
              <ThemedText style={{ fontSize: 12, color: theme.textSecondary }}>
                {item.rating.toFixed(1)}
              </ThemedText>
            </View>
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
            Following
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
            History
          </ThemedText>
        </Pressable>
      </View>

      {activeTab === "following" && followingNovelsList.length === 0 ? (
        <EmptyState
          type="library"
          title="No Following Novels"
          message="Start following novels to see them here"
        />
      ) : activeTab === "history" ? (
        <EmptyState
          type="library"
          title="No Reading History"
          message="Your reading history will appear here"
        />
      ) : (
        <FlatList
          data={followingNovelsList}
          renderItem={renderNovel}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: screenInsets.paddingBottom },
          ]}
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
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
  },
  list: {
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
  novelMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
});
