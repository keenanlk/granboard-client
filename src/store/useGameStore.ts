import { createGameStore } from "./createGameStore.ts";
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

export const useGameStore = createGameStore(x01Engine, DEFAULT_STATE);
