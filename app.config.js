import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  expo: {
    ...config.expo, // mantém o que já existe no app.json
    name: "Eventos ICM",
    icon: "./assets/icons/android/play-store-icon.png",
    android: {
      icon: "./assets/icons/android/play-store-icon.png",
      package: "com.felipetravassos.seuapp"
    },
    ios: {
      icon: "./assets/icons/ios/icon.png",
      bundleIdentifier: "com.felipetravassos.seuapp"
    },
    web: {
      favicon: "./assets/icons/web/favicon.png"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: ["**/*"],
    plugins: ["expo-firebase-core"],
    extra: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID
    }
  }
});