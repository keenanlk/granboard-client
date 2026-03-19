import { createGameStore } from "./createGameStore.ts";
import { ticTacToeEngine } from "@nlc-darts/engine";
import type { TicTacToeState } from "@nlc-darts/engine";

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
