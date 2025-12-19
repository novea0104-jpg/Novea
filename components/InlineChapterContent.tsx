import React, { useMemo } from "react";
import { View, StyleSheet, StyleProp, TextStyle } from "react-native";
import { MarkdownText } from "@/components/MarkdownText";
import { AdBanner } from "@/components/ads/BannerAd";
import { useAdMob } from "@/contexts/AdMobContext";
import { Spacing } from "@/constants/theme";

interface InlineChapterContentProps {
  content: string;
  style?: StyleProp<TextStyle>;
  fontSize?: number;
  lineHeight?: number;
  fontFamily?: string;
}

const MIN_PARAGRAPHS_FOR_ADS = 8;
const PARAGRAPHS_BETWEEN_ADS = 6;
const MAX_ADS_PER_CHAPTER = 2;
const SKIP_FIRST_PARAGRAPHS = 3;
const SKIP_LAST_PARAGRAPHS = 2;

export function InlineChapterContent({
  content,
  style,
  fontSize = 18,
  lineHeight,
  fontFamily,
}: InlineChapterContentProps) {
  const { isInitialized, isAdMobSupported } = useAdMob();
  const shouldShowAds = isInitialized && isAdMobSupported;

  const paragraphs = useMemo(() => {
    if (!content) return [];
    return content.split(/\n\n+/).filter((p) => p.trim().length > 0);
  }, [content]);

  const adPositions = useMemo(() => {
    const positions: number[] = [];
    const totalParagraphs = paragraphs.length;

    if (totalParagraphs < MIN_PARAGRAPHS_FOR_ADS) {
      return positions;
    }

    const validStart = SKIP_FIRST_PARAGRAPHS;
    const validEnd = totalParagraphs - SKIP_LAST_PARAGRAPHS;
    const validRange = validEnd - validStart;

    if (validRange < PARAGRAPHS_BETWEEN_ADS) {
      return positions;
    }

    let adsPlaced = 0;
    let currentPos = validStart + PARAGRAPHS_BETWEEN_ADS - 1;

    while (currentPos < validEnd && adsPlaced < MAX_ADS_PER_CHAPTER) {
      positions.push(currentPos);
      adsPlaced++;
      currentPos += PARAGRAPHS_BETWEEN_ADS;
    }

    return positions;
  }, [paragraphs.length]);

  const textStyle = useMemo(
    () => [
      style,
      {
        fontSize,
        lineHeight: lineHeight ?? fontSize * 1.8,
        fontFamily,
      },
    ],
    [style, fontSize, lineHeight, fontFamily]
  );

  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {paragraphs.map((paragraph, index) => (
        <View key={index}>
          <MarkdownText style={textStyle}>{paragraph}</MarkdownText>
          
          {index < paragraphs.length - 1 ? (
            <View style={styles.paragraphSpacer} />
          ) : null}
          
          {shouldShowAds && adPositions.includes(index) ? (
            <View style={styles.adContainer}>
              <AdBanner size="BANNER" style={styles.inlineAd} />
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  paragraphSpacer: {
    height: Spacing.lg,
  },
  adContainer: {
    alignItems: "center",
    marginVertical: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  inlineAd: {
    opacity: 0.9,
  },
});
