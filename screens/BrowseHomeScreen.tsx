import React from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { NovelCard } from "@/components/NovelCard";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { useScreenInsets } from "@/hooks/useScreenInsets";
import { useApp } from "@/contexts/AppContext";
import { BrowseStackParamList } from "@/navigation/BrowseStackNavigator";
import { Spacing, Typography } from "@/constants/theme";
import { Novel } from "@/types/models";

type NavigationProp = NativeStackNavigationProp<BrowseStackParamList>;

export default function BrowseHomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const screenInsets = useScreenInsets();
  const { novels } = useApp();

  const trendingNovels = novels.slice(0, 6);
  const newReleases = novels.slice(6, 12);
  const editorsPick = novels.slice(12, 18);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: () => <HeaderTitle title="Novea" />,
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate("Search")}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Feather name="search" size={24} color={theme.text} />
        </Pressable>
      ),
    });
  }, [navigation, theme]);

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
  section: {
    marginBottom: Spacing["3xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
  },
  carousel: {
    paddingRight: Spacing.lg,
  },
});
