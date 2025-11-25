import React from "react";
import Svg, { Path } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function BookOpenIcon({ size = 24, color = "#000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
