import React from "react";
import Svg, { Polygon } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function ZapIcon({ size = 24, color = "#000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon
        points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
