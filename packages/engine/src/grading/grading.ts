/**
 * Player grading system for NLC Darts.
 * Pure functions — no external dependencies.
 */

export const GRADES = ["A+", "A", "B+", "B", "C+", "C", "D"] as const;
export type Grade = (typeof GRADES)[number];

/** Minimum completed games before a grade is displayed. */
export const MIN_GAMES_FOR_GRADE = 5;

/** Number of most-recent games used for the rolling average. */
export const ROLLING_WINDOW = 20;

// ── X01 thresholds (Points Per Dart) ────────────────────────────
const X01_THRESHOLDS: readonly [number, Grade][] = [
  [30, "A+"],
  [25, "A"],
  [20, "B+"],
  [15, "B"],
  [12, "C+"],
  [8, "C"],
] as const;

// ── Cricket thresholds (Marks Per Round) ────────────────────────
const CRICKET_THRESHOLDS: readonly [number, Grade][] = [
  [3.5, "A+"],
  [3.0, "A"],
  [2.5, "B+"],
  [2.0, "B"],
  [1.5, "C+"],
  [1.0, "C"],
] as const;

/** Compute an X01 grade from a Points-Per-Dart average. */
export function computeX01Grade(ppd: number): Grade {
  for (const [threshold, grade] of X01_THRESHOLDS) {
    if (ppd >= threshold) return grade;
  }
  return "D";
}

/** Compute a Cricket grade from a Marks-Per-Round average. */
export function computeCricketGrade(mpr: number): Grade {
  for (const [threshold, grade] of CRICKET_THRESHOLDS) {
    if (mpr >= threshold) return grade;
  }
  return "D";
}
