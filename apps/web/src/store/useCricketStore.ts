import { createGameStore } from "./createGameStore.ts";
import { cricketEngine } from "@nlc-darts/engine";
import type { CricketState } from "@nlc-darts/engine";

const DEFAULT_STATE: CricketState = {
  options: { singleBull: false, roundLimit: 20, cutThroat: false },
  players: [],
  currentPlayerIndex: 0,
  currentRound: 1,
  currentRoundDarts: [],
  winner: null,
};

export const useCricketStore = createGameStore(cricketEngine, DEFAULT_STATE);
