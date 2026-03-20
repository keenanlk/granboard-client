import type { Segment } from "../board/Dartboard.ts";

/** Configuration options for a High Score game. */
export interface HighScoreOptions {
  rounds: number;
  /** If tied at end: "stand" = shared win, "playoff" = one-dart playoff */
  tieRule: "stand" | "playoff";
  /** When false (default), outer bull scores 50 same as double bull. When true, bulls are split (outer = 25, inner = 50). */
  splitBull: boolean;
}

/** Default High Score options: 8 rounds, ties stand, no split bull. */
export const DEFAULT_HIGHSCORE_OPTIONS: HighScoreOptions = {
  rounds: 8,
  tieRule: "stand",
  splitBull: false,
};

/** A single dart thrown during a High Score game. */
export interface HighScoreThrownDart {
  segment: Segment;
  value: number;
}

/** A player's state in a High Score game. */
export interface HighScorePlayer {
  name: string;
  score: number;
  rounds: { score: number; darts: { value: number; shortName: string }[] }[];
}

/** Complete mutable state for a High Score game in progress. */
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
