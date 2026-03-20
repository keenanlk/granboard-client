import { describe, it, expect, beforeEach, vi } from "vitest";
import { BotSkill } from "@nlc-darts/engine";

const mockStorage = new Map<string, string>();

vi.stubGlobal("localStorage", {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    mockStorage.set(key, value);
  },
  removeItem: (key: string) => {
    mockStorage.delete(key);
  },
});

// Import after mocking localStorage so the module picks it up
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let gameLogger: typeof import("./GameLogger.ts")["gameLogger"];

describe("GameLogger", () => {
  beforeEach(async () => {
    mockStorage.clear();
    vi.resetModules();
    const mod = await import("./GameLogger.ts");
    gameLogger = mod.gameLogger;
  });

  function getStoredLines(): string[] {
    const raw = mockStorage.get("nlc-darts-gamelog");
    if (!raw) return [];
    return raw.split("\n");
  }

  it("start() initializes log with game_start entry", () => {
    gameLogger.start("x01", ["Alice", "Bob"], [null, null], {
      startScore: 501,
    });

    const lines = getStoredLines();
    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0]);
    expect(entry.event).toBe("game_start");
    expect(entry.game).toBe("x01");
    expect(entry.players).toEqual(["Alice", "Bob"]);
    expect(entry.options).toEqual({ startScore: 501 });
  });

  it("logDart() appends dart entry with segment name", () => {
    gameLogger.start("x01", ["Alice"], [null], {});
    gameLogger.logDart("Alice", undefined, 20, { score: 501 });

    const lines = getStoredLines();
    expect(lines).toHaveLength(2);
    const entry = JSON.parse(lines[1]);
    expect(entry.event).toBe("dart");
    expect(entry.player).toBe("Alice");
    expect(entry.actual).toBeDefined();
    expect(typeof entry.actual).toBe("string");
  });

  it("logDart() includes botTarget when targetId is provided", () => {
    gameLogger.start("x01", ["Bot"], [11 as const], {});
    gameLogger.logDart("Bot", 60, 60, {});

    const lines = getStoredLines();
    const entry = JSON.parse(lines[1]);
    expect(entry.event).toBe("dart");
    expect(entry.botTarget).toBeDefined();
    expect(typeof entry.botTarget).toBe("string");
  });

  it("logDart() omits botTarget when targetId is undefined", () => {
    gameLogger.start("x01", ["Alice"], [null], {});
    gameLogger.logDart("Alice", undefined, 20, {});

    const lines = getStoredLines();
    const entry = JSON.parse(lines[1]);
    expect(entry).not.toHaveProperty("botTarget");
  });

  it("logTurnEnd() appends turn_end entry", () => {
    gameLogger.start("x01", ["Alice"], [null], {});
    gameLogger.logTurnEnd("Alice", 3, 60);

    const lines = getStoredLines();
    expect(lines).toHaveLength(2);
    const entry = JSON.parse(lines[1]);
    expect(entry.event).toBe("turn_end");
    expect(entry.player).toBe("Alice");
    expect(entry.dartsThrown).toBe(3);
    expect(entry.roundScore).toBe(60);
  });

  it("logTurnEnd() includes busted flag when true", () => {
    gameLogger.start("x01", ["Alice"], [null], {});
    gameLogger.logTurnEnd("Alice", 1, 0, true);

    const lines = getStoredLines();
    const entry = JSON.parse(lines[1]);
    expect(entry.busted).toBe(true);
  });

  it("logGameEnd() appends game_end entry with winners and finalScores", () => {
    gameLogger.start("x01", ["Alice", "Bob"], [null, null], {});
    gameLogger.logGameEnd(["Alice"], { Alice: 0, Bob: 200 });

    const lines = getStoredLines();
    const entry = JSON.parse(lines[lines.length - 1]);
    expect(entry.event).toBe("game_end");
    expect(entry.winners).toEqual(["Alice"]);
    expect(entry.finalScores).toEqual({ Alice: 0, Bob: 200 });
  });

  it("all entries have timestamps (ts field)", () => {
    gameLogger.start("cricket", ["Alice"], [null], {});
    gameLogger.logDart("Alice", undefined, 20, {});
    gameLogger.logTurnEnd("Alice", 3, 60);
    gameLogger.logGameEnd(["Alice"], { Alice: 100 });

    const lines = getStoredLines();
    expect(lines).toHaveLength(4);
    for (const line of lines) {
      const entry = JSON.parse(line);
      expect(entry.ts).toBeDefined();
      expect(typeof entry.ts).toBe("string");
      // Verify it's a valid ISO timestamp
      expect(new Date(entry.ts).toISOString()).toBe(entry.ts);
    }
  });

  it("entries are stored in localStorage as JSONL", () => {
    gameLogger.start("x01", ["Alice"], [null], {});
    gameLogger.logDart("Alice", undefined, 20, {});

    const raw = mockStorage.get("nlc-darts-gamelog");
    expect(raw).toBeDefined();
    // JSONL = lines separated by newlines
    const lines = raw!.split("\n");
    expect(lines).toHaveLength(2);
  });

  it("each entry is valid JSON (parse each line)", () => {
    gameLogger.start("x01", ["Alice", "Bob"], [null, BotSkill.Pro], {});
    gameLogger.logDart("Alice", undefined, 20, { remaining: 481 });
    gameLogger.logDart("Bob", 60, 57, { remaining: 444 });
    gameLogger.logTurnEnd("Alice", 1, 20);
    gameLogger.logTurnEnd("Bob", 1, 57);
    gameLogger.logGameEnd(["Bob"], { Alice: 481, Bob: 0 });

    const raw = mockStorage.get("nlc-darts-gamelog");
    const lines = raw!.split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(6);
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });
});
