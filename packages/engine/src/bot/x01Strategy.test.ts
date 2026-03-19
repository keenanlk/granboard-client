import { describe, it, expect } from "vitest";
import { x01PickTarget } from "./x01Strategy.ts";
import { SegmentID } from "../board/Dartboard.ts";
import type { X01Options } from "../engine/x01.types.ts";

const base: X01Options = {
  startingScore: 501,
  splitBull: false,
  doubleIn: false,
  doubleOut: false,
  masterOut: false,
};

// ── Rule 1: Double In ────────────────────────────────────────────────────────

describe("Rule 1 — doubleIn: must open on a double", () => {
  const opts = { ...base, doubleIn: true };

  it("aims DBL_20 when not yet opened, regardless of score", () => {
    expect(x01PickTarget(501, opts, false)).toBe(SegmentID.DBL_20);
    expect(x01PickTarget(200, opts, false)).toBe(SegmentID.DBL_20);
    expect(x01PickTarget(32, opts, false)).toBe(SegmentID.DBL_20);
  });

  it("does NOT aim DBL_20 once the player has opened", () => {
    // With high score, should fall through to default (bull or T20)
    expect(x01PickTarget(501, opts, true)).not.toBe(SegmentID.DBL_20);
    expect(x01PickTarget(200, opts, true)).not.toBe(SegmentID.DBL_20);
  });
});

// ── Rule 2: Bull finish ──────────────────────────────────────────────────────

describe("Rule 2 — score 50: aim DBL_BULL to finish", () => {
  it("aims DBL_BULL at score 50 in standard out", () => {
    expect(x01PickTarget(50, base, true)).toBe(SegmentID.DBL_BULL);
  });

  it("aims DBL_BULL at score 50 in doubleOut", () => {
    expect(x01PickTarget(50, { ...base, doubleOut: true }, true)).toBe(
      SegmentID.DBL_BULL,
    );
  });

  it("aims DBL_BULL at score 50 in masterOut", () => {
    expect(x01PickTarget(50, { ...base, masterOut: true }, true)).toBe(
      SegmentID.DBL_BULL,
    );
  });
});

// ── Rule 3: Master Out — triple finish ───────────────────────────────────────

describe("Rule 3 — masterOut: triple finish when score ≤ 60 and divisible by 3", () => {
  const opts = { ...base, masterOut: true };

  it("aims TRP_20 when score is 60", () => {
    expect(x01PickTarget(60, opts, true)).toBe(SegmentID.TRP_20);
  });

  it("aims TRP_19 when score is 57", () => {
    expect(x01PickTarget(57, opts, true)).toBe(SegmentID.TRP_19);
  });

  it("aims TRP_1 when score is 3", () => {
    expect(x01PickTarget(3, opts, true)).toBe(SegmentID.TRP_1);
  });

  it("does NOT apply when score is not divisible by 3 (e.g. 59)", () => {
    // Falls through to Rule 4 (even) or Rule 5 (odd)
    expect(x01PickTarget(59, opts, true)).not.toBe(SegmentID.TRP_20);
  });

  it("does NOT apply when score is > 60", () => {
    // Score 63 = 3 × 21, but only 1–20 are valid; should not match
    // TRP_21 doesn't exist — verify the returned segment is a known valid SegmentID
    expect(Object.values(SegmentID) as number[]).toContain(
      x01PickTarget(63, opts, true),
    );
  });
});

// ── Rule 4: Double finish ────────────────────────────────────────────────────

describe("Rule 4 — doubleOut/masterOut: double finish when score ≤ 40 and even", () => {
  it("aims DBL_20 at score 40 with doubleOut", () => {
    expect(x01PickTarget(40, { ...base, doubleOut: true }, true)).toBe(
      SegmentID.DBL_20,
    );
  });

  it("aims DBL_16 at score 32 with doubleOut", () => {
    expect(x01PickTarget(32, { ...base, doubleOut: true }, true)).toBe(
      SegmentID.DBL_16,
    );
  });

  it("aims DBL_1 at score 2 with doubleOut", () => {
    expect(x01PickTarget(2, { ...base, doubleOut: true }, true)).toBe(
      SegmentID.DBL_1,
    );
  });

  it("aims DBL_20 at score 40 with masterOut", () => {
    expect(x01PickTarget(40, { ...base, masterOut: true }, true)).toBe(
      SegmentID.DBL_20,
    );
  });

  it("aims DBL_16 at score 32 with masterOut", () => {
    expect(x01PickTarget(32, { ...base, masterOut: true }, true)).toBe(
      SegmentID.DBL_16,
    );
  });

  it("does NOT apply at score 40 in standard out (falls to Rule 6)", () => {
    // Standard out Rule 6: score 40 ≤ 40 and even → DBL_20 (same result but different rule)
    // Make sure score 42 (> 40) falls through correctly
    expect(x01PickTarget(42, { ...base, doubleOut: true }, true)).not.toBe(
      SegmentID.DBL_20,
    );
  });
});

