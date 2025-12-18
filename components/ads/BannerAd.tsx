import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { ADMOB_CONFIG, isAdMobAvailable } from '@/utils/admob';
import { useAdMob } from '@/contexts/AdMobContext';

let BannerAdComponent: any = null;
let BannerAdSize: any = null;

if (Platform.OS !== 'web') {
  try {
    const mobileAds = require('react-native-google-mobile-ads');
    BannerAdComponent = mobileAds.BannerAd;
    BannerAdSize = mobileAds.BannerAdSize;
  } catch (error) {
    console.log('BannerAd not available - requires development build');
  }
}

interface BannerAdProps {
  size?: 'BANNER' | 'LARGE_BANNER' | 'MEDIUM_RECTANGLE' | 'FULL_BANNER' | 'LEADERBOARD' | 'ANCHORED_ADAPTIVE_BANNER';
  style?: object;
}

export const AdBanner: React.FC<BannerAdProps> = ({ 
  size = 'ANCHORED_ADAPTIVE_BANNER',
  style 
}) => {
  const { isInitialized, isAdMobSupported } = useAdMob();

  if (!isAdMobSupported || !isInitialized || !BannerAdComponent || !BannerAdSize) {
    return null;
  }

  const adSize = BannerAdSize[size] || BannerAdSize.ANCHORED_ADAPTIVE_BANNER;

  return (
    <View style={[styles.container, style]}>
      <BannerAdComponent
        unitId={ADMOB_CONFIG.BANNER_ID}
        size={adSize}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          console.log('Banner ad loaded');
        }}
        onAdFailedToLoad={(error: any) => {
          console.error('Banner ad failed to load:', error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
