import { SegmentID } from "../board/Dartboard.ts";

/**
 * High Score targeting strategy: aim for the highest expected-value segment.
 *
 * When splitBull is OFF both bull zones score 50, making the combined bull area
 * a larger target than the triple-20 ring — so aiming bull has better expected
 * value on soft-tip boards.  When splitBull is ON the outer bull only scores 25,
 * making TRP_20 (60 pts) the better default.
 */
export function highScorePickTarget(splitBull: boolean): SegmentID {
  return splitBull ? SegmentID.TRP_20 : SegmentID.DBL_BULL;
}
