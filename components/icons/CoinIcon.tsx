import React from "react";
import { Image, StyleSheet } from "react-native";

interface IconProps {
  size?: number;
  color?: string;
}

export function CoinIcon({ size = 24 }: IconProps) {
  return (
    <Image
      source={require("@/assets/images/novoin.png")}
      style={[styles.image, { width: size, height: size }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: 24,
    height: 24,
  },
});
