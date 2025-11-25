import React from "react";
import Svg, { Path } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function FeatherIcon({ size = 24, color = "#000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 8L2 22M17.5 15H9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
