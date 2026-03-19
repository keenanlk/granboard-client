import pino from "pino";

export type { Logger } from "./types.ts";
export { noopLogger } from "./types.ts";

export function createLogger(opts: { level?: string; browser?: boolean }) {
  const level = opts.level ?? "info";
  return pino({
    level,
    ...(opts.browser ? { browser: {} } : {}),
  });
}
