import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SegmentID } from "../board/Dartboard.ts";
import type { CricketPlayer } from "../engine/cricket.types.ts";

vi.mock("./throwSimulator.ts", () => ({
  simulateThrow: vi.fn(
    (_target: SegmentID, _sigma: number) => 78 as SegmentID, // SegmentID.OUTER_20
  ),
}));

import { Bot, BotSkill } from "./Bot.ts";
import { simulateThrow } from "./throwSimulator.ts";
import { DEFAULT_X01_OPTIONS } from "../engine/x01.types.ts";
import { emptyMarks } from "../engine/cricket.types.ts";

const mockSimulateThrow = simulateThrow as unknown as ReturnType<typeof vi.fn>;

describe("Bot", () => {
  beforeEach(() => {
    mockSimulateThrow.mockClear();
  });

  // ── Constructor ──────────────────────────────────────────────

  it("sets name from constructor", () => {
    const bot = new Bot("TestBot", BotSkill.Intermediate);
    expect(bot.name).toBe("TestBot");
  });

  it("sets sigma from skill value", () => {
    const bot = new Bot("CPU", BotSkill.Pro);
    expect(bot.sigma).toBe(11);
  });

  it("uses Beginner skill (100) correctly", () => {
    const bot = new Bot("Noob", BotSkill.Beginner);
    expect(bot.sigma).toBe(100);
  });

  // ── throwX01 ─────────────────────────────────────────────────

  it("throwX01 returns a SegmentID", () => {
    const bot = new Bot("CPU", BotSkill.Intermediate);
    const result = bot.throwX01(501, DEFAULT_X01_OPTIONS, false);
    expect(typeof result).toBe("number");
  });

  it("throwX01 calls simulateThrow with correct sigma", () => {
    const bot = new Bot("CPU", BotSkill.Club);
    bot.throwX01(301, DEFAULT_X01_OPTIONS, true);
    expect(mockSimulateThrow).toHaveBeenCalledWith(expect.any(Number), 28);
  });

  it("throwX01 calls onThrow callback with target and actual", () => {
    const bot = new Bot("CPU", BotSkill.Intermediate);
    const onThrow = vi.fn();
    bot.throwX01(501, DEFAULT_X01_OPTIONS, false, onThrow);
    expect(onThrow).toHaveBeenCalledOnce();
    expect(onThrow).toHaveBeenCalledWith(expect.any(Number), 78);
  });

  it("throwX01 does not throw when onThrow is omitted", () => {
    const bot = new Bot("CPU", BotSkill.Intermediate);
    expect(() => bot.throwX01(501, DEFAULT_X01_OPTIONS, false)).not.toThrow();
  });

  // ── throwCricket ─────────────────────────────────────────────

  it("throwCricket returns a SegmentID", () => {
    const bot = new Bot("CPU", BotSkill.Advanced);
    const marks = emptyMarks();
    const players: CricketPlayer[] = [
      { name: "CPU", marks: emptyMarks(), score: 0, totalDartsThrown: 0, totalMarksEarned: 0, rounds: [] },
      { name: "P2", marks: emptyMarks(), score: 0, totalDartsThrown: 0, totalMarksEarned: 0, rounds: [] },
    ];
    const result = bot.throwCricket(marks, players, 0);
    expect(typeof result).toBe("number");
  });

  it("throwCricket calls simulateThrow with correct sigma", () => {
    const bot = new Bot("CPU", BotSkill.SemiPro);
    const marks = emptyMarks();
    const players: CricketPlayer[] = [
      { name: "CPU", marks: emptyMarks(), score: 0, totalDartsThrown: 0, totalMarksEarned: 0, rounds: [] },
      { name: "P2", marks: emptyMarks(), score: 0, totalDartsThrown: 0, totalMarksEarned: 0, rounds: [] },
    ];
    bot.throwCricket(marks, players, 0);
    expect(mockSimulateThrow).toHaveBeenCalledWith(expect.any(Number), 15.5);
  });

  it("throwCricket calls onThrow callback", () => {
    const bot = new Bot("CPU", BotSkill.Intermediate);
    const onThrow = vi.fn();
    const marks = emptyMarks();
    const players: CricketPlayer[] = [
      { name: "CPU", marks: emptyMarks(), score: 0, totalDartsThrown: 0, totalMarksEarned: 0, rounds: [] },
      { name: "P2", marks: emptyMarks(), score: 0, totalDartsThrown: 0, totalMarksEarned: 0, rounds: [] },
    ];
    bot.throwCricket(marks, players, 0, onThrow);
    expect(onThrow).toHaveBeenCalledOnce();
  });

  // ── throwHighScore ───────────────────────────────────────────

  it("throwHighScore returns a SegmentID", () => {
    const bot = new Bot("CPU", BotSkill.County);
    const result = bot.throwHighScore(true);
    expect(typeof result).toBe("number");
  });

  it("throwHighScore calls simulateThrow with correct sigma", () => {
    const bot = new Bot("CPU", BotSkill.County);
    bot.throwHighScore(false);
    expect(mockSimulateThrow).toHaveBeenCalledWith(expect.any(Number), 24);
  });

  it("throwHighScore does not throw when onThrow is omitted", () => {
    const bot = new Bot("CPU", BotSkill.Intermediate);
    expect(() => bot.throwHighScore(true)).not.toThrow();
  });

  // ── throwATW ─────────────────────────────────────────────────

  it("throwATW returns a SegmentID", () => {
    const bot = new Bot("CPU", BotSkill.Pro);
    const result = bot.throwATW(5);
    expect(typeof result).toBe("number");
  });

  it("throwATW calls simulateThrow with correct sigma", () => {
    const bot = new Bot("CPU", BotSkill.Pro);
    bot.throwATW(10);
    expect(mockSimulateThrow).toHaveBeenCalledWith(expect.any(Number), 11);
  });

  // ── throwTicTacToe ───────────────────────────────────────────

  it("throwTicTacToe returns a SegmentID", () => {
    const bot = new Bot("CPU", BotSkill.Intermediate);
    const grid = [20, 19, 18, 17, 16, 15, 14, 13, 12];
    const owner: (0 | 1 | null)[] = [null, null, null, null, null, null, null, null, null];
    const result = bot.throwTicTacToe(grid, owner, 0, [], []);
    expect(typeof result).toBe("number");
  });

  it("throwTicTacToe calls onThrow callback with target and actual", () => {
    const bot = new Bot("CPU", BotSkill.Advanced);
    const onThrow = vi.fn();
    const grid = [20, 19, 18, 17, 16, 15, 14, 13, 12];
    const owner: (0 | 1 | null)[] = [null, null, null, null, null, null, null, null, null];
    bot.throwTicTacToe(grid, owner, 0, [], [], onThrow);
    expect(onThrow).toHaveBeenCalledOnce();
    expect(onThrow).toHaveBeenCalledWith(expect.any(Number), 78);
  });

  it("throwTicTacToe calls simulateThrow with correct sigma", () => {
    const bot = new Bot("CPU", BotSkill.Advanced);
    const grid = [20, 19, 18, 17, 16, 15, 14, 13, 12];
    const owner: (0 | 1 | null)[] = [null, null, null, null, null, null, null, null, null];
    bot.throwTicTacToe(grid, owner, 0, [], []);
    expect(mockSimulateThrow).toHaveBeenCalledWith(expect.any(Number), 20);
  });
});
