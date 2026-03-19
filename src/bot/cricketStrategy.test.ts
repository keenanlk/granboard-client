import { describe, it, expect } from "vitest";
import { cricketPickTarget } from "./cricketStrategy.ts";
import { SegmentID } from "../board/Dartboard.ts";
import type { CricketPlayer } from "../engine/cricket.types.ts";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMarks(
  overrides: Partial<Record<number, number>> = {},
): Record<15 | 16 | 17 | 18 | 19 | 20 | 25, number> {
  return {
    20: 0,
    19: 0,
    18: 0,
    17: 0,
    16: 0,
    15: 0,
    25: 0,
    ...overrides,
  } as Record<15 | 16 | 17 | 18 | 19 | 20 | 25, number>;
}

function makePlayer(
  name: string,
  marks: Record<number, number>,
  score = 0,
): CricketPlayer {
  return {
    name,
    marks,
    score,
    totalDartsThrown: 0,
    totalMarksEarned: 0,
    rounds: [],
  };
}

// tripleFor: segment IDs for standard numbers (SegmentID = (n-1)*4+1)
const TRP_20 = SegmentID.TRP_20;
const TRP_18 = SegmentID.TRP_18;
const TRP_17 = SegmentID.TRP_17;

// ── Test 1: CATCHUP, 0-mark denial vs active scoring lane → scoring wins ──────

describe("CATCHUP mode (large deficit)", () => {
  it("prefers scoring on an owned number over starting denial from scratch (0 marks)", () => {
    // CPU owns 18 (can score), has 0 marks on 17 (potential denial).
    // Opponent has 17 closed (scoring on CPU) but CPU has no marks there yet.
    // Score gap: CPU 18, Opponent 228 → −210 → CATCHUP mode.
    const cpuMarks = makeMarks({ 18: 3 }); // CPU closed 18, can score
    const oppMarks = makeMarks({ 17: 3, 18: 0 }); // opp closed 17 (scoring), 18 open

    const cpu = makePlayer("CPU", cpuMarks, 18);
    const opp = makePlayer("Human", oppMarks, 228);

    const target = cricketPickTarget(cpuMarks, [cpu, opp], 0);

    // Should pick TRP_18 (score) not TRP_17 (0-mark denial)
    expect(target).toBe(TRP_18);
  });
});

// ── Test 2: CATCHUP, 2-mark denial vs active scoring lane → scoring wins ──────

describe("CATCHUP mode — denial with 2 marks already", () => {
  it("keeps scoring even with 2 marks on a denial target when far behind", () => {
    // CPU owns 18 (can score), has 2 marks on 17.
    // When down 210 points, scoring is still the priority — don't abandon the lane.
    const cpuMarks = makeMarks({ 18: 3, 17: 2 });
    const oppMarks = makeMarks({ 17: 3, 18: 0 });

    const cpu = makePlayer("CPU", cpuMarks, 18);
    const opp = makePlayer("Human", oppMarks, 228);

    const target = cricketPickTarget(cpuMarks, [cpu, opp], 0);

    // sv(18)×2.0 = 36 >> dv(17,2marks)×0.5 = 8.5 → scoring wins
    expect(target).toBe(TRP_18);
  });
});

// ── Test 3: RACE, 0-mark denial vs active scoring lane → scoring wins ─────────
// ── Test 3b: RACE, 1-mark denial vs active scoring lane → denial wins ─────────

