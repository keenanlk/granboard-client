import { createGameStore } from "./createGameStore.ts";
import { cricketEngine, type CricketState } from "../engine/cricketEngine.ts";

// Re-export types so existing imports from this module continue to work.
export type {
  CricketOptions,
  CricketThrownDart,
  CricketPlayer,
  CricketTarget,
} from "../engine/cricketEngine.ts";
export {
  CRICKET_TARGETS,
  DEFAULT_CRICKET_OPTIONS,
  emptyMarks,
} from "../engine/cricketEngine.ts";

const DEFAULT_STATE: CricketState = {
  options: { singleBull: false, roundLimit: 20, cutThroat: false },
  players: [],
  currentPlayerIndex: 0,
  currentRound: 1,
  currentRoundDarts: [],
  winner: null,
};

export const useCricketStore = createGameStore(cricketEngine, DEFAULT_STATE);
