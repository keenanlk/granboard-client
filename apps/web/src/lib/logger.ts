import { createLogger } from "@nlc-darts/logger";

export const logger = createLogger({
  level: (import.meta.env.VITE_LOG_LEVEL as string) ?? undefined,
  browser: true,
});