describe("RACE mode (scores close)", () => {
  it("prefers scoring over starting denial from scratch (0 marks) even in a close game", () => {
    // cv=0 for denial targets (no double-count), so sv(18)×1.0=18 > dv(17,0marks)×1.8=10.2
    const cpuMarks = makeMarks({ 18: 3 });
    const oppMarks = makeMarks({ 17: 3, 18: 0 });

    const cpu = makePlayer("CPU", cpuMarks, 200);
    const opp = makePlayer("Human", oppMarks, 218);

    const target = cricketPickTarget(cpuMarks, [cpu, opp], 0);

    expect(target).toBe(TRP_18);
  });

  it("finishes denial once 1 mark is already on the target (committed, close game)", () => {
    // dv(17,1mark)×1.8 = 11.33×1.8 = 20.4 > sv(18)×1.0 = 18 → denial wins
    const cpuMarks = makeMarks({ 18: 3, 17: 1 });
    const oppMarks = makeMarks({ 17: 3, 18: 0 });

    const cpu = makePlayer("CPU", cpuMarks, 200);
    const opp = makePlayer("Human", oppMarks, 218);

    const target = cricketPickTarget(cpuMarks, [cpu, opp], 0);

    expect(target).toBe(TRP_17);
  });
});

// ── Test 3c/3d: LOCKDOWN — close/progress beats farming; deny when committed ───

describe("LOCKDOWN mode (large lead)", () => {
  const TRP_16 = SegmentID.TRP_16;

  it("prefers closing the next unclosed number over farming an active scoring lane", () => {
    // CPU has 18 closed (scoring lane, opp open). Opp has 16 closed (denial target).
    // 17 is unclosed by both: cv(17)×2.0 = (17/3)×2 = 11.33 > sv(18)×0.6 = 10.8.
    // LOCKDOWN prioritizes progressing through the board over scoring.
    const cpuMarks = makeMarks({ 20: 3, 19: 3, 18: 3 });
    const oppMarks = makeMarks({ 20: 3, 19: 3, 16: 3, 18: 0 });

    const cpu = makePlayer("CPU", cpuMarks, 110);
    const opp = makePlayer("Human", oppMarks, 50);

    const target = cricketPickTarget(cpuMarks, [cpu, opp], 0);
    expect(target).toBe(TRP_17);
  });

  it("pivots to denial once 1 mark is on the target (committed)", () => {
    // 1 mark on 16 denial: dv(16,1mark)×2.0 = (32/3)×2 = 21.3 > cv(17)×2.0 = 11.33
    const cpuMarks = makeMarks({ 20: 3, 19: 3, 18: 3, 16: 1 });
    const oppMarks = makeMarks({ 20: 3, 19: 3, 16: 3, 18: 0 });

    const cpu = makePlayer("CPU", cpuMarks, 110);
    const opp = makePlayer("Human", oppMarks, 50);

    const target = cricketPickTarget(cpuMarks, [cpu, opp], 0);
    expect(target).toBe(TRP_16);
  });
});

// ── Test 4: No scoring lane — picks highest-value unclosed number ─────────────

describe("No active scoring lane", () => {
  it("targets the highest unclosed number when no scoring is possible", () => {
    // CPU has nothing closed. Opponent has nothing closed. No scoring possible.
    const cpuMarks = makeMarks();
    const oppMarks = makeMarks();

    const cpu = makePlayer("CPU", cpuMarks, 0);
    const opp = makePlayer("Human", oppMarks, 0);

    const target = cricketPickTarget(cpuMarks, [cpu, opp], 0);

    // Without scoring or denial, should target TRP_20 (highest strategy value)
    expect(target).toBe(TRP_20);
  });
});

// ── Test 5: All numbers settled except bull → targets bull ────────────────────

describe("Only bull remaining", () => {
  it("targets bull when all other numbers are fully settled", () => {
    // Both players have 20,19,18,17,16,15 closed — only 25 remains open for CPU.
    const allClosed = makeMarks({ 20: 3, 19: 3, 18: 3, 17: 3, 16: 3, 15: 3 });
    const cpuMarks = { ...allClosed, 25: 0 };
    const oppMarks = { ...allClosed, 25: 3 }; // opp has bull closed too

    const cpu = makePlayer("CPU", cpuMarks, 0);
    const opp = makePlayer("Human", oppMarks, 0);

    const target = cricketPickTarget(cpuMarks, [cpu, opp], 0);

    expect(target).toBe(SegmentID.DBL_BULL);
  });
});
