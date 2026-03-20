/** Structured logger interface compatible with pino. */
export interface Logger {
  /** Log a message at the debug level. */
  debug(obj: Record<string, unknown>, msg?: string): void;
  /** Log a message at the info level. */
  info(obj: Record<string, unknown>, msg?: string): void;
  /** Log a message at the warn level. */
  warn(obj: Record<string, unknown>, msg?: string): void;
  /** Log a message at the error level. */
  error(obj: Record<string, unknown>, msg?: string): void;
  /** Create a child logger with additional bound context. */
  child(bindings: Record<string, unknown>): Logger;
}

/** A no-op {@link Logger} implementation that silently discards all output. */
export const noopLogger: Logger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
  child() {
    return noopLogger;
  },
};
