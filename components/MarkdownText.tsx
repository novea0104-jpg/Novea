import React, { useMemo } from "react";
import { Text, Pressable, Linking, StyleSheet, TextStyle, StyleProp } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface MarkdownTextProps {
  children: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

type TextSegment = {
  type: "text" | "bold" | "italic" | "link" | "heading" | "listItem";
  content: string;
  url?: string;
};

function parseMarkdown(text: string): TextSegment[] {
  if (!text) return [];

  const segments: TextSegment[] = [];
  let remaining = text;

  const patterns = [
    { regex: /^\*\*(.+?)\*\*/s, type: "bold" as const },
    { regex: /^\*(.+?)\*/s, type: "italic" as const },
    { regex: /^\[(.+?)\]\((.+?)\)/s, type: "link" as const },
    { regex: /^## (.+?)(?:\n|$)/s, type: "heading" as const },
    { regex: /^- (.+?)(?:\n|$)/s, type: "listItem" as const },
  ];

  while (remaining.length > 0) {
    let matched = false;

    for (const pattern of patterns) {
      const match = remaining.match(pattern.regex);
      if (match && match.index === 0) {
        if (pattern.type === "link") {
          segments.push({
            type: pattern.type,
            content: match[1],
            url: match[2],
          });
        } else {
          segments.push({
            type: pattern.type,
            content: match[1],
          });
        }
        remaining = remaining.substring(match[0].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      const nextSpecialIndex = remaining.search(/\*\*|\*|\[|##|- /);
      if (nextSpecialIndex > 0) {
        segments.push({
          type: "text",
          content: remaining.substring(0, nextSpecialIndex),
        });
        remaining = remaining.substring(nextSpecialIndex);
      } else if (nextSpecialIndex === -1) {
        segments.push({
          type: "text",
          content: remaining,
        });
        break;
      } else {
        segments.push({
          type: "text",
          content: remaining.charAt(0),
        });
        remaining = remaining.substring(1);
      }
    }
  }

  return segments;
}

export function MarkdownText({ children, style, numberOfLines }: MarkdownTextProps) {
  const { theme } = useTheme();
  const flatStyle = StyleSheet.flatten(style) || {};
  const textColor = flatStyle.color || theme.text;

  const segments = useMemo(() => parseMarkdown(children), [children]);

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch((err) => console.error("Failed to open URL:", err));
  };

  const renderSegment = (segment: TextSegment, index: number) => {
    switch (segment.type) {
      case "bold":
        return (
          <Text key={index} style={[styles.bold, { color: textColor }]}>
            {segment.content}
          </Text>
        );
      case "italic":
        return (
          <Text key={index} style={[styles.italic, { color: textColor }]}>
            {segment.content}
          </Text>
        );
      case "link":
        return (
          <Text
            key={index}
            style={[styles.link, { color: theme.primary }]}
            onPress={() => segment.url && handleLinkPress(segment.url)}
          >
            {segment.content}
          </Text>
        );
      case "heading":
        return (
          <Text key={index} style={[styles.heading, { color: textColor }]}>
            {segment.content}
          </Text>
        );
      case "listItem":
        return (
          <Text key={index} style={{ color: textColor }}>
            {"\u2022 "}
            {segment.content}
          </Text>
        );
      default:
        return (
          <Text key={index} style={{ color: textColor }}>
            {segment.content}
          </Text>
        );
    }
  };

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {segments.map(renderSegment)}
    </Text>
  );
}

export function stripMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/## /g, "")
    .replace(/^- /gm, "");
}

const styles = StyleSheet.create({
  bold: {
    fontWeight: "700",
  },
  italic: {
    fontStyle: "italic",
  },
  link: {
    textDecorationLine: "underline",
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 28,
  },
});

export default MarkdownText;
