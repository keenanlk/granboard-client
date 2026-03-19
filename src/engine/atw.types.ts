import type { Segment } from "../board/Dartboard.ts";

/** The fixed sequence: numbers 1-20 then Bull (25). */
export const ATW_SEQUENCE = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25,
] as const;

export const BULL_INDEX = 20; // index of Bull in ATW_SEQUENCE
export const FINISHED_INDEX = 21; // sentinel: player has finished

export interface ATWOptions {
  /** Maximum rounds. 0 = unlimited. Default: 0. */
  roundLimit: number;
}

export const DEFAULT_ATW_OPTIONS: ATWOptions = {
  roundLimit: 0,
};

export interface ATWThrownDart {
  segment: Segment;
  /** true if the dart hit the current target */
  hit: boolean;
  /** Number of positions advanced (0 if miss) */
  advanced: number;
  /** targetIndex before this dart was thrown (for undo) */
  previousTargetIndex: number;
}

export interface ATWRound {
  darts: { shortName: string; hit: boolean }[];
  startTargetIndex: number;
  endTargetIndex: number;
}

export interface ATWPlayer {
  name: string;
  /** 0-20 = in progress, 21 = finished */
  targetIndex: number;
  /** The current target number (1-20 or 25 for Bull) */
  currentTarget: number;
  finished: boolean;
  /** The round in which this player finished (null if not finished) */
  finishedInRound: number | null;
  rounds: ATWRound[];
  totalDartsThrown: number;
}

export interface ATWState {
  options: ATWOptions;
  players: ATWPlayer[];
  currentPlayerIndex: number;
  currentRound: number; // 1-based
  currentRoundDarts: ATWThrownDart[];
  /** null = game ongoing, string[] = winner name(s) */
  winners: string[] | null;
  /** The round in which the first player finished */
  firstFinishRound: number | null;
}
