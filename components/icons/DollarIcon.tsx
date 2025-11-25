import React from "react";
import Svg, { Path, Line } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function DollarIcon({ size = 24, color = "#000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line
        x1="12"
        y1="1"
        x2="12"
        y2="23"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
