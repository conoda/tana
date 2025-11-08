module.exports = {
  expo: {
    name: "Tana Mobile",
    slug: "tana-mobile",
    version: "0.1.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    assetBundlePatterns: ["**/*"],
    plugins: [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow Tana Mobile to access your camera for scanning QR codes."
        }
      ]
    ],
    extra: {
      // Defaults to local dev server - set LEDGER_API_URL for production or other environments
      // For production: LEDGER_API_URL=https://blockchain.tana.network npm start
      ledgerApiUrl: process.env.LEDGER_API_URL || "http://localhost:8080",
      eas: {
        projectId: "00000000-0000-0000-0000-000000000000"
      }
    }
  }
};
