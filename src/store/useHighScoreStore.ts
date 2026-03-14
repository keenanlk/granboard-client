import { create } from "zustand";
import type { Segment } from "../board/Dartboard.ts";
import { highScoreEngine, type HighScoreState } from "../engine/highScoreEngine.ts";

// Re-export types so existing imports from this module continue to work.
export type { HighScoreOptions, HighScoreThrownDart, HighScorePlayer } from "../engine/highScoreEngine.ts";
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

interface HighScoreActions {
  startGame: (options: HighScoreState["options"], playerNames: string[]) => void;
  addDart: (segment: Segment) => void;
  undoLastDart: () => void;
  nextTurn: () => void;
  resetGame: () => void;
}

export const useHighScoreStore = create<HighScoreState & HighScoreActions>((set) => ({
  ...DEFAULT_STATE,
  startGame: (options, playerNames) => set(highScoreEngine.startGame(options, playerNames)),
  addDart: (segment) => set((s) => highScoreEngine.addDart(s, segment)),
  undoLastDart: () => set((s) => highScoreEngine.undoLastDart(s)),
  nextTurn: () => set((s) => highScoreEngine.nextTurn(s)),
  resetGame: () => set(DEFAULT_STATE),
}));
