#!/usr/bin/env node

/**
 * Bump the app version across all platforms (package.json, iOS, PWA manifest).
 *
 * Usage:
 *   npm run version -- patch      # 1.0.0 → 1.0.1
 *   npm run version -- minor      # 1.0.0 → 1.1.0
 *   npm run version -- major      # 1.0.0 → 2.0.0
 *   npm run version -- 2.3.1      # set explicit version
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Parse args
// ---------------------------------------------------------------------------

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: npm run version -- <major|minor|patch|x.y.z>");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Read current version from package.json
// ---------------------------------------------------------------------------

const pkgPath = resolve(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
const current = pkg.version; // e.g. "1.0.0"

const semverRe = /^(\d+)\.(\d+)\.(\d+)$/;

function bump(version, type) {
  const m = version.match(semverRe);
  if (!m) {
    console.error(`Current version "${version}" is not valid semver.`);
    process.exit(1);
  }
  let [, major, minor, patch] = m.map(Number);
  switch (type) {
    case "major":
      major++;
      minor = 0;
      patch = 0;
      break;
    case "minor":
      minor++;
      patch = 0;
      break;
    case "patch":
      patch++;
      break;
    default:
      console.error(`Unknown bump type: ${type}`);
      process.exit(1);
  }
  return `${major}.${minor}.${patch}`;
}

const next = ["major", "minor", "patch"].includes(arg)
  ? bump(current, arg)
  : (() => {
      if (!semverRe.test(arg)) {
        console.error(
          `"${arg}" is not a valid semver version or bump type (major|minor|patch).`,
        );
        process.exit(1);
      }
      return arg;
    })();

console.log(`Bumping version: ${current} -> ${next}`);

// ---------------------------------------------------------------------------
// 1. package.json
// ---------------------------------------------------------------------------

pkg.version = next;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`  Updated package.json`);

// ---------------------------------------------------------------------------
// 2. iOS — project.pbxproj
// ---------------------------------------------------------------------------

const pbxPath = resolve(root, "ios/App/App.xcodeproj/project.pbxproj");
let pbx = readFileSync(pbxPath, "utf-8");

// MARKETING_VERSION = semver (Xcode shows this as "Version")
pbx = pbx.replace(
  /MARKETING_VERSION = [^;]+;/g,
  `MARKETING_VERSION = ${next};`,
);

// CURRENT_PROJECT_VERSION = integer build number — auto-increment
const buildMatch = pbx.match(/CURRENT_PROJECT_VERSION = (\d+);/);
const currentBuild = buildMatch ? Number(buildMatch[1]) : 0;
const nextBuild = currentBuild + 1;
pbx = pbx.replace(
  /CURRENT_PROJECT_VERSION = \d+;/g,
  `CURRENT_PROJECT_VERSION = ${nextBuild};`,
);

writeFileSync(pbxPath, pbx);
console.log(
  `  Updated iOS project.pbxproj (MARKETING_VERSION=${next}, build=${nextBuild})`,
);

// ---------------------------------------------------------------------------
// 3. PWA — vite-plugin-pwa manifest gets version from package.json at build
//    time, but we also inject it into the manifest for clarity.
// ---------------------------------------------------------------------------
// vite-plugin-pwa reads the manifest object from vite.config.ts, which doesn't
// have a version field by default. The service worker cache is busted by content
// hash, so no file update is strictly needed — package.json is the PWA source
// of truth. Nothing extra to do here.

console.log(`  PWA version derived from package.json at build time`);

console.log(`\nDone! Version is now ${next} (build ${nextBuild})`);
