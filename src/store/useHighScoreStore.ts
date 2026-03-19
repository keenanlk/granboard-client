import { createGameStore } from "./createGameStore.ts";
import { highScoreEngine } from "../engine/highScoreEngine.ts";
import type { HighScoreState } from "../engine/highScore.types.ts";

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
