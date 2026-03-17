#!/usr/bin/env node

/**
 * Bump the app version across all platforms (package.json, iOS, PWA manifest).
 *
 * Usage:
 *   npm run bump              # interactive prompt (arrow keys to select)
 *   npm run bump -- patch     # skip prompt, bump patch
 *   npm run bump -- 2.3.1     # skip prompt, set explicit version
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createInterface, emitKeypressEvents } from "readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
  }
  return `${major}.${minor}.${patch}`;
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => {
    rl.question(question, (answer) => {
      rl.close();
      res(answer.trim());
    });
  });
}

/**
 * Arrow-key select menu. Returns the index of the chosen option.
 */
function select(label, options) {
  return new Promise((res) => {
    let selected = 0;

    function render() {
      // Move cursor up to redraw (except first render)
      if (rendered) {
        process.stdout.write(`\x1b[${options.length}A`);
      }
      for (let i = 0; i < options.length; i++) {
        const pointer = i === selected ? "\x1b[36m❯\x1b[0m" : " ";
        const text =
          i === selected
            ? `\x1b[1m\x1b[36m${options[i]}\x1b[0m`
            : `\x1b[2m${options[i]}\x1b[0m`;
        process.stdout.write(`${pointer} ${text}\x1b[K\n`);
      }
    }

    let rendered = false;
    console.log(`${label}\n`);
    render();
    rendered = true;

    emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.resume();

    process.stdin.on("keypress", (_, key) => {
      if (!key) return;
      if (key.name === "up" || key.name === "k") {
        selected = (selected - 1 + options.length) % options.length;
        render();
      } else if (key.name === "down" || key.name === "j") {
        selected = (selected + 1) % options.length;
        render();
      } else if (key.name === "return") {
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeAllListeners("keypress");
        res(selected);
      } else if (key.name === "escape" || (key.ctrl && key.name === "c")) {
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        console.log("\nAborted.");
        process.exit(0);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Read current version
// ---------------------------------------------------------------------------

const pkgPath = resolve(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
const current = pkg.version;

console.log(`\nCurrent version: \x1b[1m${current}\x1b[0m\n`);

// ---------------------------------------------------------------------------
// Resolve next version (interactive or from CLI arg)
// ---------------------------------------------------------------------------

let next;
const arg = process.argv[2];

if (arg) {
  if (["major", "minor", "patch"].includes(arg)) {
    next = bump(current, arg);
  } else if (semverRe.test(arg)) {
    next = arg;
  } else {
    console.error(
      `"${arg}" is not a valid semver version or bump type (major|minor|patch).`,
    );
    process.exit(1);
  }
} else {
  const choices = [
    `patch  ${current} → ${bump(current, "patch")}`,
    `minor  ${current} → ${bump(current, "minor")}`,
    `major  ${current} → ${bump(current, "major")}`,
    `manual (enter version)`,
  ];

  const idx = await select("Select version bump:", choices);

  if (idx <= 2) {
    next = bump(current, ["patch", "minor", "major"][idx]);
  } else {
    const manual = await ask("\nEnter version (x.y.z): ");
    if (!semverRe.test(manual)) {
      console.error(`"${manual}" is not valid semver.`);
      process.exit(1);
    }
    next = manual;
  }
}

console.log(`\nBumping version: ${current} → ${next}`);

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

pbx = pbx.replace(
  /MARKETING_VERSION = [^;]+;/g,
  `MARKETING_VERSION = ${next};`,
);

pbx = pbx.replace(
  /CURRENT_PROJECT_VERSION = \d+;/g,
  `CURRENT_PROJECT_VERSION = 0;`,
);

writeFileSync(pbxPath, pbx);
console.log(
  `  Updated iOS project.pbxproj (MARKETING_VERSION=${next}, build=0)`,
);

// ---------------------------------------------------------------------------
// 3. PWA — version derived from package.json at build time
// ---------------------------------------------------------------------------

console.log(`  PWA version derived from package.json at build time`);

console.log(`\nDone! Version is now ${next} (build 0)`);
