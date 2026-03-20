import pino from "pino";

export type { Logger } from "./types.ts";
export { noopLogger } from "./types.ts";

/**
 * Create a pino logger instance.
 *
 * @param opts.level - Minimum log level (defaults to `"info"`).
 * @param opts.browser - When `true`, enables pino's browser transport.
 * @returns A configured pino {@link Logger}.
 */
export function createLogger(opts: { level?: string; browser?: boolean }) {
  const level = opts.level ?? "info";
  return pino({
    level,
    ...(opts.browser ? { browser: {} } : {}),
  });
}
