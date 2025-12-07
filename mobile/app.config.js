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
  }
};
