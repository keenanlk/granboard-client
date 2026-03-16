import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
  },
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: null,
      manifest: {
        name: "NLC Darts",
        short_name: "NLC Darts",
        description: "GranBoard darts scoring app",
        theme_color: "#09090b",
        background_color: "#09090b",
        display: "fullscreen",
        orientation: "landscape",
        icons: [
          { src: "/nlc-darts-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/nlc-darts-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/nlc-darts-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
