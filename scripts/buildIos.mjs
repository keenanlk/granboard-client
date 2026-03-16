#!/usr/bin/env node

/**
 * Production iOS build script.
 *
 * 1. Temporarily removes the dev `server` block from capacitor.config.ts
 *    so the app loads from the bundled dist/ instead of a livereload URL.
 * 2. Runs `npm run build` (tsc + vite build).
 * 3. Runs `cap sync ios` to copy web assets into the Xcode project.
 * 4. Restores the original capacitor.config.ts.
 * 5. Opens Xcode so you can archive / submit.
 */

import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

const CONFIG_PATH = "capacitor.config.ts";
const original = readFileSync(CONFIG_PATH, "utf-8");

// Strip the server block (dev livereload config)
const production = original.replace(
  /\s*\/\/ DEV ONLY[^\n]*\n\s*server:\s*\{[^}]*\},?\n/,
  "\n",
);

if (production === original) {
  console.log(
    "⚠  No dev server block found — config already production-ready.",
  );
} else {
  console.log("→ Removing dev server block from capacitor.config.ts");
}

try {
  writeFileSync(CONFIG_PATH, production);

  console.log("→ Building web assets…");
  execSync("npm run build", { stdio: "inherit" });

  console.log("→ Syncing to iOS…");
  execSync("npx cap sync ios", { stdio: "inherit" });

  console.log("→ Opening Xcode…");
  execSync("npx cap open ios", { stdio: "inherit" });

  console.log("✓ Done — archive and submit from Xcode.");
} finally {
  // Always restore the original config, even on failure
  writeFileSync(CONFIG_PATH, original);
  console.log("→ Restored dev capacitor.config.ts");
}
