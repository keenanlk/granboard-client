import type { Segment } from "../board/Dartboard.ts";
import { SegmentID, SegmentSection, SegmentType } from "../board/Dartboard.ts";
import type { CricketThrownDart } from "../store/useCricketStore.ts";

export type X01AwardType = "hattrick" | "ton80" | "highton" | "lowton";
export type CricketAwardType = "hattrick" | "threeinbed" | "threeinblack" | "whitehorse";
export type AwardType = X01AwardType | CricketAwardType;

const CRICKET_NUMBER_SECTIONS = new Set([15, 16, 17, 18, 19, 20]);

/** X01 + HighScore: detect award based on segment values and total score. */
export function detectX01Award(darts: { segment: Segment }[]): X01AwardType | null {
  if (darts.length !== 3) return null;

  if (darts.every((d) => d.segment.Section === SegmentSection.BULL)) return "hattrick";

  const total = darts.reduce((sum, d) => sum + d.segment.Value, 0);
  if (total === 180) return "ton80";
  if (total >= 140) return "highton";
  if (total >= 100) return "lowton";

  return null;
}

/** Cricket: detect award based on cricket dart results. */
export function detectCricketAward(darts: CricketThrownDart[]): CricketAwardType | null {
  if (darts.length !== 3) return null;

  // Three in black: all 3 darts are double bullseyes (takes precedence over hattrick)
  if (darts.every((d) => d.segment.ID === SegmentID.DBL_BULL)) return "threeinblack";

  // Hat trick: 3 bulls (any combination of inner/outer)
  if (darts.every((d) => d.segment.Section === SegmentSection.BULL)) return "hattrick";

  // Three in a bed: all 3 darts in the same cricket number AND same ring (e.g. triple 20 x3)
  const allSameBed =
    darts.every((d) => d.segment.Section === darts[0].segment.Section) &&
    darts.every((d) => d.segment.Type === darts[0].segment.Type) &&
    darts.every((d) => CRICKET_NUMBER_SECTIONS.has(d.segment.Section));
  if (allSameBed) return "threeinbed";

  // White horse: 3 triples each on a different, previously untouched (virgin) cricket number
  // marksAdded === 3 means the number had 0 marks before (triple closed it from scratch)
  const [d0, d1, d2] = darts;
  const allVirginTriples =
    d0.segment.Type === SegmentType.Triple &&
    d1.segment.Type === SegmentType.Triple &&
    d2.segment.Type === SegmentType.Triple &&
    d0.marksAdded === 3 &&
    d1.marksAdded === 3 &&
    d2.marksAdded === 3 &&
    d0.target !== null && d1.target !== null && d2.target !== null &&
    d0.target !== d1.target && d1.target !== d2.target && d0.target !== d2.target;
  if (allVirginTriples) return "whitehorse";

  return null;
}

// Alias used by X01 and HighScore screens
export function detectAward(darts: { segment: Segment }[]): X01AwardType | null {
  return detectX01Award(darts);
}
