import { create } from "zustand";
import type { Segment } from "../board/Dartboard.ts";

export interface HighScoreOptions {
  rounds: number;
  /** If tied at end: "stand" = shared win, "playoff" = one-dart playoff */
  tieRule: "stand" | "playoff";
  /** When false (default), outer bull scores 50 same as double bull. When true, bulls are split (outer = 25, inner = 50). */
  splitBull: boolean;
}

export const DEFAULT_HIGHSCORE_OPTIONS: HighScoreOptions = {
  rounds: 8,
  tieRule: "stand",
  splitBull: false,
};

export interface HighScoreThrownDart {
  segment: Segment;
  value: number;
}

export interface HighScorePlayer {
  name: string;
  score: number;
  rounds: { score: number; darts: { value: number; shortName: string }[] }[];
}

interface HighScoreState {
  options: HighScoreOptions;
  players: HighScorePlayer[];
  currentPlayerIndex: number;
  currentRound: number; // 1-based
  currentRoundDarts: HighScoreThrownDart[];
  /** null = game ongoing, string[] = winner name(s) */
  winners: string[] | null;
  /** true when tied players are throwing 1-dart playoff */
  inPlayoff: boolean;
  playoffDarts: { playerIndex: number; value: number }[];

  startGame: (options: HighScoreOptions, playerNames: string[]) => void;
  addDart: (segment: Segment) => void;
  undoLastDart: () => void;
  nextTurn: () => void;
  resetGame: () => void;
}

const DEFAULT_STATE = {
  options: DEFAULT_HIGHSCORE_OPTIONS,
  players: [] as HighScorePlayer[],
  currentPlayerIndex: 0,
  currentRound: 1,
  currentRoundDarts: [] as HighScoreThrownDart[],
  winners: null as string[] | null,
  inPlayoff: false,
  playoffDarts: [] as { playerIndex: number; value: number }[],
};

/*
 * Rule: splitBull for high score
 * When splitBull is OFF — outer bull and inner bull both score 50.
 * When splitBull is ON  — outer bull = 25, inner bull = 50 (face values are used as-is).
 */
function normalizeSegmentValue(segment: Segment, splitBull: boolean): number {
  return !splitBull && segment.Value === 25 ? 50 : segment.Value;
}

/*
 * Rule: determining winners at game end
 * - Find the highest score among all players.
 * - Any player with that exact score is a winner (ties are allowed).
 */
function determineWinners(players: HighScorePlayer[]): string[] {
  const maxScore = Math.max(...players.map((p) => p.score));
  return players.filter((p) => p.score === maxScore).map((p) => p.name);
}

export const useHighScoreStore = create<HighScoreState>((set) => ({
  ...DEFAULT_STATE,

  startGame: (options, playerNames) =>
    set({
      options,
      players: playerNames.map((name) => ({
        name,
        score: 0,
        rounds: [],
      })),
      currentPlayerIndex: 0,
      currentRound: 1,
      currentRoundDarts: [],
      winners: null,
      inPlayoff: false,
      playoffDarts: [],
    }),

  addDart: (segment) =>
    set((state) => {
      if (state.winners || state.currentRoundDarts.length >= 3) return state;

      const value = normalizeSegmentValue(segment, state.options.splitBull);
      return {
        currentRoundDarts: [...state.currentRoundDarts, { segment, value }],
      };
    }),

  undoLastDart: () =>
    set((state) => {
      if (state.currentRoundDarts.length === 0) return state;
      return {
        currentRoundDarts: state.currentRoundDarts.slice(0, -1),
      };
    }),

  nextTurn: () =>
    set((state) => {
      if (state.winners) return state;

      const roundTotal = state.currentRoundDarts.reduce(
        (sum, d) => sum + d.value,
        0,
      );

      // Commit round score to current player
      const updatedPlayers = state.players.map((p, i) => {
        if (i !== state.currentPlayerIndex) return p;
        return {
          ...p,
          score: p.score + roundTotal,
          rounds: [...p.rounds, {
            score: roundTotal,
            darts: state.currentRoundDarts.map((d) => ({ value: d.value, shortName: d.segment.ShortName })),
          }],
        };
      });

      const isLastPlayer =
        state.currentPlayerIndex === state.players.length - 1;
      const isLastRound = state.currentRound === state.options.rounds;

      // Move to next player or next round
      const nextPlayerIndex = isLastPlayer
        ? 0
        : state.currentPlayerIndex + 1;
      const nextRound = isLastPlayer
        ? state.currentRound + 1
        : state.currentRound;

      // Check if game just ended
      if (isLastPlayer && isLastRound) {
        const topNames = determineWinners(updatedPlayers);
        const tied = topNames.length > 1;

        if (!tied || state.options.tieRule === "stand") {
          return {
            players: updatedPlayers,
            currentRoundDarts: [],
            winners: topNames,
          };
        }

        // Playoff mode — find player indices of tied players
        return {
          players: updatedPlayers,
          currentRoundDarts: [],
          inPlayoff: true,
          playoffDarts: [],
          // Set currentPlayerIndex to first tied player
          currentPlayerIndex: updatedPlayers.findIndex((p) =>
            topNames.includes(p.name),
          ),
        };
      }

      return {
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        currentRound: nextRound,
        currentRoundDarts: [],
      };
    }),

  resetGame: () => set(DEFAULT_STATE),
}));
