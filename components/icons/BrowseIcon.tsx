import React from "react";
import { Feather } from "@expo/vector-icons";

interface IconProps {
  size?: number;
  color?: string;
}

export function BrowseIcon({ size = 24, color = "#000" }: IconProps) {
  return <Feather name="home" size={size} color={color} />;
}
