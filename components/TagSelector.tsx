import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { searchTags, fetchAllTags, Tag } from "@/utils/supabase";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Feather } from "@expo/vector-icons";

interface TagSelectorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  minTags?: number;
  maxTags?: number;
}

const MIN_TAGS = 3;
const MAX_TAGS = 7;

export function TagSelector({
  selectedTags,
  onTagsChange,
  minTags = MIN_TAGS,
  maxTags = MAX_TAGS,
}: TagSelectorProps) {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadAllTags();
  }, []);

  const loadAllTags = async () => {
    setIsLoading(true);
    const tags = await fetchAllTags();
    setAllTags(tags);
    setIsLoading(false);
  };

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);

      if (query.length >= 1) {
        setShowDropdown(true);
        const results = await searchTags(query);
        const filtered = results.filter(
          (tag) => !selectedTags.some((st) => st.id === tag.id)
        );
        setSuggestions(filtered);
      } else {
        setShowDropdown(false);
        setSuggestions([]);
      }
    },
    [selectedTags]
  );

  const handleSelectTag = (tag: Tag) => {
    if (selectedTags.length >= maxTags) {
      return;
    }
    onTagsChange([...selectedTags, tag]);
    setSearchQuery("");
    setShowDropdown(false);
    setSuggestions([]);
  };

  const handleRemoveTag = (tagId: number) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  };

  const renderSuggestion = ({ item }: { item: Tag }) => (
    <Pressable
      style={[styles.suggestionItem, { backgroundColor: theme.backgroundSecondary }]}
      onPress={() => handleSelectTag(item)}
    >
      <ThemedText style={styles.suggestionText}>{item.name}</ThemedText>
      <Feather name="plus" size={18} color={theme.primary} />
    </Pressable>
  );

  const isValid = selectedTags.length >= minTags && selectedTags.length <= maxTags;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.label}>
          Tag ({selectedTags.length}/{maxTags})
        </ThemedText>
        <ThemedText
          style={[
            styles.hint,
            {
              color: selectedTags.length < minTags ? theme.error : theme.textMuted,
            },
          ]}
        >
          {selectedTags.length < minTags
            ? `Minimal ${minTags} tag`
            : `Pilih hingga ${maxTags} tag`}
        </ThemedText>
      </View>

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <Feather name="search" size={18} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Cari tag..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={handleSearch}
          onFocus={() => {
            if (searchQuery.length >= 1) {
              setShowDropdown(true);
            }
          }}
        />
        {isLoading ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : null}
      </View>

      {showDropdown && suggestions.length > 0 ? (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSuggestion}
            keyboardShouldPersistTaps="handled"
            style={styles.suggestionList}
            nestedScrollEnabled
          />
        </View>
      ) : null}

      {showDropdown && suggestions.length === 0 && searchQuery.length >= 1 ? (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          <ThemedText style={[styles.noResults, { color: theme.textMuted }]}>
            Tag tidak ditemukan
          </ThemedText>
        </View>
      ) : null}

      {selectedTags.length > 0 ? (
        <View style={styles.selectedContainer}>
          {selectedTags.map((tag) => (
            <View
              key={tag.id}
              style={[styles.chip, { backgroundColor: theme.primary }]}
            >
              <ThemedText style={styles.chipText}>{tag.name}</ThemedText>
              <Pressable
                onPress={() => handleRemoveTag(tag.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  hint: {
    fontSize: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.xs,
  },
  dropdown: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    maxHeight: 200,
    overflow: "hidden",
  },
  suggestionList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  suggestionText: {
    fontSize: 14,
  },
  noResults: {
    padding: Spacing.md,
    textAlign: "center",
    fontSize: 14,
  },
  selectedContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  chipText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
