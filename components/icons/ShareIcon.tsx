import React from "react";
import Svg, { Path, Circle, Line } from "react-native-svg";

interface ShareIconProps {
  size?: number;
  color?: string;
}

export function ShareIcon({ size = 24, color = "#FFFFFF" }: ShareIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={18} cy={5} r={3} stroke={color} strokeWidth={2} />
      <Circle cx={6} cy={12} r={3} stroke={color} strokeWidth={2} />
      <Circle cx={18} cy={19} r={3} stroke={color} strokeWidth={2} />
      <Line x1={8.59} y1={13.51} x2={15.42} y2={17.49} stroke={color} strokeWidth={2} />
      <Line x1={15.41} y1={6.51} x2={8.59} y2={10.49} stroke={color} strokeWidth={2} />
    </Svg>
  );
}
