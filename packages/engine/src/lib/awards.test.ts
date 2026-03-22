import { describe, expect, it } from "vitest";
import { detectX01Award, detectCricketAward } from "./awards.ts";
import { CreateSegment, SegmentID } from "../board/Dartboard.ts";
import type { CricketThrownDart } from "../engine/cricket.types.ts";

function makeX01Dart(segId: SegmentID) {
  return { segment: CreateSegment(segId) };
}

function makeCricketDart(
  segId: SegmentID,
  target: number | null,
  marksAdded: number,
): CricketThrownDart {
  const segment = CreateSegment(segId);
  return {
    segment,
    target: target as CricketThrownDart["target"],
    marksAdded,
    marksEarned: marksAdded,
    effectiveMarks: marksAdded,
    pointsScored: 0,
  };
}

describe("detectX01Award", () => {
  it("returns null for 0 darts", () => {
    expect(detectX01Award([])).toBeNull();
  });

  it("returns null for 1 dart", () => {
    expect(detectX01Award([makeX01Dart(SegmentID.TRP_20)])).toBeNull();
  });

  it("returns null for 2 darts", () => {
    expect(
      detectX01Award([
        makeX01Dart(SegmentID.TRP_20),
        makeX01Dart(SegmentID.TRP_20),
      ]),
    ).toBeNull();
  });

  it("returns hattrick for 3 bulls (any combination)", () => {
    const darts = [
      makeX01Dart(SegmentID.BULL),
      makeX01Dart(SegmentID.DBL_BULL),
      makeX01Dart(SegmentID.BULL),
    ];
    expect(detectX01Award(darts)).toBe("hattrick");
  });

  it("returns ton80 for 3 x T20 (180)", () => {
    const darts = [
      makeX01Dart(SegmentID.TRP_20),
      makeX01Dart(SegmentID.TRP_20),
      makeX01Dart(SegmentID.TRP_20),
    ];
    expect(detectX01Award(darts)).toBe("ton80");
  });

  it("returns highton for T20+T20+T19 (177)", () => {
    const darts = [
      makeX01Dart(SegmentID.TRP_20),
      makeX01Dart(SegmentID.TRP_20),
      makeX01Dart(SegmentID.TRP_19),
    ];
    expect(detectX01Award(darts)).toBe("highton");
  });

  it("returns highton for T20+T20+D20 (160)", () => {
    const darts = [
      makeX01Dart(SegmentID.TRP_20),
      makeX01Dart(SegmentID.TRP_20),
      makeX01Dart(SegmentID.DBL_20),
    ];
    expect(detectX01Award(darts)).toBe("highton");
  });

  it("returns highton for exactly 140", () => {
    // T20(60) + T20(60) + INNER_20(20) = 140
    const darts = [
      makeX01Dart(SegmentID.TRP_20),
      makeX01Dart(SegmentID.TRP_20),
      makeX01Dart(SegmentID.INNER_20),
    ];
    expect(detectX01Award(darts)).toBe("highton");
  });

  it("returns lowton for T20+S20+S20 (100)", () => {
    // T20(60) + INNER_20(20) + INNER_20(20) = 100
    const darts = [
      makeX01Dart(SegmentID.TRP_20),
      makeX01Dart(SegmentID.INNER_20),
      makeX01Dart(SegmentID.INNER_20),
    ];
    expect(detectX01Award(darts)).toBe("lowton");
  });

  it("returns lowton for exactly 100", () => {
    // T20(60) + INNER_20(20) + OUTER_20(20) = 100
    const darts = [
      makeX01Dart(SegmentID.TRP_20),
      makeX01Dart(SegmentID.INNER_20),
      makeX01Dart(SegmentID.OUTER_20),
    ];
    expect(detectX01Award(darts)).toBe("lowton");
  });

  it("returns null for score 99", () => {
    // T19(57) + INNER_20(20) + INNER_11(11) = 88... let's do T20(60) + INNER_19(19) + INNER_20(20) = 99
    const darts = [
      makeX01Dart(SegmentID.TRP_20),
      makeX01Dart(SegmentID.INNER_19),
      makeX01Dart(SegmentID.INNER_20),
    ];
    expect(detectX01Award(darts)).toBeNull();
  });

  it("returns null for 3 misses", () => {
    const darts = [
      makeX01Dart(SegmentID.MISS),
      makeX01Dart(SegmentID.MISS),
      makeX01Dart(SegmentID.MISS),
    ];
    expect(detectX01Award(darts)).toBeNull();
  });

  it("hattrick takes precedence over highton (3 bulls = 150)", () => {
    // 3 x DBL_BULL = 150 which is >= 140, but hattrick check comes first
    const darts = [
      makeX01Dart(SegmentID.DBL_BULL),
      makeX01Dart(SegmentID.DBL_BULL),
      makeX01Dart(SegmentID.DBL_BULL),
    ];
    expect(detectX01Award(darts)).toBe("hattrick");
  });
});

