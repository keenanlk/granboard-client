import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.keenankaufman.nlcdarts",
  appName: "NLC Darts",
  webDir: "dist",
  ios: {
    // Scroll is disabled — this is a fullscreen game UI
    scrollEnabled: false,
  },
  // DEV ONLY — remove before production build
  server: {
    url: "http://192.168.40.151:5173",
    cleartext: true,
  },
  plugins: {
    BluetoothLe: {
      // Displayed in the iOS Bluetooth permission dialog
      displayStrings: {
        scanning: "Looking for GranBoard…",
        cancel: "Cancel",
        availableDevices: "Available Boards",
        noDeviceFound: "No GranBoard found.",
      },
    },
  },
};

export default config;
