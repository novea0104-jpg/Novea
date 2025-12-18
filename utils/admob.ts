import { Platform } from 'react-native';

export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-4233873340910338~9509478256',
  
  BANNER_ID: Platform.select({
    android: __DEV__ 
      ? 'ca-app-pub-3940256099942544/6300978111'
      : 'ca-app-pub-4233873340910338/6726584004',
    ios: __DEV__
      ? 'ca-app-pub-3940256099942544/2934735716'
      : 'ca-app-pub-4233873340910338/6726584004',
    default: 'ca-app-pub-3940256099942544/6300978111',
  }) as string,

  INTERSTITIAL_ID: Platform.select({
    android: __DEV__
      ? 'ca-app-pub-3940256099942544/1033173712'
      : 'ca-app-pub-4233873340910338/8627641424',
    ios: __DEV__
      ? 'ca-app-pub-3940256099942544/4411468910'
      : 'ca-app-pub-4233873340910338/8627641424',
    default: 'ca-app-pub-3940256099942544/1033173712',
  }) as string,

  REWARDED_ID: Platform.select({
    android: __DEV__
      ? 'ca-app-pub-3940256099942544/5224354917'
      : 'ca-app-pub-4233873340910338/4119945424',
    ios: __DEV__
      ? 'ca-app-pub-3940256099942544/1712485313'
      : 'ca-app-pub-4233873340910338/4119945424',
    default: 'ca-app-pub-3940256099942544/5224354917',
  }) as string,
};

export const isAdMobAvailable = (): boolean => {
  return Platform.OS === 'android' || Platform.OS === 'ios';
};

export const getTestDeviceIds = (): string[] => {
  return [];
};
