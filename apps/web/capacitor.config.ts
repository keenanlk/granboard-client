import type { CapacitorConfig } from "@capacitor/cli";

const isDev = process.env.NODE_ENV === "development";

const config: CapacitorConfig = {
  appId: "com.keenankaufman.nlcdarts",
  appName: "NLC Darts",
  webDir: "dist",
  server: isDev
    ? {
        url: "https://192.168.40.151:5173",
        cleartext: false,
        allowNavigation: ["192.168.40.151"],
      }
    : undefined,
  ios: {
    // Scroll is disabled — this is a fullscreen game UI
    scrollEnabled: false,
  },
  plugins: {
    CapacitorHttp: {
      // Disabled in dev mode — the HTTP interceptor routes through capacitor://
      // which iOS blocks as mixed content when the page is served from the
      // remote Vite dev server (https://...)
      enabled: !isDev,
    },
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
