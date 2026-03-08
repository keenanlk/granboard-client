import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { ViteMcp } from "vite-plugin-mcp";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), ViteMcp()],
});
