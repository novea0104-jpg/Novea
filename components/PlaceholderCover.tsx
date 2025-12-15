import React from "react";
import { View, StyleSheet, Image, DimensionValue } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GradientColors, BorderRadius } from "@/constants/theme";

const noveaLogo = require("@/assets/images/novea-logo.png");

type GenreKey = keyof typeof GradientColors;

interface PlaceholderCoverProps {
  width: DimensionValue;
  height: DimensionValue;
  genre?: string;
  logoSize?: "small" | "medium" | "large";
  borderRadius?: number;
}

const genreMap: Record<string, GenreKey> = {
  romance: "romance",
  fantasy: "fantasy",
  thriller: "thriller",
  mystery: "mystery",
  "sci-fi": "sciFi",
  scifi: "sciFi",
  adventure: "adventure",
  drama: "drama",
  horror: "horror",
  comedy: "comedy",
  action: "action",
  chicklit: "chicklit",
  teenlit: "teenlit",
  apocalypse: "apocalypse",
  pernikahan: "pernikahan",
  sistem: "sistem",
  urban: "urban",
  fanfiction: "fanfiction",
};

function getGradientForGenre(genre?: string): readonly [string, string] {
  if (!genre) return GradientColors.purplePink.colors;
  
  const normalizedGenre = genre.toLowerCase().replace(/\s+/g, "");
  const gradientKey = genreMap[normalizedGenre];
  
  if (gradientKey && GradientColors[gradientKey]) {
    return GradientColors[gradientKey].colors;
  }
  
  return GradientColors.purplePink.colors;
}

export function PlaceholderCover({ 
  width, 
  height, 
  genre, 
  logoSize = "medium",
  borderRadius = BorderRadius.xs 
}: PlaceholderCoverProps) {
  const gradientColors = getGradientForGenre(genre);
  
  const logoSizes = {
    small: { width: 28, height: 28, badge: 44 },
    medium: { width: 36, height: 36, badge: 56 },
    large: { width: 48, height: 48, badge: 72 },
  };
  
  const sizes = logoSizes[logoSize];

  return (
    <View style={[styles.container, { width, height, borderRadius }]}>
      <LinearGradient
        colors={[gradientColors[0], gradientColors[1], "#000000"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.gradient}
      />
      
      <View style={styles.patternOverlay}>
        <View style={[styles.diagonalLine, styles.line1]} />
        <View style={[styles.diagonalLine, styles.line2]} />
        <View style={[styles.diagonalLine, styles.line3]} />
      </View>
      
      <View style={styles.logoWrapper}>
        <View style={[styles.logoBadge, { width: sizes.badge, height: sizes.badge }]}>
          <View style={styles.badgeGlow} />
          <Image 
            source={noveaLogo} 
            style={[styles.logo, { width: sizes.width, height: sizes.height }]} 
            resizeMode="contain" 
          />
        </View>
      </View>
      
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.4)"]}
        style={styles.bottomShadow}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  diagonalLine: {
    position: "absolute",
    width: 1,
    height: "200%",
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },
  line1: {
    left: "20%",
    top: "-50%",
  },
  line2: {
    left: "50%",
    top: "-50%",
  },
  line3: {
    left: "80%",
    top: "-50%",
  },
  logoWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  logoBadge: {
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  badgeGlow: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  logo: {
    opacity: 0.9,
    tintColor: "#FFFFFF",
  },
  bottomShadow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "30%",
  },
});