// ── Rule 5: Odd score near finish (doubleOut/masterOut) ──────────────────────

describe("Rule 5 — doubleOut/masterOut: aim OUTER_1 to leave even finish", () => {
  it("aims OUTER_1 at score 39 with doubleOut", () => {
    expect(x01PickTarget(39, { ...base, doubleOut: true }, true)).toBe(
      SegmentID.OUTER_1,
    );
  });

  it("aims OUTER_1 at score 1 with doubleOut", () => {
    expect(x01PickTarget(1, { ...base, doubleOut: true }, true)).toBe(
      SegmentID.OUTER_1,
    );
  });

  it("aims OUTER_1 at score 37 with masterOut", () => {
    expect(x01PickTarget(37, { ...base, masterOut: true }, true)).toBe(
      SegmentID.OUTER_1,
    );
  });
});

// ── Rule 6: Standard Out endgame ─────────────────────────────────────────────

describe("Rule 6 — standard out endgame (no doubleOut/masterOut)", () => {
  it("aims OUTER_20 (single) at score 20 to finish", () => {
    expect(x01PickTarget(20, base, true)).toBe(SegmentID.OUTER_20);
  });

  it("aims OUTER_1 (single) at score 1 to finish", () => {
    expect(x01PickTarget(1, base, true)).toBe(SegmentID.OUTER_1);
  });

  it("aims OUTER_15 (single) at score 15 to finish", () => {
    expect(x01PickTarget(15, base, true)).toBe(SegmentID.OUTER_15);
  });

  it("aims DBL_20 at score 40 (≤40, even)", () => {
    expect(x01PickTarget(40, base, true)).toBe(SegmentID.DBL_20);
  });

  it("aims DBL_16 at score 32 (≤40, even)", () => {
    expect(x01PickTarget(32, base, true)).toBe(SegmentID.DBL_16);
  });

  it("aims TRP_20 at score 60 (≤60, divisible by 3)", () => {
    expect(x01PickTarget(60, base, true)).toBe(SegmentID.TRP_20);
  });

  it("aims TRP_19 at score 57 (≤60, divisible by 3)", () => {
    expect(x01PickTarget(57, base, true)).toBe(SegmentID.TRP_19);
  });

  it("aims OUTER_5 at score 55 (outchart: 5, B)", () => {
    expect(x01PickTarget(55, base, true)).toBe(SegmentID.OUTER_5);
  });

  it("aims OUTER_9 at score 41 (outchart: 9, D16)", () => {
    expect(x01PickTarget(41, base, true)).toBe(SegmentID.OUTER_9);
  });
});

// ── Rule 7: Default target ───────────────────────────────────────────────────

describe("Rule 7 — default target for high scores", () => {
  it("aims DBL_BULL when splitBull is off (combined bull = bigger target)", () => {
    expect(x01PickTarget(501, { ...base, splitBull: false }, true)).toBe(
      SegmentID.DBL_BULL,
    );
    expect(x01PickTarget(200, { ...base, splitBull: false }, true)).toBe(
      SegmentID.DBL_BULL,
    );
  });

  it("aims TRP_20 when splitBull is on (outer bull only = 25, T20 = 60 is better)", () => {
    expect(x01PickTarget(501, { ...base, splitBull: true }, true)).toBe(
      SegmentID.TRP_20,
    );
    expect(x01PickTarget(200, { ...base, splitBull: true }, true)).toBe(
      SegmentID.TRP_20,
    );
  });

  it("aims DBL_BULL by default for doubleOut games above finish range", () => {
    expect(x01PickTarget(200, { ...base, doubleOut: true }, true)).toBe(
      SegmentID.DBL_BULL,
    );
  });

  it("aims TRP_20 for doubleOut games with splitBull on", () => {
    expect(
      x01PickTarget(200, { ...base, doubleOut: true, splitBull: true }, true),
    ).toBe(SegmentID.TRP_20);
  });
});

// ── Outchart (Rule 2) ────────────────────────────────────────────────────────

