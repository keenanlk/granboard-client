import { describe, it, expect } from "vitest";
import {
  segmentCenter,
  coordToSegmentId,
  CLOCKWISE_NUMBERS,
  RING_RADII,
} from "./BoardGeometry.ts";
import { SegmentID } from "./Dartboard.ts";

// Midpoints for each zone — used as "safe" test coordinates
const MID = {
  innerBull: RING_RADII.innerBull / 2,
  outerBull: (RING_RADII.innerBull + RING_RADII.outerBull) / 2,
  innerSingle: (RING_RADII.outerBull + RING_RADII.innerSingle) / 2,
  treble: (RING_RADII.innerSingle + RING_RADII.treble) / 2,
  outerSingle: (RING_RADII.treble + RING_RADII.outerSingle) / 2,
  double: (RING_RADII.outerSingle + RING_RADII.double) / 2,
};

// ---------------------------------------------------------------------------
// coordToSegmentId — bull zones
// ---------------------------------------------------------------------------
describe("coordToSegmentId — bull zones", () => {
  it("(0, 0) = dead center → DBL_BULL", () => {
    expect(coordToSegmentId(0, 0)).toBe(SegmentID.DBL_BULL);
  });

  it(`(0, ${MID.innerBull}) → DBL_BULL (within inner bull)`, () => {
    expect(coordToSegmentId(0, MID.innerBull)).toBe(SegmentID.DBL_BULL);
  });

  it(`(0, ${MID.outerBull}) → BULL (in outer bull ring)`, () => {
    expect(coordToSegmentId(0, MID.outerBull)).toBe(SegmentID.BULL);
  });

  it(`(0, ${RING_RADII.outerBull - 0.1}) → BULL (at outer bull boundary)`, () => {
    expect(coordToSegmentId(0, RING_RADII.outerBull - 0.1)).toBe(
      SegmentID.BULL,
    );
  });
});

// ---------------------------------------------------------------------------
// coordToSegmentId — miss
// ---------------------------------------------------------------------------
describe("coordToSegmentId — miss", () => {
  it(`> ${RING_RADII.double}mm → MISS`, () => {
    expect(coordToSegmentId(0, 200)).toBe(SegmentID.MISS);
    expect(coordToSegmentId(200, 0)).toBe(SegmentID.MISS);
  });

  it(`${RING_RADII.double + 1}mm → MISS (just outside double ring)`, () => {
    expect(coordToSegmentId(0, RING_RADII.double + 1)).toBe(SegmentID.MISS);
  });
});

// ---------------------------------------------------------------------------
// coordToSegmentId — sectors (number 20 at top)
// ---------------------------------------------------------------------------
describe("coordToSegmentId — number 20 sector (straight up)", () => {
  it("inner single zone → INNER_20", () => {
    expect(coordToSegmentId(0, MID.innerSingle)).toBe(SegmentID.INNER_20);
  });

  it("treble zone → TRP_20", () => {
    expect(coordToSegmentId(0, MID.treble)).toBe(SegmentID.TRP_20);
  });

  it("outer single zone → OUTER_20", () => {
    expect(coordToSegmentId(0, MID.outerSingle)).toBe(SegmentID.OUTER_20);
  });

  it("double zone → DBL_20", () => {
    expect(coordToSegmentId(0, MID.double)).toBe(SegmentID.DBL_20);
  });
});

// ---------------------------------------------------------------------------
// coordToSegmentId — sector boundaries
// ---------------------------------------------------------------------------
describe("coordToSegmentId — sector boundaries", () => {
  it("sector boundary at 9° stays in sector 0 (number 20)", () => {
    // 8.9° is still sector 0
    const rad = (8.9 * Math.PI) / 180;
    const x = MID.treble * Math.sin(rad);
    const y = MID.treble * Math.cos(rad);
    expect(coordToSegmentId(x, y)).toBe(SegmentID.TRP_20);
  });

  it("just past 9° enters sector 1 (number 1)", () => {
    const rad = (9.1 * Math.PI) / 180;
    const x = MID.treble * Math.sin(rad);
    const y = MID.treble * Math.cos(rad);
    expect(coordToSegmentId(x, y)).toBe(SegmentID.TRP_1);
  });

  it("sector at -9° (351°) is still number 20", () => {
    const rad = (-8.9 * Math.PI) / 180;
    const x = MID.treble * Math.sin(rad);
    const y = MID.treble * Math.cos(rad);
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
      const x = MID.treble * Math.sin(rad);
      const y = MID.treble * Math.cos(rad);
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
