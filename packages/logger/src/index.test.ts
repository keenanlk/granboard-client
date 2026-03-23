import { describe, it, expect } from "vitest";
import { createLogger } from "./index.ts";
import { noopLogger } from "./types.ts";

describe("createLogger", () => {
  it("returns a pino logger with the specified level", () => {
    const log = createLogger({ level: "debug" });
    expect(log.level).toBe("debug");
  });

  it("defaults to info level", () => {
    const log = createLogger({});
    expect(log.level).toBe("info");
  });

  it("supports child loggers", () => {
    const log = createLogger({ level: "warn" });
    const child = log.child({ module: "test" });
    expect(child).toBeDefined();
    expect(typeof child.info).toBe("function");
  });
});

describe("noopLogger", () => {
  it("has all required log methods", () => {
    expect(typeof noopLogger.debug).toBe("function");
    expect(typeof noopLogger.info).toBe("function");
    expect(typeof noopLogger.warn).toBe("function");
    expect(typeof noopLogger.error).toBe("function");
  });

  it("child returns another noopLogger", () => {
    const child = noopLogger.child({ module: "test" });
    expect(child).toBe(noopLogger);
  });

  it("does not throw when called", () => {
    expect(() => noopLogger.debug({}, "test")).not.toThrow();
    expect(() => noopLogger.info({}, "test")).not.toThrow();
    expect(() => noopLogger.warn({}, "test")).not.toThrow();
    expect(() => noopLogger.error({}, "test")).not.toThrow();
  });
});
