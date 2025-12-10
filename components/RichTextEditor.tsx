import React, { useState, useRef, useCallback } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
  TextInputSelectionChangeEventData,
  NativeSyntheticEvent,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";

interface RichTextEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
}

type FormatType = "bold" | "italic" | "heading" | "list" | "link";

export function RichTextEditor({
  value,
  onChangeText,
  placeholder = "Tulis konten...",
  minHeight = 200,
  maxHeight = 400,
}: RichTextEditorProps) {
  const { theme } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  const handleSelectionChange = useCallback(
    (e: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
      setSelection(e.nativeEvent.selection);
    },
    []
  );

  const insertFormat = useCallback(
    (type: FormatType) => {
      const { start, end } = selection;
      const selectedText = value.substring(start, end);
      let insertText = "";
      let beforeText = value.substring(0, start);
      let afterText = value.substring(end);

      switch (type) {
        case "bold":
          insertText = selectedText ? `**${selectedText}**` : "**teks tebal**";
          break;
        case "italic":
          insertText = selectedText ? `*${selectedText}*` : "*teks miring*";
          break;
        case "heading":
          const needsNewline = beforeText.length > 0 && !beforeText.endsWith("\n");
          insertText = (needsNewline ? "\n\n" : "") + "## " + (selectedText || "");
          break;
        case "list":
          const needsListNewline = beforeText.length > 0 && !beforeText.endsWith("\n");
          insertText = (needsListNewline ? "\n" : "") + "- " + (selectedText || "");
          break;
        case "link":
          setLinkText(selectedText || "teks link");
          setLinkUrl("");
          setShowLinkModal(true);
          return;
      }

      const newText = beforeText + insertText + afterText;
      onChangeText(newText);
      inputRef.current?.focus();
    },
    [value, selection, onChangeText]
  );

  const insertLink = useCallback(() => {
    if (!linkUrl) return;
    const { start, end } = selection;
    const formattedLink = `[${linkText}](${linkUrl})`;
    const newText = value.substring(0, start) + formattedLink + value.substring(end);
    onChangeText(newText);
    setShowLinkModal(false);
    setLinkUrl("");
    setLinkText("");
    inputRef.current?.focus();
  }, [value, selection, linkUrl, linkText, onChangeText]);

  const insertNewLine = useCallback(() => {
    const { start, end } = selection;
    const newText = value.substring(0, start) + "\n\n" + value.substring(end);
    onChangeText(newText);
    inputRef.current?.focus();
  }, [value, selection, onChangeText]);

  const ToolbarButton = ({
    icon,
    onPress,
    label,
  }: {
    icon: keyof typeof Feather.glyphMap;
    onPress: () => void;
    label: string;
  }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toolbarButton,
        { backgroundColor: pressed ? theme.primary + "20" : "transparent" },
      ]}
      accessibilityLabel={label}
    >
      <Feather name={icon} size={20} color={theme.text} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.toolbar,
          { backgroundColor: theme.backgroundSecondary, borderColor: theme.backgroundSecondary },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarContent}
        >
          <ToolbarButton
            icon="type"
            onPress={() => insertFormat("heading")}
            label="Heading"
          />
          <View style={[styles.toolbarDivider, { backgroundColor: theme.textMuted }]} />
          <ToolbarButton
            icon="bold"
            onPress={() => insertFormat("bold")}
            label="Bold"
          />
          <ToolbarButton
            icon="italic"
            onPress={() => insertFormat("italic")}
            label="Italic"
          />
          <View style={[styles.toolbarDivider, { backgroundColor: theme.textMuted }]} />
          <ToolbarButton
            icon="list"
            onPress={() => insertFormat("list")}
            label="List"
          />
          <ToolbarButton
            icon="link"
            onPress={() => insertFormat("link")}
            label="Link"
          />
          <View style={[styles.toolbarDivider, { backgroundColor: theme.textMuted }]} />
          <ToolbarButton
            icon="corner-down-left"
            onPress={insertNewLine}
            label="New Paragraph"
          />
        </ScrollView>
      </View>

      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.backgroundRoot,
            borderColor: theme.backgroundSecondary,
            minHeight,
            maxHeight,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        onSelectionChange={handleSelectionChange}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        multiline
        textAlignVertical="top"
        scrollEnabled
      />

      <View style={styles.helpContainer}>
        <ThemedText style={[styles.helpText, { color: theme.textMuted }]}>
          Format: **tebal** *miring* ## heading - list [teks](url)
        </ThemedText>
      </View>

      <Modal
        visible={showLinkModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLinkModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLinkModal(false)}
        >
          <View
            style={[styles.linkModal, { backgroundColor: theme.backgroundRoot }]}
          >
            <ThemedText style={styles.linkModalTitle}>Sisipkan Link</ThemedText>

            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Teks
            </ThemedText>
            <TextInput
              style={[
                styles.linkInput,
                {
                  color: theme.text,
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.backgroundSecondary,
                },
              ]}
              value={linkText}
              onChangeText={setLinkText}
              placeholder="Teks yang ditampilkan"
              placeholderTextColor={theme.textMuted}
            />

            <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>
              URL
            </ThemedText>
            <TextInput
              style={[
                styles.linkInput,
                {
                  color: theme.text,
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.backgroundSecondary,
                },
              ]}
              value={linkUrl}
              onChangeText={setLinkUrl}
              placeholder="https://..."
              placeholderTextColor={theme.textMuted}
              keyboardType="url"
              autoCapitalize="none"
            />

            <View style={styles.linkModalButtons}>
              <Pressable
                onPress={() => setShowLinkModal(false)}
                style={[styles.linkModalButton, { backgroundColor: theme.backgroundSecondary }]}
              >
                <ThemedText style={{ color: theme.text }}>Batal</ThemedText>
              </Pressable>
              <Pressable
                onPress={insertLink}
                style={[styles.linkModalButton, { backgroundColor: theme.primary }]}
              >
                <ThemedText style={{ color: "#FFFFFF" }}>Sisipkan</ThemedText>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  toolbar: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  toolbarContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  toolbarButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  toolbarDivider: {
    width: 1,
    height: 20,
    marginHorizontal: Spacing.xs,
    opacity: 0.3,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    lineHeight: 22,
  },
  helpContainer: {
    paddingHorizontal: Spacing.xs,
  },
  helpText: {
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  linkModal: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  linkModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  linkInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
  },
  linkModalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  linkModalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
});

export default RichTextEditor;
