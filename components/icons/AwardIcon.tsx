import React from "react";
import Svg, { Circle, Path, Polyline } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function AwardIcon({ size = 24, color = "#000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="8"
        r="7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polyline
        points="8.21,13.89 7,23 12,20 17,23 15.79,13.88"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
