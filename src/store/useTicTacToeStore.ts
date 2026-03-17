import { createGameStore } from "./createGameStore.ts";
import {
  ticTacToeEngine,
  type TicTacToeState,
} from "../engine/ticTacToeEngine.ts";

// Re-export types so consumers import from the store module.
export type {
  TicTacToeOptions,
  TicTacToeThrownDart,
  TicTacToePlayer,
} from "../engine/ticTacToeEngine.ts";
export { DEFAULT_TICTACTOE_OPTIONS } from "../engine/ticTacToeEngine.ts";

const DEFAULT_STATE: TicTacToeState = {
  options: { roundLimit: 20, singleBull: false },
  players: [],
  grid: [],
  owner: Array(9).fill(null) as (0 | 1 | null)[],
  currentPlayerIndex: 0,
  currentRound: 1,
  currentRoundDarts: [],
  winner: null,
  isCatsGame: false,
};

export const useTicTacToeStore = createGameStore(
  ticTacToeEngine,
  DEFAULT_STATE,
);