describe("Rule 2 — single-out outchart (split bull off)", () => {
  // Chart is only active when: no doubleOut, no masterOut, splitBull off
  const std = { ...base, splitBull: false };

  it("180 → TRP_20", () =>
    expect(x01PickTarget(180, std, true)).toBe(SegmentID.TRP_20));
  it("170 → TRP_20 (T20 T20 B)", () =>
    expect(x01PickTarget(170, std, true)).toBe(SegmentID.TRP_20));
  it("171 → TRP_19 (T19 T19 T19 is first path)", () =>
    expect(x01PickTarget(171, std, true)).toBe(SegmentID.TRP_19));
  it("160 → DBL_BULL (B B T20)", () =>
    expect(x01PickTarget(160, std, true)).toBe(SegmentID.DBL_BULL));
  it("145 → TRP_15 (T15 B B)", () =>
    expect(x01PickTarget(145, std, true)).toBe(SegmentID.TRP_15));
  it("150 → DBL_BULL (B B B)", () =>
    expect(x01PickTarget(150, std, true)).toBe(SegmentID.DBL_BULL));
  it("110 → TRP_20 (T20 B)", () =>
    expect(x01PickTarget(110, std, true)).toBe(SegmentID.TRP_20));
  it("107 → TRP_19 (T19 B)", () =>
    expect(x01PickTarget(107, std, true)).toBe(SegmentID.TRP_19));
  it("100 → DBL_BULL (B B)", () =>
    expect(x01PickTarget(100, std, true)).toBe(SegmentID.DBL_BULL));
  it("97  → TRP_19 (T19 D20)", () =>
    expect(x01PickTarget(97, std, true)).toBe(SegmentID.TRP_19));
  it("91  → TRP_17 (T17 D20)", () =>
    expect(x01PickTarget(91, std, true)).toBe(SegmentID.TRP_17));
  it("85  → TRP_15 (T15 D20)", () =>
    expect(x01PickTarget(85, std, true)).toBe(SegmentID.TRP_15));
  it("70  → OUTER_20 (20 B)", () =>
    expect(x01PickTarget(70, std, true)).toBe(SegmentID.OUTER_20));
  it("69  → OUTER_19 (19 B)", () =>
    expect(x01PickTarget(69, std, true)).toBe(SegmentID.OUTER_19));
  it("60  → TRP_20 (1-dart finish)", () =>
    expect(x01PickTarget(60, std, true)).toBe(SegmentID.TRP_20));
  it("57  → TRP_19 (1-dart finish)", () =>
    expect(x01PickTarget(57, std, true)).toBe(SegmentID.TRP_19));
  it("50  → DBL_BULL (1-dart finish)", () =>
    expect(x01PickTarget(50, std, true)).toBe(SegmentID.DBL_BULL));
  it("48  → TRP_16 (1-dart finish)", () =>
    expect(x01PickTarget(48, std, true)).toBe(SegmentID.TRP_16));
  it("42  → TRP_14 (1-dart finish)", () =>
    expect(x01PickTarget(42, std, true)).toBe(SegmentID.TRP_14));
  it("41  → OUTER_9 (9 D16)", () =>
    expect(x01PickTarget(41, std, true)).toBe(SegmentID.OUTER_9));

  it("gaps like 179 fall back to DBL_BULL", () => {
    expect(x01PickTarget(179, std, true)).toBe(SegmentID.DBL_BULL);
    expect(x01PickTarget(178, std, true)).toBe(SegmentID.DBL_BULL);
    expect(x01PickTarget(176, std, true)).toBe(SegmentID.DBL_BULL);
  });

  it("chart is NOT active when splitBull is on", () => {
    // With splitBull on, 160 should NOT return DBL_BULL from the chart
    const splitOn = { ...base, splitBull: true };
    expect(x01PickTarget(160, splitOn, true)).not.toBe(SegmentID.DBL_BULL);
  });

  it("chart is NOT active when doubleOut is on", () => {
    const dbl = { ...base, doubleOut: true, splitBull: false };
    // Without doubleOut: chart gives OUTER_9 for 41. With doubleOut: 41 > 40,
    // no finish rules fire, falls to Rule 8 → DBL_BULL.
    expect(x01PickTarget(41, dbl, true)).toBe(SegmentID.DBL_BULL);
    // Without doubleOut: chart gives TRP_20 for 170. With doubleOut: → DBL_BULL.
    expect(x01PickTarget(170, dbl, true)).toBe(SegmentID.DBL_BULL);
  });
});

// ── Rule interactions ────────────────────────────────────────────────────────

describe("Rule interactions and edge cases", () => {
  it("doubleIn + unopened takes priority over everything else (score 50)", () => {
    // Even though score=50 would normally trigger bull finish, doubleIn gate wins
    expect(x01PickTarget(50, { ...base, doubleIn: true }, false)).toBe(
      SegmentID.DBL_20,
    );
  });

  it("masterOut at score 50 → bull finish (Rule 2 before Rule 3)", () => {
    // 50 is divisible by... no, 50/3 is not integer, but Rule 2 (score=50) fires first
    expect(x01PickTarget(50, { ...base, masterOut: true }, true)).toBe(
      SegmentID.DBL_BULL,
    );
  });

  it("masterOut at score 60 → TRP_20 (Rule 3), not DBL_20 (Rule 4 requires ≤40)", () => {
    expect(x01PickTarget(60, { ...base, masterOut: true }, true)).toBe(
      SegmentID.TRP_20,
    );
  });

  it("masterOut at score 40 → DBL_20 (Rule 4, even ≤ 40)", () => {
    expect(x01PickTarget(40, { ...base, masterOut: true }, true)).toBe(
      SegmentID.DBL_20,
    );
  });

  it("score 2 with standard out → OUTER_2 (single finish)", () => {
    expect(x01PickTarget(2, base, true)).toBe(SegmentID.OUTER_2);
  });
});
