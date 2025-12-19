const IS_EAS_BUILD = process.env.EAS_BUILD === 'true';

const GOOGLE_TEST_APP_ID = 'ca-app-pub-3940256099942544~3347511713';

const config = {
  expo: {
    name: "Novea",
    slug: "novea",
    version: "4.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "novea",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.novea.app"
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#6C5CE7",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.novea.app",
      versionCode: 5,
      permissions: ["com.android.vending.BILLING"]
    },
    web: {
      output: "single",
      favicon: "./assets/images/favicon.png",
      bundler: "metro"
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000"
          }
        }
      ],
      "expo-web-browser",
      "react-native-iap",
    ],
    experiments: {
      reactCompiler: true
    },
    extra: {
      eas: {},
      admobAppId: process.env.ADMOB_APP_ID || null,
      admobBannerId: process.env.ADMOB_BANNER_ID || null,
      admobInterstitialId: process.env.ADMOB_INTERSTITIAL_ID || null,
      admobRewardedId: process.env.ADMOB_REWARDED_ID || null,
    }
  }
};

if (IS_EAS_BUILD) {
  const admobAppId = process.env.ADMOB_APP_ID || GOOGLE_TEST_APP_ID;
  
  config.expo.plugins.push([
    "react-native-google-mobile-ads",
    {
      androidAppId: admobAppId,
    }
  ]);
}

module.exports = config;
