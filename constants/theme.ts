import { Platform } from "react-native";

export const GradientColors = {
  purplePink: {
    colors: ["#8B5CF6", "#EC4899"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 1, y: 1 } as const,
  },
  yellowGreen: {
    colors: ["#FACC15", "#84CC16"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 1, y: 0 } as const,
  },
  romance: {
    colors: ["#EC4899", "#8B5CF6"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },
  fantasy: {
    colors: ["#8B5CF6", "#3B82F6"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },
  thriller: {
    colors: ["#DC2626", "#000000"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },
  mystery: {
    colors: ["#14B8A6", "#000000"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },
  sciFi: {
    colors: ["#06B6D4", "#8B5CF6"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },
  adventure: {
    colors: ["#F59E0B", "#D97706"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },
  drama: {
    colors: ["#A855F7", "#6366F1"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },
  horror: {
    colors: ["#1F2937", "#000000"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },
  comedy: {
    colors: ["#FBBF24", "#F97316"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },
  action: {
    colors: ["#EF4444", "#B91C1C"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },
  chicklit: {
    colors: ["#F472B6", "#EC4899"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },
  teenlit: {
    colors: ["#34D399", "#10B981"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },
  apocalypse: {
    colors: ["#78350F", "#451A03"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },
  pernikahan: {
    colors: ["#FB7185", "#F43F5E"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },
  sistem: {
    colors: ["#22D3EE", "#0891B2"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },
  urban: {
    colors: ["#64748B", "#475569"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },
  fanfiction: {
    colors: ["#C084FC", "#A855F7"] as const,
    start: { x: 0, y: 0 } as const,
    end: { x: 0, y: 1 } as const,
  },
} as const;

export const Colors = {
  light: {
    text: "#1A1A2E",
    textSecondary: "#6C6C80",
    textMuted: "#B0B0C3",
    buttonText: "#FFFFFF",
    tabIconDefault: "#B0B0C3",
    tabIconSelected: "#8B5CF6",
    link: "#8B5CF6",
    primary: "#8B5CF6",
    secondary: "#FCD34D",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F5F5F5",
    backgroundSecondary: "#EBEBEB",
    backgroundTertiary: "#E0E0E0",
    cardBorder: "#E0E0E0",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#A3A3A3",
    textMuted: "#737373",
    buttonText: "#FFFFFF",
    tabIconDefault: "#737373",
    tabIconSelected: "#8B5CF6",
    link: "#8B5CF6",
    primary: "#8B5CF6",
    secondary: "#FCD34D",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    backgroundRoot: "#000000",
    backgroundDefault: "#1A1A1A",
    backgroundSecondary: "#2A2A2A",
    backgroundTertiary: "#3A3A3A",
    cardBorder: "#2A2A2A",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 22,
    fontWeight: "600" as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  reading: {
    fontSize: 18,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
