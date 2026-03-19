import { createGameStore } from "./createGameStore.ts";
import { atwEngine } from "@nlc-darts/engine";
import type { ATWState } from "@nlc-darts/engine";

const DEFAULT_STATE: ATWState = {
  options: { roundLimit: 0 },
  players: [],
  currentPlayerIndex: 0,
  currentRound: 1,
  currentRoundDarts: [],
  winners: null,
  firstFinishRound: null,
};

export const useATWStore = createGameStore(atwEngine, DEFAULT_STATE);
