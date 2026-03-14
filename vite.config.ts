import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import electron from "vite-plugin-electron/simple";

const isWebBuild = process.env.BUILD_TARGET === "web";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    ...(isWebBuild
      ? []
      : [
          electron({
            main: {
              entry: "electron/main.ts",
              vite: {
                build: {
                  rollupOptions: {
                    // Native modules cannot be bundled — load from node_modules at runtime
                    external: [
                      "@abandonware/noble",
                      "@abandonware/bluetooth-hci-socket",
                    ],
                  },
                },
              },
            },
            preload: {
              input: "electron/preload.ts",
            },
          }),
        ]),
  ],
});
