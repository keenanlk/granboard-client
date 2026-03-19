import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveSession, loadSession, clearSession } from "./sessionPersistence.ts";
import type { PersistedSession } from "./sessionPersistence.ts";

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

function makeMockSession(
  overrides?: Partial<PersistedSession>,
): PersistedSession {
  return {
    gameType: "x01",
    options: { startScore: 501 },
    playerNames: ["Alice", "Bob"],
    playerIds: ["p1", "p2"],
    botSkills: [null, null],
    gameState: { scores: [501, 501] },
    savedAt: Date.now(),
    ...overrides,
  };
}

describe("sessionPersistence", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  it("round-trips a session through save and load", () => {
    const session = makeMockSession();
    saveSession(session);
    const loaded = loadSession();
    expect(loaded).toEqual(session);
  });

  it("loadSession returns null when no saved session exists", () => {
    expect(loadSession()).toBeNull();
  });

  it("loadSession returns null on corrupt JSON", () => {
    mockStorage.set("nlc-active-session", "{not valid json!!!");
    expect(loadSession()).toBeNull();
  });

  it("clearSession removes the stored session", () => {
    const session = makeMockSession();
    saveSession(session);
    clearSession();
    expect(mockStorage.has("nlc-active-session")).toBe(false);
  });

  it("loadSession returns null after clearSession", () => {
    saveSession(makeMockSession());
    clearSession();
    expect(loadSession()).toBeNull();
  });

  it("latest save overwrites previous", () => {
    const first = makeMockSession({ gameType: "x01" });
    const second = makeMockSession({ gameType: "cricket" });
    saveSession(first);
    saveSession(second);
    const loaded = loadSession();
    expect(loaded?.gameType).toBe("cricket");
  });

  it("saveSession handles quota error gracefully", () => {
    const originalSetItem = localStorage.setItem;
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    // Should not throw
    expect(() => saveSession(makeMockSession())).not.toThrow();

    vi.mocked(localStorage.setItem).mockImplementation(originalSetItem);
  });

  it("session includes all expected fields", () => {
    const session = makeMockSession({
      gameType: "cricket",
      options: { pointsEnabled: true },
      playerNames: ["Alice"],
      playerIds: ["p1"],
      botSkills: [null],
      gameState: { marks: {} },
      savedAt: 1700000000000,
      setConfig: { format: "bo3" as const, legs: [], throwOrder: "alternate" as const },
      legResults: [],
      currentLegIndex: 0,
    });

    saveSession(session);
    const loaded = loadSession();

    expect(loaded).not.toBeNull();
    expect(loaded!.gameType).toBe("cricket");
    expect(loaded!.options).toEqual({ pointsEnabled: true });
    expect(loaded!.playerNames).toEqual(["Alice"]);
    expect(loaded!.playerIds).toEqual(["p1"]);
    expect(loaded!.botSkills).toEqual([null]);
    expect(loaded!.gameState).toEqual({ marks: {} });
    expect(loaded!.savedAt).toBe(1700000000000);
    expect(loaded!.setConfig).toEqual({ format: "bo3", legs: [], throwOrder: "alternate" });
    expect(loaded!.legResults).toEqual([]);
    expect(loaded!.currentLegIndex).toBe(0);
  });
});
