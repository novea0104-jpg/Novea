import { Platform } from 'react-native';
import Constants from 'expo-constants';

const GOOGLE_TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const GOOGLE_TEST_BANNER_ANDROID = 'ca-app-pub-3940256099942544/6300978111';
const GOOGLE_TEST_BANNER_IOS = 'ca-app-pub-3940256099942544/2934735716';
const GOOGLE_TEST_INTERSTITIAL_ANDROID = 'ca-app-pub-3940256099942544/1033173712';
const GOOGLE_TEST_INTERSTITIAL_IOS = 'ca-app-pub-3940256099942544/4411468910';
const GOOGLE_TEST_REWARDED_ANDROID = 'ca-app-pub-3940256099942544/5224354917';
const GOOGLE_TEST_REWARDED_IOS = 'ca-app-pub-3940256099942544/1712485313';

const getExtraConfig = () => {
  return Constants.expoConfig?.extra || {};
};

export const ADMOB_CONFIG = {
  get APP_ID(): string {
    const extra = getExtraConfig();
    return extra.admobAppId || GOOGLE_TEST_APP_ID;
  },
  
  get BANNER_ID(): string {
    const extra = getExtraConfig();
    const productionId = extra.admobBannerId;
    
    if (__DEV__ || !productionId) {
      return Platform.select({
        android: GOOGLE_TEST_BANNER_ANDROID,
        ios: GOOGLE_TEST_BANNER_IOS,
        default: GOOGLE_TEST_BANNER_ANDROID,
      }) as string;
    }
    
    return productionId;
  },

  get INTERSTITIAL_ID(): string {
    const extra = getExtraConfig();
    const productionId = extra.admobInterstitialId;
    
    if (__DEV__ || !productionId) {
      return Platform.select({
        android: GOOGLE_TEST_INTERSTITIAL_ANDROID,
        ios: GOOGLE_TEST_INTERSTITIAL_IOS,
        default: GOOGLE_TEST_INTERSTITIAL_ANDROID,
      }) as string;
    }
    
    return productionId;
  },

  get REWARDED_ID(): string {
    const extra = getExtraConfig();
    const productionId = extra.admobRewardedId;
    
    if (__DEV__ || !productionId) {
      return Platform.select({
        android: GOOGLE_TEST_REWARDED_ANDROID,
        ios: GOOGLE_TEST_REWARDED_IOS,
        default: GOOGLE_TEST_REWARDED_ANDROID,
      }) as string;
    }
    
    return productionId;
  },
};

export const isAdMobAvailable = (): boolean => {
  return Platform.OS === 'android' || Platform.OS === 'ios';
};

export const getTestDeviceIds = (): string[] => {
  return [];
};
