import React from "react";
import Svg, { Polyline } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function ChevronUpIcon({ size = 24, color = "#000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline
        points="18 15 12 9 6 15"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
