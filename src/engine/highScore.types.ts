import type { Segment } from "../board/Dartboard.ts";

export interface HighScoreOptions {
  rounds: number;
  /** If tied at end: "stand" = shared win, "playoff" = one-dart playoff */
  tieRule: "stand" | "playoff";
  /** When false (default), outer bull scores 50 same as double bull. When true, bulls are split (outer = 25, inner = 50). */
  splitBull: boolean;
}

export const DEFAULT_HIGHSCORE_OPTIONS: HighScoreOptions = {
  rounds: 8,
  tieRule: "stand",
  splitBull: false,
};

export interface HighScoreThrownDart {
  segment: Segment;
  value: number;
}

export interface HighScorePlayer {
  name: string;
  score: number;
  rounds: { score: number; darts: { value: number; shortName: string }[] }[];
}

export interface HighScoreState {
  options: HighScoreOptions;
  players: HighScorePlayer[];
  currentPlayerIndex: number;
  currentRound: number; // 1-based
  currentRoundDarts: HighScoreThrownDart[];
  /** null = game ongoing, string[] = winner name(s) */
  winners: string[] | null;
  /** true when tied players are throwing 1-dart playoff */
  inPlayoff: boolean;
  playoffDarts: { playerIndex: number; value: number }[];
}