describe("detectCricketAward", () => {
  it("returns null for fewer than 3 darts", () => {
    expect(detectCricketAward([])).toBeNull();
    expect(
      detectCricketAward([makeCricketDart(SegmentID.TRP_20, 20, 3)]),
    ).toBeNull();
  });

  it("returns threeinblack for 3 x DBL_BULL", () => {
    const darts = [
      makeCricketDart(SegmentID.DBL_BULL, 25, 2),
      makeCricketDart(SegmentID.DBL_BULL, 25, 2),
      makeCricketDart(SegmentID.DBL_BULL, 25, 2),
    ];
    expect(detectCricketAward(darts)).toBe("threeinblack");
  });

  it("returns hattrick for 3 bulls (mix of BULL and DBL_BULL)", () => {
    const darts = [
      makeCricketDart(SegmentID.BULL, 25, 1),
      makeCricketDart(SegmentID.DBL_BULL, 25, 2),
      makeCricketDart(SegmentID.BULL, 25, 1),
    ];
    expect(detectCricketAward(darts)).toBe("hattrick");
  });

  it("returns threeinbed for 3 x same cricket number + same ring", () => {
    const darts = [
      makeCricketDart(SegmentID.TRP_20, 20, 3),
      makeCricketDart(SegmentID.TRP_20, 20, 3),
      makeCricketDart(SegmentID.TRP_20, 20, 3),
    ];
    expect(detectCricketAward(darts)).toBe("threeinbed");
  });

  it("does NOT return threeinbed for same number but different rings", () => {
    const darts = [
      makeCricketDart(SegmentID.TRP_20, 20, 3),
      makeCricketDart(SegmentID.INNER_20, 20, 1),
      makeCricketDart(SegmentID.DBL_20, 20, 2),
    ];
    expect(detectCricketAward(darts)).not.toBe("threeinbed");
  });

  it("does NOT return threeinbed for non-cricket number (e.g., 3 x T14)", () => {
    const darts = [
      makeCricketDart(SegmentID.TRP_14, null, 0),
      makeCricketDart(SegmentID.TRP_14, null, 0),
      makeCricketDart(SegmentID.TRP_14, null, 0),
    ];
    expect(detectCricketAward(darts)).not.toBe("threeinbed");
  });

  it("returns whitehorse for 3 different virgin triples", () => {
    const darts = [
      makeCricketDart(SegmentID.TRP_20, 20, 3),
      makeCricketDart(SegmentID.TRP_19, 19, 3),
      makeCricketDart(SegmentID.TRP_18, 18, 3),
    ];
    expect(detectCricketAward(darts)).toBe("whitehorse");
  });

  it("does NOT return whitehorse if same target appears twice", () => {
    const darts = [
      makeCricketDart(SegmentID.TRP_20, 20, 3),
      makeCricketDart(SegmentID.TRP_20, 20, 3),
      makeCricketDart(SegmentID.TRP_18, 18, 3),
    ];
    expect(detectCricketAward(darts)).not.toBe("whitehorse");
  });

  it("does NOT return whitehorse if marksAdded < 3 (not virgin)", () => {
    const darts = [
      makeCricketDart(SegmentID.TRP_20, 20, 2),
      makeCricketDart(SegmentID.TRP_19, 19, 3),
      makeCricketDart(SegmentID.TRP_18, 18, 3),
    ];
    expect(detectCricketAward(darts)).not.toBe("whitehorse");
  });

  it("returns null when no award applies", () => {
    const darts = [
      makeCricketDart(SegmentID.INNER_20, 20, 1),
      makeCricketDart(SegmentID.INNER_19, 19, 1),
      makeCricketDart(SegmentID.MISS, null, 0),
    ];
    expect(detectCricketAward(darts)).toBeNull();
  });
});
