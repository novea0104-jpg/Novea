import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop, Line, Text as SvgText, Circle } from "react-native-svg";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface DataPoint {
  label: string;
  value: number;
}

interface AreaChartProps {
  data: DataPoint[];
  height?: number;
  gradientColors?: [string, string];
  lineColor?: string;
  showLabels?: boolean;
  showGrid?: boolean;
  showDots?: boolean;
  title?: string;
  subtitle?: string;
  formatValue?: (value: number) => string;
}

export function AreaChart({
  data,
  height = 180,
  gradientColors = ["#8B5CF6", "#EC4899"],
  lineColor = "#8B5CF6",
  showLabels = true,
  showGrid = true,
  showDots = true,
  title,
  subtitle,
  formatValue = (v) => v.toLocaleString(),
}: AreaChartProps) {
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

  const paddingTop = 20;
  const paddingBottom = showLabels ? 30 : 10;
  const paddingLeft = 10;
  const paddingRight = 10;
  
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const minValue = 0;
  
  const getX = (index: number) => paddingLeft + (index / (data.length - 1 || 1)) * chartWidth;
  const getY = (value: number) => paddingTop + chartHeight - ((value - minValue) / (maxValue - minValue || 1)) * chartHeight;
  
  const linePath = data
    .map((point, i) => {
      const x = getX(i);
      const y = getY(point.value);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
  
  const areaPath = `${linePath} L ${getX(data.length - 1)} ${paddingTop + chartHeight} L ${paddingLeft} ${paddingTop + chartHeight} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const y = paddingTop + chartHeight * (1 - ratio);
    return y;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}>
      {title && (
        <View style={styles.header}>
          <ThemedText style={styles.title}>{title}</ThemedText>
          {subtitle && <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</ThemedText>}
        </View>
      )}
      
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={gradientColors[0]} stopOpacity="0.4" />
            <Stop offset="1" stopColor={gradientColors[1]} stopOpacity="0.05" />
          </LinearGradient>
        </Defs>

        {showGrid && gridLines.map((y, i) => (
          <Line
            key={i}
            x1={paddingLeft}
            y1={y}
            x2={width - paddingRight}
            y2={y}
            stroke={theme.textMuted}
            strokeOpacity={0.2}
            strokeDasharray="4,4"
          />
        ))}

        <Path d={areaPath} fill="url(#areaGradient)" />
        <Path d={linePath} stroke={lineColor} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {showDots && data.map((point, i) => (
          <Circle
            key={i}
            cx={getX(i)}
            cy={getY(point.value)}
            r={4}
            fill={theme.backgroundSecondary}
            stroke={lineColor}
            strokeWidth={2}
          />
        ))}

        {showLabels && data.map((point, i) => {
          if (data.length > 7 && i % 2 !== 0 && i !== data.length - 1) return null;
          return (
            <SvgText
              key={i}
              x={getX(i)}
              y={height - 8}
              fontSize={10}
              fill={theme.textMuted}
              textAnchor="middle"
            >
              {point.label}
            </SvgText>
          );
        })}
      </Svg>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>Total</ThemedText>
          <ThemedText style={[styles.statValue, { color: lineColor }]}>
            {formatValue(data.reduce((sum, d) => sum + d.value, 0))}
          </ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>Rata-rata</ThemedText>
          <ThemedText style={[styles.statValue, { color: theme.textSecondary }]}>
            {formatValue(Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length))}
          </ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={[styles.statLabel, { color: theme.textMuted }]}>Tertinggi</ThemedText>
          <ThemedText style={[styles.statValue, { color: theme.success }]}>
            {formatValue(maxValue)}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
  },
});
