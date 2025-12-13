import { useState, useEffect } from "react";
import { Dimensions, Platform } from "react-native";

export const Breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
} as const;

export type DeviceType = "mobile" | "tablet" | "desktop";

interface ResponsiveInfo {
  width: number;
  height: number;
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWeb: boolean;
}

export function useResponsive(): ResponsiveInfo {
  const [dimensions, setDimensions] = useState(() => Dimensions.get("window"));

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setDimensions(window);
    });

    return () => subscription.remove();
  }, []);

  const { width, height } = dimensions;
  const isWeb = Platform.OS === "web";

  let deviceType: DeviceType = "mobile";
  if (width >= Breakpoints.desktop) {
    deviceType = "desktop";
  } else if (width >= Breakpoints.tablet) {
    deviceType = "tablet";
  }

  return {
    width,
    height,
    deviceType,
    isMobile: deviceType === "mobile",
    isTablet: deviceType === "tablet",
    isDesktop: deviceType === "desktop",
    isWeb,
  };
}

export function getResponsiveValue<T>(
  values: { mobile: T; tablet?: T; desktop?: T },
  deviceType: DeviceType
): T {
  if (deviceType === "desktop" && values.desktop !== undefined) {
    return values.desktop;
  }
  if (deviceType === "tablet" && values.tablet !== undefined) {
    return values.tablet;
  }
  if (deviceType === "tablet" && values.desktop !== undefined) {
    return values.desktop;
  }
  return values.mobile;
}
