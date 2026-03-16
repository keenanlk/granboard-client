import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.keenankaufman.nlcdarts",
  appName: "NLC Darts",
  webDir: "dist",
  ios: {
    // Scroll is disabled — this is a fullscreen game UI
    scrollEnabled: false,
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
