import { createLogger } from "@nlc-darts/logger";

/** Root logger for the game server, configured via the LOG_LEVEL env var. */
export const logger = createLogger({ level: process.env.LOG_LEVEL });
