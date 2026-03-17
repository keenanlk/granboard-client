import { createGameStore } from "./createGameStore.ts";
import { atwEngine, type ATWState } from "../engine/atwEngine.ts";

export type {
  ATWOptions,
  ATWThrownDart,
  ATWPlayer,
  ATWRound,
} from "../engine/atwEngine.ts";
export { ATW_SEQUENCE, DEFAULT_ATW_OPTIONS } from "../engine/atwEngine.ts";

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
