import { SegmentID } from "../board/Dartboard.ts";

/**
 * ATW targeting strategy: aim at the current target number.
 *
 * For numbers 1-20, aim at the triple ring (best advancement per dart).
 * For bull (25), aim at double bull (inner bull).
 */
export function atwPickTarget(currentTarget: number): SegmentID {
  if (currentTarget === 25) return SegmentID.DBL_BULL;
  // Triple ring for numbers 1-20: SegmentID layout is (n-1)*4 + 1 for TRP_N
  return ((currentTarget - 1) * 4 + 1) as SegmentID;
}
