import React from "react";
import { Pressable, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Spacing } from "@/constants/theme";

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: string;
}

export function FloatingActionButton({ onPress, icon = "plus" }: FloatingActionButtonProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: theme.primary,
          bottom: tabBarHeight + Spacing.xl,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Feather name={icon as any} size={24} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
