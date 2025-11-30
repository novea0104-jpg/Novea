import React from "react";
import { View, ScrollView, StyleSheet, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { NovelCard } from "@/components/NovelCard";
import { CoinIcon } from "@/components/icons/CoinIcon";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { BrowseStackParamList } from "@/navigation/BrowseStackNavigator";
import { Spacing, Typography, BorderRadius, GradientColors } from "@/constants/theme";
import { Novel } from "@/types/models";

type NavigationProp = NativeStackNavigationProp<BrowseStackParamList>;

export default function BrowseHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const screenInsets = useScreenInsets();
  const { novels } = useApp();
  const { user } = useAuth();

  // Sedang Trending: Sort by total_reads (most viewed)
  const trendingNovels = [...novels]
    .sort((a, b) => b.followers - a.followers) // followers = total_reads from database
    .slice(0, 6);
  
  // Novel Terbaru: Sort by created_at (newest first)
  const newReleases = [...novels]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6);
  
  // Pilihan Editor: Sort by rating (highest rated)
  const editorsPick = [...novels]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 6);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: "",
      headerLeft: () => (
        <View style={[styles.headerTitleContainer, { marginLeft: Spacing.md }]}>
          <Image
            source={require("@/assets/images/novea-logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <ThemedText style={styles.appName}>ovea</ThemedText>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => navigation.navigate("Search")}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            android_ripple={{ color: theme.textMuted, borderless: true, radius: 20 }}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="search" size={20} color={theme.text} />
          </Pressable>
          <Pressable
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            android_ripple={{ color: theme.textMuted, borderless: true, radius: 20 }}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.7 : 1, marginLeft: Spacing.sm },
            ]}
          >
            <Feather name="bell" size={20} color={theme.text} />
          </Pressable>
          <LinearGradient
            colors={GradientColors.yellowGreen.colors}
            start={GradientColors.yellowGreen.start}
            end={GradientColors.yellowGreen.end}
            style={styles.coinBadge}
          >
            <CoinIcon size={12} color={theme.backgroundRoot} />
            <ThemedText style={[styles.coinText, { color: theme.backgroundRoot }]}>{user?.coinBalance || 0}</ThemedText>
          </LinearGradient>
        </View>
      ),
    });
  }, [navigation, theme, user]);

  const renderNovelSection = (title: string, novels: Novel[], variant: "large" | "medium" = "medium") => (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
      >
        {novels.map((novel) => (
          <NovelCard
            key={novel.id}
            novel={novel}
            variant={variant}
            onPress={() => navigation.navigate("NovelDetail", { novelId: novel.id })}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: screenInsets.paddingTop, paddingBottom: screenInsets.paddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {renderNovelSection("Sedang Trending", trendingNovels, "large")}
        {renderNovelSection("Novel Terbaru", newReleases)}
        {renderNovelSection("Pilihan Editor", editorsPick)}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  appName: {
    fontSize: 22,
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    marginLeft: Spacing.sm,
    minWidth: 60,
  },
  coinText: {
    fontSize: 14,
    fontWeight: "700",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    fontWeight: "700",
    fontSize: 16,
  },
  carousel: {
    paddingRight: Spacing.lg,
  },
});
