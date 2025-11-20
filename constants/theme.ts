import { Platform } from "react-native";

const primaryColor = "#6C5CE7";
const goldColor = "#FFD700";

export const Colors = {
  light: {
    text: "#1A1A2E",
    textSecondary: "#6C6C80",
    textMuted: "#B0B0C3",
    buttonText: "#FFFFFF",
    tabIconDefault: "#B0B0C3",
    tabIconSelected: primaryColor,
    link: primaryColor,
    primary: primaryColor,
    secondary: goldColor,
    success: "#27AE60",
    warning: "#F39C12",
    error: "#E74C3C",
    backgroundRoot: "#FFFFFF",
    backgroundDefault: "#F5F5F5",
    backgroundSecondary: "#EBEBEB",
    backgroundTertiary: "#E0E0E0",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "#B0B0C3",
    textMuted: "#6C6C80",
    buttonText: "#FFFFFF",
    tabIconDefault: "#6C6C80",
    tabIconSelected: primaryColor,
    link: primaryColor,
    primary: primaryColor,
    secondary: goldColor,
    success: "#27AE60",
    warning: "#F39C12",
    error: "#E74C3C",
    backgroundRoot: "#1A1A2E",
    backgroundDefault: "#16213E",
    backgroundSecondary: "#1E2A47",
    backgroundTertiary: "#253150",
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
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
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
