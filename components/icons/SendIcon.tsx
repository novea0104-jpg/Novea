import React from "react";
import Svg, { Line, Polygon } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function SendIcon({ size = 24, color = "#000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line
        x1="22"
        y1="2"
        x2="11"
        y2="13"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polygon
        points="22 2 15 22 11 13 2 9 22 2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
