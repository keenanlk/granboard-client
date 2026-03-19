import { createLogger } from "@nlc-darts/logger";

export const logger = createLogger({ level: process.env.LOG_LEVEL });
