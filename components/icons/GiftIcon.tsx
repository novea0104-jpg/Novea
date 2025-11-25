import React from "react";
import Svg, { Path, Rect, Line } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function GiftIcon({ size = 24, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="8" width="18" height="13" rx="1" stroke={color} strokeWidth="2" />
      <Rect x="5" y="4" width="14" height="4" rx="1" stroke={color} strokeWidth="2" />
      <Line x1="12" y1="8" x2="12" y2="21" stroke={color} strokeWidth="2" />
      <Path d="M12 8C12 8 12 4 8 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 8C12 8 12 4 16 4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}
