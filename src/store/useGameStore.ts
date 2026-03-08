import { create } from "zustand";
import { CreateSegment, SegmentID, type Segment } from "../lib/Dartboard.ts";

export interface X01Options {
  startingScore: 301 | 501;
  /** Entire bull zone scores 50 — outer bull treated as double bull. Default: true. */
  bullsNotSplit: boolean;
}

export const DEFAULT_X01_OPTIONS: X01Options = {
  startingScore: 501,
  bullsNotSplit: true,
};

interface Player {
  name: string;
  score: number;
}

interface GameState {
  x01Options: X01Options;
  players: Player[];
  currentPlayerIndex: number;
  currentRoundDarts: Segment[];

  startGame: (options: X01Options, playerNames: string[]) => void;
  addDart: (segment: Segment) => void;
  undoLastDart: () => void;
  nextTurn: () => void;
  resetGame: () => void;
}

const DEFAULT_STATE = {
  x01Options: DEFAULT_X01_OPTIONS,
  players: [],
  currentPlayerIndex: 0,
  currentRoundDarts: [],
};

export const useGameStore = create<GameState>((set) => ({
  ...DEFAULT_STATE,

  startGame: (options, playerNames) =>
    set({
      x01Options: options,
      players: playerNames.map((name) => ({
        name,
        score: options.startingScore,
      })),
      currentPlayerIndex: 0,
      currentRoundDarts: [],
    }),

  addDart: (segment) =>
    set((state) => {
      if (state.currentRoundDarts.length >= 3) return state;

      // Bulls not split: entire bull zone scores 50 — treat outer bull as double bull
      const effective =
        state.x01Options.bullsNotSplit && segment.ID === SegmentID.BULL
          ? CreateSegment(SegmentID.DBL_BULL)
          : segment;

      const newPlayers = state.players.map((p, i) => {
        if (i !== state.currentPlayerIndex) return p;
        const newScore = p.score - effective.Value;
        return { ...p, score: newScore < 0 ? p.score : newScore };
      });

      return {
        currentRoundDarts: [...state.currentRoundDarts, effective],
        players: newPlayers,
      };
    }),

  undoLastDart: () =>
    set((state) => {
      if (state.currentRoundDarts.length === 0) return state;
      const removed =
        state.currentRoundDarts[state.currentRoundDarts.length - 1];
      const newPlayers = state.players.map((p, i) => {
        if (i !== state.currentPlayerIndex) return p;
        return { ...p, score: p.score + removed.Value };
      });
      return {
        currentRoundDarts: state.currentRoundDarts.slice(0, -1),
        players: newPlayers,
      };
    }),

  nextTurn: () =>
    set((state) => ({
      currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
      currentRoundDarts: [],
    })),

  resetGame: () => set(DEFAULT_STATE),
}));
