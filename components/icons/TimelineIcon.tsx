import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function TimelineIcon({ size = 24, color = "#000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1"
        stroke={color}
        strokeWidth="2"
      />
      <Rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1"
        stroke={color}
        strokeWidth="2"
      />
      <Rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1"
        stroke={color}
        strokeWidth="2"
      />
      <Rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1"
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  );
}
