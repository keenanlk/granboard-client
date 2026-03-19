import { createGameStore } from "./createGameStore.ts";
import { atwEngine } from "../engine/atwEngine.ts";
import type { ATWState } from "../engine/atw.types.ts";

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
