import type { Segment } from "./Dartboard.ts";
import { SegmentSection } from "./Dartboard.ts";

export type AwardType = "hattrick" | "lowton";

/** Determine which award (if any) applies to the 3 thrown darts. */
export function detectAward(darts: { segment: Segment }[]): AwardType | null {
  if (darts.length !== 3) return null;

  const allBulls = darts.every((d) => d.segment.Section === SegmentSection.BULL);
  if (allBulls) return "hattrick";

  const total = darts.reduce((sum, d) => sum + d.segment.Value, 0);
  if (total >= 100 && total < 180) return "lowton";

  return null;
}