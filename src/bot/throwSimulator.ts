import { segmentCenter, coordToSegmentId } from "../board/BoardGeometry.ts";
import type { SegmentID } from "../board/Dartboard.ts";

/**
 * Bot skill levels expressed as throw standard deviation (σ) in mm.
 * Lower σ = tighter grouping = more accurate.
 *
 * Calibrated for Granboard soft-tip dimensions (BDO/WDF playing area).
 * PPD measured via `npm run sim` (501, 1000-game average):
 *   Beginner    100mm — casual player, wide scatter                               (~10 PPD)
 *   Intermediate 36mm — regular pub player, lands in the right region              (~16 PPD)
 *   Club         28mm — league/club player, often hits intended number             (~19.5 PPD)
 *   County       24mm — competitive club player                                    (~22.5 PPD)
 *   Advanced     20mm — strong club player, consistent in the right segment        (~26 PPD)
 *   SemiPro    15.5mm — county/semi-pro, reliably hits intended ring               (~33 PPD)
 *   Pro          11mm — elite player, tight grouping                               (~42 PPD)
 */
export const BotSkill = {
  Beginner: 100,
  Intermediate: 36,
  Club: 28,
  County: 24,
  Advanced: 20,
  SemiPro: 15.5,
  Pro: 11,
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
