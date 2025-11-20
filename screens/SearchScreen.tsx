import React, { useState } from "react";
import { View, StyleSheet, TextInput, FlatList, Pressable, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/contexts/AppContext";
import { BrowseStackParamList } from "@/navigation/BrowseStackNavigator";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Novel } from "@/types/models";

type NavigationProp = NativeStackNavigationProp<BrowseStackParamList>;

export default function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { searchNovels } = useApp();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Novel[]>([]);

  const handleSearch = (text: string) => {
    setQuery(text);
    if (text.trim().length > 0) {
      setResults(searchNovels(text));
    } else {
      setResults([]);
    }
  };

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

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.searchBar, { paddingTop: insets.top, backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.searchInput, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            value={query}
            onChangeText={handleSearch}
            placeholder="Search novels, authors, genres..."
            placeholderTextColor={isDark ? "#9BA1A6" : "#687076"}
            style={[styles.input, { color: theme.text }]}
            autoFocus
          />
          {query.length > 0 && (
            <Pressable onPress={() => handleSearch("")}>
              <Feather name="x" size={20} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {query.trim().length === 0 ? (
        <View style={styles.placeholder}>
          <Feather name="search" size={48} color={theme.textMuted} />
          <ThemedText style={[styles.placeholderText, { color: theme.textSecondary }]}>
            Search for your favorite novels
          </ThemedText>
        </View>
      ) : results.length === 0 ? (
        <EmptyState
          type="search"
          title="No Results Found"
          message={`No novels found for "${query}"`}
        />
      ) : (
        <FlatList
          data={results}
          renderItem={renderNovel}
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
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
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
});
