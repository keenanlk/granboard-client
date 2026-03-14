import { SegmentID } from "../board/Dartboard.ts";
import type { X01Options } from "../store/useGameStore.ts";
import { SINGLE_OUT_CHART } from "./x01OutChart.ts";

/*
 * Helper: SegmentID for the double ring of a given number (1–20) or bull (25).
 */
function doubleFor(n: number): SegmentID {
  if (n === 25) return SegmentID.DBL_BULL;
  return ((n - 1) * 4 + 3) as SegmentID;
}

/*
 * Helper: SegmentID for the treble ring of a given number (1–20).
 */
function tripleFor(n: number): SegmentID {
  return ((n - 1) * 4 + 1) as SegmentID;
}

/*
 * Helper: SegmentID for the outer single ring of a given number (1–20).
 */
function outerFor(n: number): SegmentID {
  return ((n - 1) * 4 + 2) as SegmentID;
}

/**
 * X01 targeting strategy: chooses the best SegmentID for a bot to aim at given the current score.
 *
 * Decision rules (evaluated in order):
 * 1. doubleIn + not yet opened → must hit a double first → aim DBL_20.
 * 2. Single out + split bull off → look up the outchart (optimal soft-tip checkout path).
 *    Gaps in the chart (unreachable 3-dart scores like 179) fall back to aiming bull.
 *    Scores ≤ 40 fall through to Rule 6 when not in the chart.
 * 3. score = 50 → aim DBL_BULL (doubleOut/masterOut bull finish).
 * 4. masterOut and score ≤ 60 and score divisible by 3 → aim TRP_(score/3).
 * 5. doubleOut or masterOut, score ≤ 40 and even → aim DBL_(score/2).
 * 6. doubleOut or masterOut, score ≤ 40 and odd → aim OUTER_1 (leaves even finish).
 * 7. Standard out endgame for small scores (split bull on, or chart miss ≤ 40).
 * 8. Default: aim bull when split bull off (larger combined target), T20 when on.
 */
export function x01PickTarget(
  score: number,
  opts: X01Options,
  opened: boolean,
): SegmentID {
  // Rule 1: double-in gate
  if (opts.doubleIn && !opened) return doubleFor(20);

  // Rule 2: outchart — standard out with split bull off
  if (!opts.doubleOut && !opts.masterOut && !opts.splitBull) {
    const target = SINGLE_OUT_CHART[score];
    if (target !== undefined) return target;
    // Score not in chart (gap like 179, or > 180): aim bull by default
    if (score > 40) return SegmentID.DBL_BULL;
    // Scores ≤ 40 not in chart fall through to Rule 7
  }

  // Rule 3: bull finish (doubleOut/masterOut modes)
  if (score === 50) return SegmentID.DBL_BULL;

  // Rule 4: masterOut triple finish (e.g. score=60 → T20, score=57 → T19)
  if (opts.masterOut && score <= 60 && score % 3 === 0) {
    const n = score / 3;
    if (n >= 1 && n <= 20) return tripleFor(n);
  }

  // Rule 5: double finish (e.g. score=40 → D20, score=32 → D16)
  if ((opts.doubleOut || opts.masterOut) && score <= 40 && score % 2 === 0) {
    return doubleFor(score / 2);
  }

  // Rule 6: reduce odd score to even (single 1 leaves score-1 which is even)
  if ((opts.doubleOut || opts.masterOut) && score <= 40 && score % 2 === 1) {
    return outerFor(1);
  }

  // Rule 7: standard out endgame for small scores (split bull on path, or chart miss ≤ 40)
  if (!opts.doubleOut && !opts.masterOut) {
    if (score <= 20) return outerFor(score);
    if (score <= 40 && score % 2 === 0) return doubleFor(score / 2);
    if (score <= 40) return outerFor(1);
  }

  // Rule 8: default — aim bull when split bull off (both zones = 50, bigger combined target),
  // T20 when split bull on (outer bull = 25 only, T20 = 60 is better).
  return opts.splitBull ? SegmentID.TRP_20 : SegmentID.DBL_BULL;
}
