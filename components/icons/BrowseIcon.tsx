import React from "react";
import Svg, { Circle, Path } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function BrowseIcon({ size = 24, color = "#000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M12 2v4M12 18v4M22 12h-4M6 12H2M17.5 6.5l-3 3M9.5 14.5l-3 3M17.5 17.5l-3-3M9.5 9.5l-3-3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="12" r="2" fill={color} />
    </Svg>
  );
}
