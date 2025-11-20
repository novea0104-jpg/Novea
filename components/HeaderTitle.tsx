import React from "react";
import { View, StyleSheet } from "react-native";
import { GradientText } from "@/components/GradientText";
import { Typography } from "@/constants/theme";

interface HeaderTitleProps {
  title: string;
}

export function HeaderTitle({ title }: HeaderTitleProps) {
  return (
    <View style={styles.container}>
      <GradientText gradient="purplePink" style={styles.title}>
        {title}
      </GradientText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
});
