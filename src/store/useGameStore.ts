import { create } from "zustand";
import type { Segment } from "../board/Dartboard.ts";
import { x01Engine, type X01State } from "../engine/x01Engine.ts";

// Re-export types so existing imports from this module continue to work.
export type { X01Options, ThrownDart, Player } from "../engine/x01Engine.ts";
export { DEFAULT_X01_OPTIONS } from "../engine/x01Engine.ts";

const DEFAULT_STATE: X01State = {
  x01Options: { startingScore: 501, splitBull: false, doubleOut: false, masterOut: false, doubleIn: false },
  players: [],
  currentPlayerIndex: 0,
  currentRoundDarts: [],
  turnStartScores: [],
  turnStartOpened: [],
  isBust: false,
  winner: null,
};

interface GameActions {
  startGame: (options: X01State["x01Options"], playerNames: string[]) => void;
  addDart: (segment: Segment) => void;
  undoLastDart: () => void;
  nextTurn: () => void;
  resetGame: () => void;
}

export const useGameStore = create<X01State & GameActions>((set) => ({
  ...DEFAULT_STATE,
  startGame: (options, playerNames) => set(x01Engine.startGame(options, playerNames)),
  addDart: (segment) => set((s) => x01Engine.addDart(s, segment)),
  undoLastDart: () => set((s) => x01Engine.undoLastDart(s)),
  nextTurn: () => set((s) => x01Engine.nextTurn(s)),
  resetGame: () => set(DEFAULT_STATE),
}));
