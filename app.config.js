const IS_EAS_BUILD = process.env.EAS_BUILD === 'true';

const config = {
  expo: {
    name: "Novea",
    slug: "novea",
    version: "1.0.0",
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
      eas: {
        projectId: "novea"
      },
      admobAppId: process.env.ADMOB_APP_ID || "ca-app-pub-4233873340910338~9509478256",
      admobBannerId: process.env.ADMOB_BANNER_ID || "ca-app-pub-4233873340910338/6726584004",
      admobInterstitialId: process.env.ADMOB_INTERSTITIAL_ID || "ca-app-pub-4233873340910338/8627641424",
      admobRewardedId: process.env.ADMOB_REWARDED_ID || "ca-app-pub-4233873340910338/4119945424",
    }
  }
};

if (IS_EAS_BUILD) {
  config.expo.plugins.push([
    "react-native-google-mobile-ads",
    {
      androidAppId: process.env.ADMOB_APP_ID || "ca-app-pub-4233873340910338~9509478256",
    }
  ]);
}

module.exports = config;
