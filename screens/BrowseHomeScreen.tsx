import React from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { NovelCard } from "@/components/NovelCard";
import { HeaderTitle } from "@/components/HeaderTitle";
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

  const trendingNovels = novels.slice(0, 6);
  const newReleases = novels.slice(6, 12);
  const editorsPick = novels.slice(12, 18);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: () => <HeaderTitle title="N" />,
      headerLeft: () => (
        <View style={{ marginLeft: Spacing.md }}>
          <HeaderTitle title="N" />
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => navigation.navigate("Search")}
            style={({ pressed }) => [
              styles.iconButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="search" size={20} color={theme.text} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              { opacity: pressed ? 0.7 : 1, marginLeft: Spacing.sm },
            ]}
          >
            <Feather name="bell" size={20} color={theme.text} />
          </Pressable>
          <LinearGradient
            colors={["#A3E635", "#84CC16"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.coinBadge}
          >
            <Feather name="circle" size={12} color="#000000" style={{ marginRight: 4 }} />
            <ThemedText style={styles.coinText}>{user?.coinBalance || 0}</ThemedText>
          </LinearGradient>
        </View>
      ),
    });
  }, [navigation, theme, user]);

  const renderNovelSection = (title: string, novels: Novel[], variant: "large" | "medium" = "medium") => (
    <View style={styles.section}>
      <ThemedText style={[styles.sectionTitle, Typography.h2]}>{title}</ThemedText>
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
        {renderNovelSection("Trending Now", trendingNovels, "large")}
        {renderNovelSection("New Releases", newReleases)}
        {renderNovelSection("Editor's Pick", editorsPick)}
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.xs,
    backgroundColor: "#1A1A1A",
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
    color: "#000000",
  },
  section: {
    marginBottom: Spacing["4xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
    fontWeight: "700",
  },
  carousel: {
    paddingRight: Spacing.lg,
  },
});
