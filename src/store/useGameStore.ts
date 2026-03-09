import { create } from "zustand";
import { CreateSegment, SegmentID, SegmentSection, SegmentType, type Segment } from "../lib/Dartboard.ts";

export interface X01Options {
  startingScore: 301 | 501 | 701;
  /** Entire bull zone scores 50 — outer bull treated as double bull. Default: true. */
  bullsNotSplit: boolean;
  /** Final dart must be a double (or bull) to win. Default: false. */
  doubleOut: boolean;
  /** Must hit a double (or bull) before scoring begins. Default: false. */
  doubleIn: boolean;
}

export const DEFAULT_X01_OPTIONS: X01Options = {
  startingScore: 501,
  bullsNotSplit: true,
  doubleOut: false,
  doubleIn: false,
};

export interface ThrownDart {
  segment: Segment;
  /** False for double-in pre-open throws or bust darts — entire turn was canceled. */
  scored: boolean;
}

export interface Player {
  name: string;
  score: number;
  /** For double-in: whether the player has opened by hitting a double. Always true if doubleIn=false. */
  opened: boolean;
  /** Total darts thrown this game (all darts, including busts and double-in misses). */
  totalDartsThrown: number;
}

interface GameState {
  x01Options: X01Options;
  players: Player[];
  currentPlayerIndex: number;
  currentRoundDarts: ThrownDart[];
  /** Score of each player at the start of the current turn — used to reset on bust. */
  turnStartScores: number[];
  /** Opened state of each player at the start of the current turn — used for undo. */
  turnStartOpened: boolean[];
  isBust: boolean;
  winner: string | null;

  startGame: (options: X01Options, playerNames: string[]) => void;
  addDart: (segment: Segment) => void;
  undoLastDart: () => void;
  nextTurn: () => void;
  resetGame: () => void;
}

const DEFAULT_STATE = {
  x01Options: DEFAULT_X01_OPTIONS,
  players: [] as Player[],
  currentPlayerIndex: 0,
  currentRoundDarts: [] as ThrownDart[],
  turnStartScores: [] as number[],
  turnStartOpened: [] as boolean[],
  isBust: false,
  winner: null as string | null,
};

export const useGameStore = create<GameState>((set) => ({
  ...DEFAULT_STATE,

  startGame: (options, playerNames) => {
    const allOpened = playerNames.map(() => !options.doubleIn);
    set({
      x01Options: options,
      players: playerNames.map((name) => ({
        name,
        score: options.startingScore,
        opened: !options.doubleIn,
        totalDartsThrown: 0,
      })),
      currentPlayerIndex: 0,
      currentRoundDarts: [],
      turnStartScores: playerNames.map(() => options.startingScore),
      turnStartOpened: allOpened,
      isBust: false,
      winner: null,
    });
  },

  addDart: (segment) =>
    set((state) => {
      // Don't add darts if game over, bust, or 3 already thrown
      if (state.winner || state.isBust || state.currentRoundDarts.length >= 3) return state;

      const player = state.players[state.currentPlayerIndex];

      // Apply bullsNotSplit: outer bull (25) → double bull (50)
      const effective =
        state.x01Options.bullsNotSplit && segment.ID === SegmentID.BULL
          ? CreateSegment(SegmentID.DBL_BULL)
          : segment;

      // Per docs: bull (50) counts as a double for double-in/double-out purposes
      const isDoubleOrBull =
        effective.Type === SegmentType.Double ||
        effective.Section === SegmentSection.BULL;

      // Double-in: must hit a double before scoring begins
      if (state.x01Options.doubleIn && !player.opened) {
        if (!isDoubleOrBull) {
          // Dart thrown but scores 0 — player not yet opened
          return {
            currentRoundDarts: [
              ...state.currentRoundDarts,
              { segment: effective, scored: false },
            ],
            players: state.players.map((p, i) =>
              i === state.currentPlayerIndex
                ? { ...p, totalDartsThrown: p.totalDartsThrown + 1 }
                : p,
            ),
          };
        }
        // Opening double — fall through to score it normally
      }

      const newScore = player.score - effective.Value;

      // Bust conditions per docs:
      // - goes below 0
      // - reaches exactly 1
      // - double-out: reaches 0 without a double/bull
      const isBust =
        newScore < 0 ||
        newScore === 1 ||
        (newScore === 0 && state.x01Options.doubleOut && !isDoubleOrBull);

      if (isBust) {
        // Entire turn canceled — reset to turn-start score and opened state
        const newPlayers = state.players.map((p, i) =>
          i === state.currentPlayerIndex
            ? { ...p, score: state.turnStartScores[i], opened: state.turnStartOpened[i], totalDartsThrown: p.totalDartsThrown + 1 }
            : p,
        );
        return {
          currentRoundDarts: [
            ...state.currentRoundDarts,
            { segment: effective, scored: false },
          ],
          players: newPlayers,
          isBust: true,
        };
      }

      // Valid dart — update score and mark player as opened
      const newPlayers = state.players.map((p, i) => {
        if (i !== state.currentPlayerIndex) return p;
        return { ...p, score: newScore, opened: true, totalDartsThrown: p.totalDartsThrown + 1 };
      });

      const winner = newScore === 0 ? player.name : null;

      return {
        currentRoundDarts: [
          ...state.currentRoundDarts,
          { segment: effective, scored: true },
        ],
        players: newPlayers,
        winner,
      };
    }),

  undoLastDart: () =>
    set((state) => {
      if (state.currentRoundDarts.length === 0) return state;

      const newRoundDarts = state.currentRoundDarts.slice(0, -1);

      // Recalculate score from turn-start minus all remaining scored darts
      const scoredTotal = newRoundDarts
        .filter((d) => d.scored)
        .reduce((sum, d) => sum + d.segment.Value, 0);
      const hasAnyScored = newRoundDarts.some((d) => d.scored);

      const newPlayers = state.players.map((p, i) => {
        if (i !== state.currentPlayerIndex) return p;
        return {
          ...p,
          score: state.turnStartScores[i] - scoredTotal,
          opened: state.turnStartOpened[i] || hasAnyScored,
          totalDartsThrown: Math.max(0, p.totalDartsThrown - 1),
        };
      });

      return {
        currentRoundDarts: newRoundDarts,
        players: newPlayers,
        isBust: false,
        winner: null,
      };
    }),

  nextTurn: () =>
    set((state) => {
      if (state.winner) return state;
      const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
      return {
        currentPlayerIndex: nextIndex,
        currentRoundDarts: [],
        turnStartScores: state.players.map((p) => p.score),
        turnStartOpened: state.players.map((p) => p.opened),
        isBust: false,
      };
    }),

  resetGame: () => set(DEFAULT_STATE),
}));
