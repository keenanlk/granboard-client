import { describe, it, expect } from "vitest";
import { simulateThrow } from "./throwSimulator.ts";
import { BotSkill } from "./bot.types.ts";
import { SegmentID, CreateSegment } from "../board/Dartboard.ts";

const VALID_IDS = new Set(Object.values(SegmentID));

// ---------------------------------------------------------------------------
// simulateThrow always returns a valid SegmentID
// ---------------------------------------------------------------------------
describe("simulateThrow — always returns valid SegmentID", () => {
  it("returns a known SegmentID for TRP_20 at each skill level", () => {
    for (const sigma of Object.values(BotSkill)) {
      for (let i = 0; i < 20; i++) {
        const result = simulateThrow(SegmentID.TRP_20, sigma);
        expect(VALID_IDS.has(result)).toBe(true);
      }
    }
  });

  it("returns a valid SegmentID when aiming at DBL_BULL", () => {
    for (let i = 0; i < 20; i++) {
      const result = simulateThrow(SegmentID.DBL_BULL, BotSkill.Intermediate);
      expect(VALID_IDS.has(result)).toBe(true);
    }
  });

  it("simulateThrow result can be passed to CreateSegment without throwing", () => {
    for (let i = 0; i < 20; i++) {
      const id = simulateThrow(SegmentID.TRP_20, BotSkill.Intermediate);
      expect(() => CreateSegment(id)).not.toThrow();
    }
  });
});

// ---------------------------------------------------------------------------
// Statistical accuracy — pro should be far more accurate than beginner
// ---------------------------------------------------------------------------
describe("simulateThrow — statistical accuracy", () => {
  const SAMPLES = 500;

  it("pro bot hits TRP_20 or adjacent 20-sector more often than beginner", () => {
    // Segments in the number-20 sector at any ring (any zone of 20)
    const sector20 = new Set<SegmentID>([
      SegmentID.INNER_20,
      SegmentID.TRP_20,
      SegmentID.OUTER_20,
      SegmentID.DBL_20,
    ]);

    let proHits = 0;
    let beginnerHits = 0;
    for (let i = 0; i < SAMPLES; i++) {
      if (sector20.has(simulateThrow(SegmentID.TRP_20, BotSkill.Pro)))
        proHits++;
      if (sector20.has(simulateThrow(SegmentID.TRP_20, BotSkill.Beginner)))
        beginnerHits++;
    }

    // Pro should land in the 20 sector significantly more often than a beginner
    expect(proHits).toBeGreaterThan(beginnerHits);
  });

  it("pro bot hits TRP_20 itself at least 35% of the time", () => {
    // TRP_20 is an 8mm-wide ring; σ=6mm → ~45% hit rate, well above 35%.
    let hits = 0;
    for (let i = 0; i < SAMPLES; i++) {
      if (simulateThrow(SegmentID.TRP_20, BotSkill.Pro) === SegmentID.TRP_20)
        hits++;
    }
    expect(hits).toBeGreaterThan(SAMPLES * 0.35);
  });

  it("beginner bot does NOT always hit TRP_20 (scatter is wide)", () => {
    const results = new Set<SegmentID>();
    for (let i = 0; i < SAMPLES; i++) {
      results.add(simulateThrow(SegmentID.TRP_20, BotSkill.Beginner));
    }
    // A beginner should scatter across many different segments
    expect(results.size).toBeGreaterThan(10);
  });
});

// ---------------------------------------------------------------------------
// BotSkill constants are positive numbers
// ---------------------------------------------------------------------------
describe("BotSkill constants", () => {
  it("all skill values are positive numbers", () => {
    for (const sigma of Object.values(BotSkill)) {
      expect(typeof sigma).toBe("number");
      expect(sigma).toBeGreaterThan(0);
    }
  });

  it("skill levels are ordered Pro < SemiPro < Advanced < County < Club < Intermediate < Beginner", () => {
    expect(BotSkill.Pro).toBeLessThan(BotSkill.SemiPro);
    expect(BotSkill.SemiPro).toBeLessThan(BotSkill.Advanced);
    expect(BotSkill.Advanced).toBeLessThan(BotSkill.County);
    expect(BotSkill.County).toBeLessThan(BotSkill.Club);
    expect(BotSkill.Club).toBeLessThan(BotSkill.Intermediate);
    expect(BotSkill.Intermediate).toBeLessThan(BotSkill.Beginner);
  });
});
