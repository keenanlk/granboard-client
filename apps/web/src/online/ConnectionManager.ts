import { logger } from "../lib/logger.ts";

const log = logger.child({ module: "conn-mgr" });

const MAX_BACKOFF_MS = 30_000;
const DEFAULT_MAX_RETRIES = 3;

/**
 * Abstract base for connection managers. Provides:
 * - Exponential backoff: 1s -> 2s -> 4s -> ... -> max 30s
 * - Deterministic resource tracking & teardown
 * - Reconnect attempt counter with configurable max
 */
export abstract class ConnectionManager {
  protected disposers = new Set<() => void>();
  protected reconnectAttempts = 0;
  protected maxRetries: number;
  private backoffTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(maxRetries = DEFAULT_MAX_RETRIES) {
    this.maxRetries = maxRetries;
  }

  /** Track a resource disposer; called during cleanup(). */
  protected trackResource(disposeFn: () => void): void {
    this.disposers.add(disposeFn);
  }

  /** Dispose all tracked resources. */
  protected disposeAll(): void {
    for (const dispose of this.disposers) {
      try {
        dispose();
      } catch (err) {
        log.warn({ err }, "Error during resource disposal");
      }
    }
    this.disposers.clear();
  }

  /** Calculate backoff delay in ms for the current attempt. */
  protected backoffMs(): number {
    return Math.min(1000 * Math.pow(2, this.reconnectAttempts), MAX_BACKOFF_MS);
  }

  /** Schedule a reconnect attempt after backoff delay. Returns false if max retries exceeded. */
  protected scheduleReconnect(reconnectFn: () => void): boolean {
    if (this.reconnectAttempts >= this.maxRetries) {
      log.warn(
        { attempts: this.reconnectAttempts },
        "Max reconnect attempts reached",
      );
      return false;
    }

    const delay = this.backoffMs();
    log.info(
      { attempt: this.reconnectAttempts + 1, delayMs: delay },
      "Scheduling reconnect",
    );
    this.backoffTimer = setTimeout(() => {
      this.reconnectAttempts++;
      reconnectFn();
    }, delay);
    this.trackResource(() => {
      if (this.backoffTimer) {
        clearTimeout(this.backoffTimer);
        this.backoffTimer = null;
      }
    });
    return true;
  }

  /** Reset reconnect counter (call after successful connection). */
  protected resetReconnect(): void {
    this.reconnectAttempts = 0;
  }

  /** Deterministic teardown of all tracked resources. */
  cleanup(): void {
    if (this.backoffTimer) {
      clearTimeout(this.backoffTimer);
      this.backoffTimer = null;
    }
    this.disposeAll();
    this.reconnectAttempts = 0;
  }
}
