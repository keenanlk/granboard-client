import { segmentCenter, coordToSegmentId } from "../board/BoardGeometry.ts";
import type { SegmentID } from "../board/Dartboard.ts";

/**
 * Box-Muller transform: converts two uniform [0,1] samples to a standard normal N(0,1) variate.
 * Gives us Gaussian-distributed throw error from Math.random().
 */
function standardNormal(): number {
  // Guard against log(0) — Math.random() can theoretically return 0
  const u1 = Math.max(Math.random(), Number.EPSILON);
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Simulates a single dart throw aimed at `targetId` with `sigma` mm standard deviation.
 *
 * Steps:
 * 1. Look up the physical (x, y) center of the target segment in mm.
 * 2. Add independent Gaussian noise N(0, σ²) to x and y — models hand tremor and release variation.
 * 3. Convert the resulting board coordinate back to a SegmentID.
 *
 * Returns the SegmentID where the dart actually lands (may differ from the target).
 */
export function simulateThrow(targetId: SegmentID, sigma: number): SegmentID {
  const { x, y } = segmentCenter(targetId);
  const actualX = x + standardNormal() * sigma;
  const actualY = y + standardNormal() * sigma;
  return coordToSegmentId(actualX, actualY);
}
