import { createGameStore } from "./createGameStore.ts";
import { highScoreEngine } from "@nlc-darts/engine";
import type { HighScoreState } from "@nlc-darts/engine";

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
