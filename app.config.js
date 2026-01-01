module.exports = {
  expo: {
    name: "Novea",
    slug: "novea",
    version: "4.0.5",
    orientation: "default",
    icon: "./assets/images/icon.png",
    scheme: "novea",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.novea.app",
      associatedDomains: ["applinks:noveaindonesia.com", "applinks:www.noveaindonesia.com"]
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#6C5CE7",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      // Disabled untuk menghindari deprecated API di Android 15
      // edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      resizeableActivity: true,
      softwareKeyboardLayoutMode: "pan",
      package: "com.novea.app",
      versionCode: 10,
      permissions: ["com.android.vending.BILLING"],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "noveaindonesia.com",
              pathPrefix: "/novel"
            },
            {
              scheme: "https",
              host: "noveaindonesia.com",
              pathPrefix: "/user"
            },
            {
              scheme: "https",
              host: "www.noveaindonesia.com",
              pathPrefix: "/novel"
            },
            {
              scheme: "https",
              host: "www.noveaindonesia.com",
              pathPrefix: "/user"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: { backgroundColor: "#000000" }
        }
      ],
      "expo-web-browser",
      "react-native-iap",
      [
        "react-native-google-mobile-ads",
        {
          androidAppId: "ca-app-pub-4233873340910338~9509478256"
        }
      ]
    ],
    extra: {
      eas: {
        projectId: "751416dd-a4c9-4b9d-9b28-299e73879b73"
      },
      admobAppId: "ca-app-pub-4233873340910338~9509478256",
      admobBannerId: "ca-app-pub-4233873340910338/6726584004",
      admobInterstitialId: "ca-app-pub-4233873340910338/8627641424",
      admobRewardedId: "ca-app-pub-4233873340910338/4119945424"
    }
  }
};