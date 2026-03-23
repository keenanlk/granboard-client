import reactConfig from "@nlc-darts/eslint-config/react";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...reactConfig,
  {
    ignores: ["scripts"],
  },
];
