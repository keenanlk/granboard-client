import type { Segment } from "../board/Dartboard.ts";

/** Configuration options for an X01 game (301, 501, 701). */
export interface X01Options {
  startingScore: 301 | 501 | 701;
  /** When false (default), outer bull scores 50 same as double bull. When true, bulls are split (outer = 25, inner = 50). */
  splitBull: boolean;
  /** Final dart must be a double (or bull) to win. Default: false. */
  doubleOut: boolean;
  /** Final dart must be a double, triple, or bull to win. Default: false. */
  masterOut: boolean;
  /** Must hit a double (or bull) before scoring begins. Default: false. */
  doubleIn: boolean;
}

/** Default X01 options: 501, no split bull, no double/master out, no double in. */
export const DEFAULT_X01_OPTIONS: X01Options = {
  startingScore: 501,
  splitBull: false,
  doubleOut: false,
  masterOut: false,
  doubleIn: false,
};

/** A single dart thrown during an X01 game. */
export interface ThrownDart {
  segment: Segment;
  /** False for double-in pre-open throws or bust darts — entire turn was canceled. */
  scored: boolean;
}

/** A player's state in an X01 game. */
export interface Player {
  name: string;
  score: number;
  /** For double-in: whether the player has opened by hitting a double. Always true if doubleIn=false. */
  opened: boolean;
  rounds: {
    score: number;
    darts: { value: number; shortName: string; scored: boolean }[];
    /** Player's opened state at the START of this round — used to restore on cross-turn undo. */
    openedBefore: boolean;
  }[];
  /** Total darts thrown this game (all darts, including busts and double-in misses). */
  totalDartsThrown: number;
}

/** Complete mutable state for an X01 game in progress. */
export interface X01State {
  x01Options: X01Options;
  players: Player[];
  currentPlayerIndex: number;
  currentRoundDarts: ThrownDart[];
  /** Score of each player at the start of the current turn — used to reset on bust. */
  turnStartScores: number[];
  /** Opened state of each player at the start of the current turn — used for undo. */
  turnStartOpened: boolean[];
  isBust: boolean;
  winner: string | null;
}
