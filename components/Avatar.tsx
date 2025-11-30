import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name = "", size = 48 }: AvatarProps) {
  const { theme } = useTheme();
  
  const getInitials = (fullName: string): string => {
    const names = fullName.trim().split(" ");
    if (names.length === 0 || names[0] === "") return "?";
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const getColorFromName = (fullName: string): string => {
    const colors = [
      "#EC4899", "#8B5CF6", "#3B82F6", "#06B6D4", "#10B981",
      "#F59E0B", "#EF4444", "#6366F1", "#14B8A6", "#F97316",
    ];
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, containerStyle]}
        contentFit="cover"
      />
    );
  }

  const initials = getInitials(name);
  const backgroundColor = getColorFromName(name);
  const fontSize = size * 0.4;

  return (
    <View style={[styles.placeholder, containerStyle, { backgroundColor }]}>
      <ThemedText style={[styles.initials, { fontSize, color: "#FFFFFF" }]}>
        {initials}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  initials: {
    fontWeight: "700",
  },
});
