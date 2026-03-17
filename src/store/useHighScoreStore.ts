import { createGameStore } from "./createGameStore.ts";
import {
  highScoreEngine,
  type HighScoreState,
} from "../engine/highScoreEngine.ts";

// Re-export types so existing imports from this module continue to work.
export type {
  HighScoreOptions,
  HighScoreThrownDart,
  HighScorePlayer,
} from "../engine/highScoreEngine.ts";
export { DEFAULT_HIGHSCORE_OPTIONS } from "../engine/highScoreEngine.ts";

const DEFAULT_STATE: HighScoreState = {
  options: { rounds: 8, tieRule: "stand", splitBull: false },
  players: [],
  currentPlayerIndex: 0,
  currentRound: 1,
  currentRoundDarts: [],
  winners: null,
  inPlayoff: false,
  playoffDarts: [],
};

export const useHighScoreStore = createGameStore(
  highScoreEngine,
  DEFAULT_STATE,
);
