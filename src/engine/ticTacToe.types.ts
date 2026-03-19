import type { Segment } from "../board/Dartboard.ts";

export interface TicTacToeOptions {
  roundLimit: number; // 0 = unlimited
  singleBull: boolean; // true = both bull zones = 1 mark; false = outer=1, inner=2
}

export const DEFAULT_TICTACTOE_OPTIONS: TicTacToeOptions = {
  roundLimit: 20,
  singleBull: false,
};

export interface TicTacToeThrownDart {
  segment: Segment;
  gridIndex: number | null; // which grid cell was targeted (null = off-grid)
  marksAdded: number; // marks actually applied (capped)
  claimed: boolean; // did this dart claim the square?
}

export interface TicTacToePlayer {
  name: string;
  marks: number[]; // 9 entries, 0–4 per grid cell
  claimed: number[]; // grid indices this player owns
  rounds: {
    darts: { shortName: string; marksAdded: number; value: number }[];
  }[];
}

export interface TicTacToeState {
  options: TicTacToeOptions;
  players: TicTacToePlayer[];
  grid: number[]; // 9 numbers — grid[4] is always 25 (bull)
  owner: (0 | 1 | null)[]; // who owns each cell (player index or null)
  currentPlayerIndex: number;
  currentRound: number; // 1-based
  currentRoundDarts: TicTacToeThrownDart[];
  winner: string | null;
  isCatsGame: boolean;
}
