import { describe, it, expect } from "vitest";
import { segmentCenter, coordToSegmentId, CLOCKWISE_NUMBERS } from "./BoardGeometry.ts";
import { SegmentID } from "./Dartboard.ts";

// ---------------------------------------------------------------------------
// coordToSegmentId — bull zones
// ---------------------------------------------------------------------------
describe("coordToSegmentId — bull zones", () => {
  it("(0, 0) = dead center → DBL_BULL", () => {
    expect(coordToSegmentId(0, 0)).toBe(SegmentID.DBL_BULL);
  });

  it("(0, 6) → DBL_BULL (within 6.35mm)", () => {
    expect(coordToSegmentId(0, 6)).toBe(SegmentID.DBL_BULL);
  });

  it("(0, 10) → BULL (between 6.35 and 15.9mm)", () => {
    expect(coordToSegmentId(0, 10)).toBe(SegmentID.BULL);
  });

  it("(0, 15.9) → BULL (at outer bull boundary)", () => {
    expect(coordToSegmentId(0, 15.9)).toBe(SegmentID.BULL);
  });
});

// ---------------------------------------------------------------------------
// coordToSegmentId — miss
// ---------------------------------------------------------------------------
describe("coordToSegmentId — miss", () => {
  it("> 170mm → MISS", () => {
    expect(coordToSegmentId(0, 200)).toBe(SegmentID.MISS);
    expect(coordToSegmentId(200, 0)).toBe(SegmentID.MISS);
  });

  it("171mm → MISS (just outside double ring)", () => {
    expect(coordToSegmentId(0, 171)).toBe(SegmentID.MISS);
  });
});

// ---------------------------------------------------------------------------
// coordToSegmentId — sectors (number 20 at top)
// ---------------------------------------------------------------------------
describe("coordToSegmentId — number 20 sector (straight up)", () => {
  it("inner single zone (50mm up) → INNER_20", () => {
    expect(coordToSegmentId(0, 50)).toBe(SegmentID.INNER_20);
  });

  it("treble zone (103mm up) → TRP_20", () => {
    expect(coordToSegmentId(0, 103)).toBe(SegmentID.TRP_20);
  });

  it("outer single zone (134mm up) → OUTER_20", () => {
    expect(coordToSegmentId(0, 134)).toBe(SegmentID.OUTER_20);
  });

  it("double zone (166mm up) → DBL_20", () => {
    expect(coordToSegmentId(0, 166)).toBe(SegmentID.DBL_20);
  });
});

// ---------------------------------------------------------------------------
// coordToSegmentId — sector boundaries
// ---------------------------------------------------------------------------
describe("coordToSegmentId — sector boundaries", () => {
  it("sector boundary at 9° stays in sector 0 (number 20)", () => {
    // 8.9° is still sector 0
    const rad = (8.9 * Math.PI) / 180;
    const x = 103 * Math.sin(rad);
    const y = 103 * Math.cos(rad);
    expect(coordToSegmentId(x, y)).toBe(SegmentID.TRP_20);
  });

  it("just past 9° enters sector 1 (number 1)", () => {
    const rad = (9.1 * Math.PI) / 180;
    const x = 103 * Math.sin(rad);
    const y = 103 * Math.cos(rad);
    expect(coordToSegmentId(x, y)).toBe(SegmentID.TRP_1);
  });

  it("sector at -9° (351°) is still number 20", () => {
    const rad = (-8.9 * Math.PI) / 180;
    const x = 103 * Math.sin(rad);
    const y = 103 * Math.cos(rad);
    expect(coordToSegmentId(x, y)).toBe(SegmentID.TRP_20);
  });
});

// ---------------------------------------------------------------------------
// coordToSegmentId — all 20 numbers at treble center
// ---------------------------------------------------------------------------
describe("coordToSegmentId — treble centers for all 20 numbers", () => {
  CLOCKWISE_NUMBERS.forEach((num, sectorIdx) => {
    it(`sector ${sectorIdx} → TRP_${num}`, () => {
      const angleDeg = sectorIdx * 18;
      const rad = (angleDeg * Math.PI) / 180;
      const x = 103 * Math.sin(rad); // 103mm = treble zone center
      const y = 103 * Math.cos(rad);
      const expected = ((num - 1) * 4 + 1) as SegmentID; // TRP_N
      expect(coordToSegmentId(x, y)).toBe(expected);
    });
  });
});

// ---------------------------------------------------------------------------
// segmentCenter round-trip: segmentCenter → coordToSegmentId should be identity
// ---------------------------------------------------------------------------
describe("segmentCenter round-trip", () => {
  it("DBL_BULL center maps back to DBL_BULL", () => {
    const { x, y } = segmentCenter(SegmentID.DBL_BULL);
    expect(coordToSegmentId(x, y)).toBe(SegmentID.DBL_BULL);
  });

  it("BULL center maps back to BULL", () => {
    const { x, y } = segmentCenter(SegmentID.BULL);
    expect(coordToSegmentId(x, y)).toBe(SegmentID.BULL);
  });

  // Test all 4 zones for every number 1–20
  const ZONES = [
    { code: 0, label: "INNER" },
    { code: 1, label: "TRP" },
    { code: 2, label: "OUTER" },
    { code: 3, label: "DBL" },
  ];
  for (let n = 1; n <= 20; n++) {
    for (const { code, label } of ZONES) {
      const segId = ((n - 1) * 4 + code) as SegmentID;
      it(`${label}_${n} center maps back to itself`, () => {
        const { x, y } = segmentCenter(segId);
        expect(coordToSegmentId(x, y)).toBe(segId);
      });
    }
  }
});
