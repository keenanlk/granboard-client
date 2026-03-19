import type { CapacitorConfig } from "@capacitor/cli";

const isDev = process.env.NODE_ENV === "development";

const config: CapacitorConfig = {
  appId: "com.keenankaufman.nlcdarts",
  appName: "NLC Darts",
  webDir: "dist",
  server: isDev
    ? {
        url: "http://192.168.40.151:5173",
        cleartext: true,
      }
    : undefined,
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
