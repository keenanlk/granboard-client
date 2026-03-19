import { createGameStore } from "./createGameStore.ts";
import { cricketEngine } from "../engine/cricketEngine.ts";
import type { CricketState } from "../engine/cricket.types.ts";

const DEFAULT_STATE: CricketState = {
  options: { singleBull: false, roundLimit: 20, cutThroat: false },
  players: [],
  currentPlayerIndex: 0,
  currentRound: 1,
  currentRoundDarts: [],
  winner: null,
};

export const useCricketStore = createGameStore(cricketEngine, DEFAULT_STATE);
