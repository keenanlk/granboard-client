import { create } from "zustand";
import type { Segment } from "../board/Dartboard.ts";
import { cricketEngine, type CricketState } from "../engine/cricketEngine.ts";

// Re-export types so existing imports from this module continue to work.
export type { CricketOptions, CricketThrownDart, CricketPlayer, CricketTarget } from "../engine/cricketEngine.ts";
export { CRICKET_TARGETS, DEFAULT_CRICKET_OPTIONS, emptyMarks } from "../engine/cricketEngine.ts";

const DEFAULT_STATE: CricketState = {
  options: { singleBull: false },
  players: [],
  currentPlayerIndex: 0,
  currentRoundDarts: [],
  winner: null,
};

interface CricketActions {
  startGame: (options: CricketState["options"], playerNames: string[]) => void;
  addDart: (segment: Segment) => void;
  undoLastDart: () => void;
  nextTurn: () => void;
  resetGame: () => void;
}

export const useCricketStore = create<CricketState & CricketActions>((set) => ({
  ...DEFAULT_STATE,
  startGame: (options, playerNames) => set(cricketEngine.startGame(options, playerNames)),
  addDart: (segment) => set((s) => cricketEngine.addDart(s, segment)),
  undoLastDart: () => set((s) => cricketEngine.undoLastDart(s)),
  nextTurn: () => set((s) => cricketEngine.nextTurn(s)),
  resetGame: () => set(DEFAULT_STATE),
}));
