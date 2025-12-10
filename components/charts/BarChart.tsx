import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Rect, Defs, LinearGradient, Stop, Text as SvgText } from "react-native-svg";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface BarDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarDataPoint[];
  height?: number;
  barColor?: string;
  gradientColors?: [string, string];
  showLabels?: boolean;
  showValues?: boolean;
  horizontal?: boolean;
  title?: string;
  formatValue?: (value: number) => string;
}

export function BarChart({
  data,
  height = 200,
  barColor,
  gradientColors = ["#8B5CF6", "#EC4899"],
  showLabels = true,
  showValues = true,
  horizontal = false,
  title,
  formatValue = (v) => v.toLocaleString(),
}: BarChartProps) {
  const { theme } = useTheme();
  const width = Dimensions.get("window").width - Spacing.lg * 2 - Spacing.lg * 2;
  
  if (data.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
        {title && <ThemedText style={styles.title}>{title}</ThemedText>}
        <View style={[styles.emptyState, { height }]}>
          <ThemedText style={{ color: theme.textMuted }}>Belum ada data</ThemedText>
        </View>
      </View>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  
  if (horizontal) {
    const barHeight = 28;
    const barGap = 8;
    const labelWidth = 80;
    const chartHeight = data.length * (barHeight + barGap) + 20;
    
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
        {title && <ThemedText style={styles.title}>{title}</ThemedText>}
        <Svg width={width} height={chartHeight}>
          <Defs>
            <LinearGradient id="barGradientH" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={gradientColors[0]} stopOpacity="1" />
              <Stop offset="1" stopColor={gradientColors[1]} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          
          {data.map((item, i) => {
            const barWidth = ((item.value / maxValue) * (width - labelWidth - 60)) || 0;
            const y = i * (barHeight + barGap) + 10;
            
            return (
              <React.Fragment key={i}>
                <SvgText
                  x={5}
                  y={y + barHeight / 2 + 4}
                  fontSize={11}
                  fill={theme.textSecondary}
                  textAnchor="start"
                >
                  {item.label.length > 10 ? item.label.slice(0, 10) + "..." : item.label}
                </SvgText>
                
                <Rect
                  x={labelWidth}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx={6}
                  fill={item.color || "url(#barGradientH)"}
                />
                
                {showValues && (
                  <SvgText
                    x={labelWidth + barWidth + 8}
                    y={y + barHeight / 2 + 4}
                    fontSize={11}
                    fontWeight="600"
                    fill={theme.text}
                    textAnchor="start"
                  >
                    {formatValue(item.value)}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    );
  }

  const paddingTop = 20;
  const paddingBottom = showLabels ? 40 : 20;
  const paddingLeft = 10;
  const paddingRight = 10;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  const barWidth = Math.min((chartWidth / data.length) * 0.7, 40);
  const barGap = (chartWidth - barWidth * data.length) / (data.length + 1);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      {title && <ThemedText style={styles.title}>{title}</ThemedText>}
      
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={gradientColors[0]} stopOpacity="1" />
            <Stop offset="1" stopColor={gradientColors[1]} stopOpacity="0.6" />
          </LinearGradient>
        </Defs>

        {data.map((item, i) => {
          const barH = (item.value / maxValue) * chartHeight || 0;
          const x = paddingLeft + barGap + i * (barWidth + barGap);
          const y = paddingTop + chartHeight - barH;
          
          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={barWidth / 4}
                fill={item.color || barColor || "url(#barGradient)"}
              />
              
              {showValues && item.value > 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 6}
                  fontSize={10}
                  fontWeight="600"
                  fill={theme.text}
                  textAnchor="middle"
                >
                  {formatValue(item.value)}
                </SvgText>
              )}
              
              {showLabels && (
                <SvgText
                  x={x + barWidth / 2}
                  y={height - 10}
                  fontSize={10}
                  fill={theme.textMuted}
                  textAnchor="middle"
                >
                  {item.label}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
  },
});
