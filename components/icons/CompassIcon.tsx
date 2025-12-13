import React from "react";
import Svg, { Circle, Polygon } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function CompassIcon({ size = 24, color = "#000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Polygon
        points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88 16.24,7.76"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
