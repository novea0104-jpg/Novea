import React from "react";
import { View, StyleSheet, FlatList, Pressable, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function WriterDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const screenInsets = useScreenInsets();
  const { novels } = useApp();
  const { user } = useAuth();

  const myNovels = novels.filter((n) => n.authorId === user?.id).slice(0, 3);

  const coverImageSource = {
    romance: require("@/assets/images/novels/romance.png"),
    fantasy: require("@/assets/images/novels/fantasy.png"),
    thriller: require("@/assets/images/novels/thriller.png"),
    mystery: require("@/assets/images/novels/mystery.png"),
    adventure: require("@/assets/images/novels/adventure.png"),
  };

  const renderNovel = ({ item }: any) => {
    const placeholderImage = coverImageSource[item.genre.toLowerCase() as keyof typeof coverImageSource];
    const imageSource = item.coverImage ? { uri: item.coverImage } : placeholderImage;

    return (
      <Pressable
        onPress={() => navigation.navigate("ManageNovel", { novelId: item.id })}
        style={({ pressed }) => [
          styles.novelCard,
          { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Image source={imageSource} style={styles.novelCover} resizeMode="cover" />
        <View style={styles.novelInfo}>
          <ThemedText style={styles.novelTitle} numberOfLines={1}>
            {item.title}
          </ThemedText>
          <ThemedText style={[styles.novelStatus, { color: theme.textSecondary }]}>
            {item.status} • {item.totalChapters} chapters
          </ThemedText>
          <View style={styles.novelStats}>
            <View style={styles.stat}>
              <Feather name="users" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.statText, { color: theme.textSecondary }]}>
                {item.followers.toLocaleString()}
              </ThemedText>
            </View>
            <View style={styles.stat}>
              <Image source={require("@/assets/images/icons/coin.png")} style={styles.statIcon} />
              <ThemedText style={[styles.statText, { color: theme.secondary }]}>
                {(item.followers * 50).toLocaleString()}
              </ThemedText>
            </View>
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textMuted} />
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: screenInsets.paddingTop, paddingBottom: screenInsets.paddingBottom }]}>
        <View style={styles.statsRow}>
          <Card elevation={1} style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: theme.primary }]}>
              {myNovels.reduce((sum, n) => sum + n.followers, 0).toLocaleString()}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Total Readers
            </ThemedText>
          </Card>
          <Card elevation={1} style={styles.statCard}>
            <ThemedText style={[styles.statValue, { color: theme.secondary }]}>
              {(myNovels.reduce((sum, n) => sum + n.followers, 0) * 50).toLocaleString()}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Total Earnings
            </ThemedText>
          </Card>
        </View>

        <View style={styles.section}>
          <ThemedText style={[Typography.h2, styles.sectionTitle]}>My Novels</ThemedText>
          {myNovels.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="book" size={48} color={theme.textMuted} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                You haven't published any novels yet
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={myNovels}
              renderItem={renderNovel}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.novelList}
            />
          )}
        </View>
      </View>

      <FloatingActionButton
        onPress={() => navigation.navigate("EditChapter", { novelId: "new", chapterId: undefined })}
        icon="plus"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.lg,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  novelList: {
    gap: Spacing.md,
  },
  novelCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
    alignItems: "center",
  },
  novelCover: {
    width: 60,
    height: 90,
    borderRadius: BorderRadius.xs,
  },
  novelInfo: {
    flex: 1,
  },
  novelTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  novelStatus: {
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  novelStats: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statIcon: {
    width: 14,
    height: 14,
  },
  statText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
  },
});
