import fs from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

const certPath = ".certs/cert.pem";
const keyPath = ".certs/key.pem";
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);
// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    strictPort: true,
    https: hasCerts
      ? { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }
      : undefined,
    proxy: {
      // Proxy local Supabase through Vite to avoid mixed content (HTTPS → HTTP)
      "/supabase-proxy": {
        target: "http://127.0.0.1:54321",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase-proxy/, ""),
        ws: true,
      },
      // Proxy Colyseus game server (runs on HTTPS with self-signed certs)
      "/colyseus-proxy": {
        target: "https://127.0.0.1:2567",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/colyseus-proxy/, ""),
        ws: true,
      },
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: null,
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: "NLC Darts",
        short_name: "NLC Darts",
        description: "GranBoard darts scoring app",
        theme_color: "#09090b",
        background_color: "#09090b",
        display: "fullscreen",
        orientation: "landscape",
        icons: [
          {
            src: "/nlc-darts-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/nlc-darts-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/nlc-darts-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
