import { SegmentID } from "./Dartboard.ts";

/**
 * Dartboard numbers in clockwise order starting from top (20 at 12 o'clock).
 * Each sector spans 18° and is centered at sectorIndex * 18°.
 */
export const CLOCKWISE_NUMBERS = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
] as const;

/**
 * Dartboard segment ring outer radii in mm, measured from bull center.
 *
 * These are the BDO/WDF playing-area dimensions — the same values used by soft-tip
 * electronic boards including Granboard. The "17.75 inch" BDO measurement refers to
 * the total board including its mounting surround; the ring boundaries below define
 * only the scoring surface and apply equally to soft-tip boards.
 */
export const RING_RADII = {
  innerBull: 6.35, // inner bull: 0–6.35mm
  outerBull: 15.9, // outer bull: 6.35–15.9mm
  innerSingle: 99.0, // inner single: 15.9–99mm
  treble: 107.0, // treble ring: 99–107mm
  outerSingle: 162.0, // outer single: 107–162mm
  double: 170.0, // double ring: 162–170mm
  // > 170mm = miss
} as const;

// Midpoint radius of each zone — used as the aim point for strategy targeting.
const ZONE_MID = {
  innerBull: 0,
  outerBull: (6.35 + 15.9) / 2, // ≈11.1mm
  innerSingle: (15.9 + 99.0) / 2, // ≈57.5mm
  treble: (99.0 + 107.0) / 2, // 103mm
  outerSingle: (107.0 + 162.0) / 2, // 134.5mm
  double: (162.0 + 170.0) / 2, // 166mm
} as const;

/**
 * Returns the (x, y) center of a segment in mm, origin at bull center.
 * Coordinate system: x = right, y = up, θ = clockwise from top.
 * x = r·sin(θ), y = r·cos(θ)
 *
 * Used by the throw simulator as the "aim point" before Gaussian noise is applied.
 */
export function segmentCenter(segmentId: SegmentID): { x: number; y: number } {
  if (segmentId === SegmentID.DBL_BULL) return { x: 0, y: ZONE_MID.innerBull };
  if (segmentId === SegmentID.BULL) return { x: 0, y: ZONE_MID.outerBull };
  if (segmentId >= SegmentID.MISS) return { x: 200, y: 0 }; // off-board fallback

  // Numbers 1–20: decode zone (0=inner, 1=treble, 2=outer, 3=double) and number
  const zoneCode = segmentId % 4;
  const number = Math.ceil((segmentId + 1) / 4); // 1–20
  const sectorIndex = CLOCKWISE_NUMBERS.indexOf(
    number as (typeof CLOCKWISE_NUMBERS)[number],
  );
  const angleDeg = sectorIndex * 18;
  const rad = (angleDeg * Math.PI) / 180;

  const r =
    zoneCode === 1
      ? ZONE_MID.treble
      : zoneCode === 3
        ? ZONE_MID.double
        : zoneCode === 2
          ? ZONE_MID.outerSingle
          : ZONE_MID.innerSingle;

  return { x: r * Math.sin(rad), y: r * Math.cos(rad) };
}

/**
 * Maps an (x, y) board coordinate (mm, origin at bull center) to the SegmentID it lands on.
 * Uses clockwise-from-top angle: θ = atan2(x, y).
 * Ring boundaries follow BDO/WDF spec.
 */
export function coordToSegmentId(x: number, y: number): SegmentID {
  const r = Math.sqrt(x * x + y * y);

  // Bull zones — sector irrelevant inside the bull rings
  if (r <= RING_RADII.innerBull) return SegmentID.DBL_BULL;
  if (r <= RING_RADII.outerBull) return SegmentID.BULL;
  if (r > RING_RADII.double) return SegmentID.MISS;

  // Determine sector: atan2(x, y) gives clockwise angle from top in radians
  const angleDeg = (Math.atan2(x, y) * 180) / Math.PI;
  const normalized = ((angleDeg % 360) + 360) % 360; // [0, 360)
  const sectorIndex = Math.floor((normalized + 9) / 18) % 20;
  const number = CLOCKWISE_NUMBERS[sectorIndex];
  const base = (number - 1) * 4;

  if (r <= RING_RADII.innerSingle) return base as SegmentID; // inner single
  if (r <= RING_RADII.treble) return (base + 1) as SegmentID; // treble
  if (r <= RING_RADII.outerSingle) return (base + 2) as SegmentID; // outer single
  return (base + 3) as SegmentID; // double
}
