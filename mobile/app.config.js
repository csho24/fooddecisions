/**
 * IMPORTANT: DO NOT ADD 'updates' CONFIGURATION
 * 
 * Expo Go loads directly from the Metro dev server and does NOT use OTA (Over-The-Air) updates.
 * Adding an 'updates' config (even with enabled: false) causes Expo Go to attempt remote update
 * checks that result in "java exception failed to download remote update" errors on Android.
 * 
 * This config is ONLY needed for standalone builds with EAS Updates, NOT for Expo Go development.
 * If you see this config being auto-added, remove it immediately.
 */

module.exports = {
  expo: {
    name: "Food Decisions",
    slug: "foodecisions",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-asset",
      "expo-font"
    ],
    extra: {
      apiBaseUrl: process.env.API_BASE_URL || "https://fooddecisions.onrender.com"
    }
    // DO NOT ADD 'updates' CONFIG - See comment at top of file
  }
};
