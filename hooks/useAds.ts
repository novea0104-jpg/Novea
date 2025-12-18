import { useCallback, useState } from 'react';
import { useAdMob } from '@/contexts/AdMobContext';

export const useInterstitialAd = () => {
  const { showInterstitial, isInterstitialLoaded, loadInterstitial } = useAdMob();
  const [isShowing, setIsShowing] = useState(false);

  const show = useCallback(async (): Promise<boolean> => {
    if (isShowing) return false;
    
    setIsShowing(true);
    const result = await showInterstitial();
    setIsShowing(false);
    return result;
  }, [showInterstitial, isShowing]);

  return {
    show,
    isLoaded: isInterstitialLoaded,
    reload: loadInterstitial,
    isShowing,
  };
};

export const useRewardedAd = () => {
  const { showRewarded, isRewardedLoaded, loadRewarded } = useAdMob();
  const [isShowing, setIsShowing] = useState(false);

  const show = useCallback(async (onRewarded: (reward: { type: string; amount: number }) => void): Promise<boolean> => {
    if (isShowing) return false;
    
    setIsShowing(true);
    const result = await showRewarded(onRewarded);
    setIsShowing(false);
    return result;
  }, [showRewarded, isShowing]);

  return {
    show,
    isLoaded: isRewardedLoaded,
    reload: loadRewarded,
    isShowing,
  };
};

export const useAdFrequency = (maxAdsPerSession: number = 5) => {
  const [adsShownCount, setAdsShownCount] = useState(0);

  const canShowAd = adsShownCount < maxAdsPerSession;

  const recordAdShown = useCallback(() => {
    setAdsShownCount(prev => prev + 1);
  }, []);

  const resetCounter = useCallback(() => {
    setAdsShownCount(0);
  }, []);

  return {
    canShowAd,
    adsShownCount,
    recordAdShown,
    resetCounter,
    remainingAds: maxAdsPerSession - adsShownCount,
  };
};
