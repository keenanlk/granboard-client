import type { Segment } from "../board/Dartboard.ts";

export const CRICKET_TARGETS = [20, 19, 18, 17, 16, 15, 25] as const;
export type CricketTarget = (typeof CRICKET_TARGETS)[number];

export interface CricketOptions {
  /** Both outer and inner bull count as 1 mark. Default: false (outer=1, inner=2). */
  singleBull: boolean;
  /** Maximum rounds per player. 0 = unlimited. Default: 20. */
  roundLimit: number;
  /** Cut-throat mode: points go to opponents, lowest score wins. Default: false. */
  cutThroat: boolean;
}

export const DEFAULT_CRICKET_OPTIONS: CricketOptions = {
  singleBull: false,
  roundLimit: 20,
  cutThroat: false,
};

export interface CricketThrownDart {
  segment: Segment;
  target: CricketTarget | null; // null = not a valid cricket target
  marksAdded: number; // marks added toward closing (≤3 cap); used for undo
  marksEarned: number; // raw physical marks from the dart (1/2/3); used for animation
  effectiveMarks: number; // marks that counted: closing marks + scoring extras; used for totalMarksEarned / undo
  pointsScored: number;
  /** Cut-throat only: which opponents received points (for undo). */
  pointsDistributed?: { playerIndex: number; points: number }[];
}

export interface CricketRound {
  score: number;
  marksEarned: number;
  darts: { value: number; shortName: string }[];
}

export interface CricketPlayer {
  name: string;
  marks: Record<CricketTarget, number>; // 0–3, capped
  score: number;
  totalDartsThrown: number;
  totalMarksEarned: number;
  rounds: CricketRound[];
}

export interface CricketState {
  options: CricketOptions;
  players: CricketPlayer[];
  currentPlayerIndex: number;
  currentRound: number; // 1-based
  currentRoundDarts: CricketThrownDart[];
  winner: string | null;
}

export function emptyMarks(): Record<CricketTarget, number> {
  return { 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 };
}
