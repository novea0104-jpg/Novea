import React from "react";
import { Pressable, StyleSheet, Platform } from "react-native";
import { PlusIcon } from "@/components/icons/PlusIcon";
import { Edit2Icon } from "@/components/icons/Edit2Icon";
import { BookIcon } from "@/components/icons/BookIcon";
import { useTheme } from "@/hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Spacing } from "@/constants/theme";

interface FloatingActionButtonProps {
  onPress: () => void;
  icon?: "plus" | "edit" | "book";
}

const IconComponents = {
  plus: PlusIcon,
  edit: Edit2Icon,
  book: BookIcon,
};

export function FloatingActionButton({ onPress, icon = "plus" }: FloatingActionButtonProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const IconComponent = IconComponents[icon] || PlusIcon;

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
      <IconComponent size={24} color="#FFFFFF" />
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
