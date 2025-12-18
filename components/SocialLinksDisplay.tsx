import React from 'react';
import { View, StyleSheet, Pressable, Linking, Platform } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/theme';
import { SocialLinks, SocialPlatform } from '@/types/models';

interface SocialLinksDisplayProps {
  socialLinks?: SocialLinks;
}

const PLATFORM_CONFIG: Record<SocialPlatform, { label: string; color: string }> = {
  instagram: { label: 'Instagram', color: '#E4405F' },
  tiktok: { label: 'TikTok', color: '#000000' },
  facebook: { label: 'Facebook', color: '#1877F2' },
  twitter: { label: 'X', color: '#000000' },
  youtube: { label: 'YouTube', color: '#FF0000' },
  telegram: { label: 'Telegram', color: '#0088CC' },
};

const SocialIcon = ({ platform, size = 18, color }: { platform: SocialPlatform; size?: number; color: string }) => {
  switch (platform) {
    case 'instagram':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect x="2" y="2" width="20" height="20" rx="5" stroke={color} strokeWidth="2" />
          <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" />
          <Circle cx="18" cy="6" r="1.5" fill={color} />
        </Svg>
      );
    case 'tiktok':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'facebook':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'twitter':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M4 4l11.733 16h4.267l-11.733-16zm12.267 0l-8.267 8.667m-2.533 3.333l8.267-8.667" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'youtube':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'telegram':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    default:
      return null;
  }
};

export function SocialLinksDisplay({ socialLinks }: SocialLinksDisplayProps) {
  const { theme } = useTheme();

  if (!socialLinks) return null;

  const activePlatforms = (Object.keys(socialLinks) as SocialPlatform[]).filter(
    (platform) => socialLinks[platform]?.handle
  );

  if (activePlatforms.length === 0) return null;

  const handleOpenLink = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening social link:', error);
    }
  };

  return (
    <View style={styles.container}>
      {activePlatforms.map((platform) => {
        const config = PLATFORM_CONFIG[platform];
        const link = socialLinks[platform];
        if (!link) return null;

        const isDarkIcon = platform === 'tiktok' || platform === 'twitter';
        const iconColor = isDarkIcon ? theme.text : config.color;

        return (
          <Pressable
            key={platform}
            onPress={() => handleOpenLink(link.url)}
            style={({ pressed }) => [
              styles.socialChip,
              { backgroundColor: config.color + '15', opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <SocialIcon platform={platform} size={16} color={iconColor} />
            <ThemedText style={[styles.socialHandle, { color: theme.text }]} numberOfLines={1}>
              @{link.handle}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  socialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  socialHandle: {
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 100,
  },
});
