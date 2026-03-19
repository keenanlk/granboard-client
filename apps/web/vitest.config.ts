import { defineConfig } from "vitest/config";
import type { TestProjectConfiguration } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const unitProject: TestProjectConfiguration = {
  test: {
    name: "unit",
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
};

const browserProject: TestProjectConfiguration = {
  plugins: [tailwindcss(), react()],
  optimizeDeps: {
    include: [
      "react",
      "react/jsx-dev-runtime",
      "react-dom/client",
      "vitest-browser-react",
    ],
  },
  test: {
    name: "browser",
    include: ["src/**/*.browser.test.tsx"],
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
    },
  },
};

const projects = process.env.COVERAGE_ONLY
  ? [unitProject]
  : [unitProject, browserProject];

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
    projects,
  },
});
