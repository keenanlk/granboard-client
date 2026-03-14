import { segmentCenter, coordToSegmentId } from "../board/BoardGeometry.ts";
import type { SegmentID } from "../board/Dartboard.ts";

/**
 * Bot skill levels expressed as throw standard deviation (σ) in mm.
 * Lower σ = tighter grouping = more accurate.
 *
 * Values are calibrated against empirical throw dispersion studies:
 *   Beginner     50mm — casual player, large scatter across multiple segments
 *   Intermediate 25mm — regular pub player, usually lands in the right region
 *   Club         20mm — league/club player, often hits intended number          (~18 PPD)
 *   Advanced     12mm — competitive club player, consistent in the right segment (~25 PPD)
 *   SemiPro       9mm — county/semi-pro, reliably hits intended ring             (~27 PPD)
 *   Expert        7mm — strong semi-pro, near-pro precision                      (~32 PPD)
 *   Pro           6mm — elite player, near-perfect precision                     (~38 PPD)
 */
export const BotSkill = {
  Beginner: 50,
  Intermediate: 25,
  Club: 18,
  County: 15,
  Advanced: 12,
  SemiPro: 9,
  Pro: 6,
} as const;
export type BotSkill = (typeof BotSkill)[keyof typeof BotSkill];

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
