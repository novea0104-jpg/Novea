import React from "react";
import Svg, { Path, Line } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function BarChartIcon({ size = 24, color = "#000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line
        x1="18"
        y1="20"
        x2="18"
        y2="10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="12"
        y1="20"
        x2="12"
        y2="4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line
        x1="6"
        y1="20"
        x2="6"
        y2="14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
