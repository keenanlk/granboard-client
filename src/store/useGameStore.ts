import { createGameStore } from "./createGameStore.ts";
import { x01Engine } from "../engine/x01Engine.ts";
import type { X01State } from "../engine/x01.types.ts";

const DEFAULT_STATE: X01State = {
  x01Options: {
    startingScore: 501,
    splitBull: false,
    doubleOut: false,
    masterOut: false,
    doubleIn: false,
  },
  players: [],
  currentPlayerIndex: 0,
  currentRoundDarts: [],
  turnStartScores: [],
  turnStartOpened: [],
  isBust: false,
  winner: null,
};

export const useGameStore = createGameStore(x01Engine, DEFAULT_STATE);
