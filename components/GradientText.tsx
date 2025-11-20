import React from "react";
import { Text, TextProps } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { GradientColors } from "@/constants/theme";

interface GradientTextProps extends TextProps {
  gradient?: keyof typeof GradientColors;
  colors?: string[];
}

export function GradientText({
  gradient = "purplePink",
  colors: customColors,
  style,
  children,
  ...props
}: GradientTextProps) {
  const gradientConfig = GradientColors[gradient];
  const colors = customColors || gradientConfig.colors;

  return (
    <MaskedView
      maskElement={
        <Text style={style} {...props}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={colors}
        start={gradientConfig.start}
        end={gradientConfig.end}
      >
        <Text style={[style, { opacity: 0 }]} {...props}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}
