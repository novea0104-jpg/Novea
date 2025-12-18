import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Platform } from 'react-native';
import { ADMOB_CONFIG, isAdMobAvailable } from '@/utils/admob';

let MobileAds: any = null;
let InterstitialAd: any = null;
let RewardedAd: any = null;
let AdEventType: any = null;
let RewardedAdEventType: any = null;
let TestIds: any = null;

if (Platform.OS !== 'web') {
  try {
    const mobileAds = require('react-native-google-mobile-ads');
    MobileAds = mobileAds.default;
    InterstitialAd = mobileAds.InterstitialAd;
    RewardedAd = mobileAds.RewardedAd;
    AdEventType = mobileAds.AdEventType;
    RewardedAdEventType = mobileAds.RewardedAdEventType;
    TestIds = mobileAds.TestIds;
  } catch (error) {
    console.log('AdMob not available - requires development build');
  }
}

interface AdMobContextType {
  isInitialized: boolean;
  isAdMobSupported: boolean;
  showInterstitial: () => Promise<boolean>;
  showRewarded: (onRewarded: (reward: { type: string; amount: number }) => void) => Promise<boolean>;
  isInterstitialLoaded: boolean;
  isRewardedLoaded: boolean;
  loadInterstitial: () => void;
  loadRewarded: () => void;
}

const AdMobContext = createContext<AdMobContextType>({
  isInitialized: false,
  isAdMobSupported: false,
  showInterstitial: async () => false,
  showRewarded: async () => false,
  isInterstitialLoaded: false,
  isRewardedLoaded: false,
  loadInterstitial: () => {},
  loadRewarded: () => {},
});

export const useAdMob = () => useContext(AdMobContext);

interface AdMobProviderProps {
  children: ReactNode;
}

export const AdMobProvider: React.FC<AdMobProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAdMobSupported] = useState(isAdMobAvailable() && MobileAds !== null);
  const [isInterstitialLoaded, setIsInterstitialLoaded] = useState(false);
  const [isRewardedLoaded, setIsRewardedLoaded] = useState(false);
  const [interstitialAd, setInterstitialAd] = useState<any>(null);
  const [rewardedAd, setRewardedAd] = useState<any>(null);
  const [rewardCallback, setRewardCallback] = useState<((reward: { type: string; amount: number }) => void) | null>(null);

  useEffect(() => {
    const initializeAdMob = async () => {
      if (!isAdMobSupported || !MobileAds) {
        console.log('AdMob not supported on this platform');
        return;
      }

      try {
        await MobileAds().initialize();
        setIsInitialized(true);
        console.log('AdMob initialized successfully');
      } catch (error) {
        console.error('Failed to initialize AdMob:', error);
      }
    };

    initializeAdMob();
  }, [isAdMobSupported]);

  const loadInterstitial = useCallback(() => {
    if (!isInitialized || !InterstitialAd) return;

    const ad = InterstitialAd.createForAdRequest(ADMOB_CONFIG.INTERSTITIAL_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      setIsInterstitialLoaded(true);
    });

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setIsInterstitialLoaded(false);
      loadInterstitial();
    });

    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (error: any) => {
      console.error('Interstitial ad error:', error);
      setIsInterstitialLoaded(false);
    });

    ad.load();
    setInterstitialAd(ad);

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [isInitialized]);

  const loadRewarded = useCallback(() => {
    if (!isInitialized || !RewardedAd) return;

    const ad = RewardedAd.createForAdRequest(ADMOB_CONFIG.REWARDED_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setIsRewardedLoaded(true);
    });

    const unsubscribeEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward: any) => {
      if (rewardCallback) {
        rewardCallback({ type: reward.type, amount: reward.amount });
        setRewardCallback(null);
      }
    });

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setIsRewardedLoaded(false);
      loadRewarded();
    });

    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, (error: any) => {
      console.error('Rewarded ad error:', error);
      setIsRewardedLoaded(false);
    });

    ad.load();
    setRewardedAd(ad);

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [isInitialized, rewardCallback]);

  useEffect(() => {
    if (isInitialized) {
      loadInterstitial();
      loadRewarded();
    }
  }, [isInitialized, loadInterstitial, loadRewarded]);

  const showInterstitial = useCallback(async (): Promise<boolean> => {
    if (!isInterstitialLoaded || !interstitialAd) {
      console.log('Interstitial ad not loaded');
      return false;
    }

    try {
      await interstitialAd.show();
      return true;
    } catch (error) {
      console.error('Failed to show interstitial:', error);
      return false;
    }
  }, [isInterstitialLoaded, interstitialAd]);

  const showRewarded = useCallback(async (onRewarded: (reward: { type: string; amount: number }) => void): Promise<boolean> => {
    if (!isRewardedLoaded || !rewardedAd) {
      console.log('Rewarded ad not loaded');
      return false;
    }

    try {
      setRewardCallback(() => onRewarded);
      await rewardedAd.show();
      return true;
    } catch (error) {
      console.error('Failed to show rewarded ad:', error);
      return false;
    }
  }, [isRewardedLoaded, rewardedAd]);

  return (
    <AdMobContext.Provider
      value={{
        isInitialized,
        isAdMobSupported,
        showInterstitial,
        showRewarded,
        isInterstitialLoaded,
        isRewardedLoaded,
        loadInterstitial,
        loadRewarded,
      }}
    >
      {children}
    </AdMobContext.Provider>
  );
};
