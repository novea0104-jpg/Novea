import React from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { FloatingActionButton } from "@/components/FloatingActionButton";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { generateMockChapters } from "@/utils/mockData";

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export default function ManageNovelScreen() {
  const route = useRoute();
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { novels } = useApp();

  const { novelId } = route.params as { novelId: string };
  const novel = novels.find((n) => n.id === novelId);

  if (!novel) return null;

  const chapters = generateMockChapters(novelId, novel.totalChapters);

  const renderChapter = ({ item }: any) => (
    <Pressable
      onPress={() => navigation.navigate("EditChapter", { novelId, chapterId: item.id })}
      style={({ pressed }) => [
        styles.chapterItem,
        { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={styles.chapterLeft}>
        <ThemedText style={styles.chapterTitle}>{item.title}</ThemedText>
        <ThemedText style={[styles.chapterMeta, { color: theme.textSecondary }]}>
          {item.wordCount.toLocaleString()} words • Published
        </ThemedText>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textMuted} />
    </Pressable>
  );

  return (
    <ScreenScrollView>
      <ThemedText style={[Typography.h2, styles.novelTitle]}>{novel.title}</ThemedText>
      <ThemedText style={[styles.chapterCount, { color: theme.textSecondary }]}>
        {novel.totalChapters} Chapters
      </ThemedText>

      <FlatList
        data={chapters}
        renderItem={renderChapter}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.chapterList}
      />

      <FloatingActionButton
        onPress={() => navigation.navigate("EditChapter", { novelId, chapterId: undefined })}
        icon="plus"
      />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  novelTitle: {
    marginBottom: Spacing.sm,
  },
  chapterCount: {
    marginBottom: Spacing.xl,
  },
  chapterList: {
    gap: Spacing.sm,
  },
  chapterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  chapterLeft: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  chapterMeta: {
    fontSize: 12,
  },
});
