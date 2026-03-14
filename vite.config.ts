import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "NLC Darts",
        short_name: "NLC Darts",
        description: "GranBoard darts scoring app",
        theme_color: "#09090b",
        background_color: "#09090b",
        display: "fullscreen",
        orientation: "landscape",
        icons: [
          { src: "/AppIcons/android/mipmap-mdpi/ic_launcher.png", sizes: "48x48", type: "image/png" },
          { src: "/AppIcons/android/mipmap-hdpi/ic_launcher.png", sizes: "72x72", type: "image/png" },
          { src: "/AppIcons/android/mipmap-xhdpi/ic_launcher.png", sizes: "96x96", type: "image/png" },
          { src: "/AppIcons/android/mipmap-xxhdpi/ic_launcher.png", sizes: "144x144", type: "image/png" },
          { src: "/AppIcons/android/mipmap-xxxhdpi/ic_launcher.png", sizes: "192x192", type: "image/png" },
          { src: "/AppIcons/appstore.png", sizes: "1024x1024", type: "image/png" },
        ],
      },
    }),
  ],
});
