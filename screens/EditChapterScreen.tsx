import React, { useState } from "react";
import { View, StyleSheet, TextInput } from "react-native";
import { useRoute } from "@react-navigation/native";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function EditChapterScreen() {
  const route = useRoute();
  const { theme, isDark } = useTheme();

  const { novelId, chapterId } = route.params as { novelId: string; chapterId?: string };

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSave = () => {
    alert("Chapter saved successfully!");
  };

  const handlePublish = () => {
    alert("Chapter published successfully!");
  };

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.section}>
        <ThemedText style={styles.label}>Chapter Title</ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Enter chapter title"
          placeholderTextColor={isDark ? "#9BA1A6" : "#687076"}
          style={[styles.input, { backgroundColor: theme.backgroundDefault, color: theme.text }]}
        />
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.label}>Chapter Content</ThemedText>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Write your chapter content here..."
          placeholderTextColor={isDark ? "#9BA1A6" : "#687076"}
          style={[
            styles.input,
            styles.textArea,
            { backgroundColor: theme.backgroundDefault, color: theme.text },
          ]}
          multiline
          numberOfLines={20}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.actions}>
        <Button onPress={handleSave} style={[styles.button, { backgroundColor: theme.backgroundSecondary }]}>
          Save Draft
        </Button>
        <Button onPress={handlePublish} style={styles.button}>
          Publish
        </Button>
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    height: 400,
    paddingVertical: Spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  button: {
    flex: 1,
  },
});
