import { create } from "zustand";
import { SegmentID, SegmentSection, SegmentType, type Segment } from "../lib/Dartboard.ts";

export const CRICKET_TARGETS = [20, 19, 18, 17, 16, 15, 25] as const;
export type CricketTarget = (typeof CRICKET_TARGETS)[number];

export interface CricketOptions {
  /** Both outer and inner bull count as 1 mark. Default: false (outer=1, inner=2). */
  singleBull: boolean;
}

export const DEFAULT_CRICKET_OPTIONS: CricketOptions = {
  singleBull: false,
};

export interface CricketThrownDart {
  segment: Segment;
  target: CricketTarget | null; // null = not a valid cricket target
  marksAdded: number;           // marks added toward closing (≤3 cap); used for undo
  marksEarned: number;          // total marks from the dart; used to undo totalMarksEarned
  pointsScored: number;
}

export interface CricketPlayer {
  name: string;
  marks: Record<CricketTarget, number>; // 0–3, capped
  score: number;
  totalDartsThrown: number;
  totalMarksEarned: number;
}

interface CricketState {
  options: CricketOptions;
  players: CricketPlayer[];
  currentPlayerIndex: number;
  currentRoundDarts: CricketThrownDart[];
  winner: string | null;

  startGame: (options: CricketOptions, playerNames: string[]) => void;
  addDart: (segment: Segment) => void;
  undoLastDart: () => void;
  nextTurn: () => void;
  resetGame: () => void;
}

function emptyMarks(): Record<CricketTarget, number> {
  return { 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 };
}

const DEFAULT_STATE = {
  options: DEFAULT_CRICKET_OPTIONS,
  players: [] as CricketPlayer[],
  currentPlayerIndex: 0,
  currentRoundDarts: [] as CricketThrownDart[],
  winner: null as string | null,
};

export const useCricketStore = create<CricketState>((set) => ({
  ...DEFAULT_STATE,

  startGame: (options, playerNames) =>
    set({
      options,
      players: playerNames.map((name) => ({
        name,
        marks: emptyMarks(),
        score: 0,
        totalDartsThrown: 0,
        totalMarksEarned: 0,
      })),
      currentPlayerIndex: 0,
      currentRoundDarts: [],
      winner: null,
    }),

  addDart: (segment) =>
    set((state) => {
      if (state.winner || state.currentRoundDarts.length >= 3) return state;

      const player = state.players[state.currentPlayerIndex];
      const section = segment.Section;

      // Determine target and marks earned
      let target: CricketTarget | null = null;
      let marksEarned = 0;

      if (section === SegmentSection.BULL) {
        target = 25;
        // Outer bull always 1 mark; inner bull: 2 marks standard, 1 if singleBull
        marksEarned =
          segment.ID === SegmentID.DBL_BULL && !state.options.singleBull ? 2 : 1;
      } else if (section >= 15 && section <= 20) {
        target = section as CricketTarget;
        marksEarned =
          segment.Type === SegmentType.Triple ? 3
          : segment.Type === SegmentType.Double ? 2
          : 1;
      }
      // Any other segment scores nothing

      const currentMarks = target !== null ? player.marks[target] : 0;
      const marksToAdd = target !== null ? Math.min(marksEarned, 3 - currentMarks) : 0;
      const extraMarks = marksEarned - marksToAdd;

      let pointsScored = 0;
      if (target !== null && extraMarks > 0) {
        const anyOpponentOpen = state.players.some(
          (p, i) => i !== state.currentPlayerIndex && p.marks[target!] < 3,
        );
        if (anyOpponentOpen) {
          pointsScored = extraMarks * (target === 25 ? 25 : target);
        }
      }

      const newPlayers = state.players.map((p, i) => {
        if (i !== state.currentPlayerIndex) return p;
        const newMarks =
          target !== null
            ? { ...p.marks, [target]: Math.min(currentMarks + marksToAdd, 3) }
            : p.marks;
        return {
          ...p,
          marks: newMarks,
          score: p.score + pointsScored,
          totalDartsThrown: p.totalDartsThrown + 1,
          totalMarksEarned: p.totalMarksEarned + marksEarned,
        };
      });

      // Win: all targets closed AND score >= every opponent
      const updated = newPlayers[state.currentPlayerIndex];
      const allClosed = CRICKET_TARGETS.every((t) => updated.marks[t] >= 3);
      const leadsAll = newPlayers.every(
        (p, i) => i === state.currentPlayerIndex || updated.score >= p.score,
      );
      const winner = allClosed && leadsAll ? updated.name : null;

      return {
        currentRoundDarts: [
          ...state.currentRoundDarts,
          { segment, target, marksAdded: marksToAdd, marksEarned, pointsScored },
        ],
        players: newPlayers,
        winner,
      };
    }),

  undoLastDart: () =>
    set((state) => {
      if (state.currentRoundDarts.length === 0) return state;
      const last = state.currentRoundDarts[state.currentRoundDarts.length - 1];

      const newPlayers = state.players.map((p, i) => {
        if (i !== state.currentPlayerIndex) return p;
        const newMarks =
          last.target !== null
            ? { ...p.marks, [last.target]: p.marks[last.target] - last.marksAdded }
            : p.marks;
        return {
          ...p,
          marks: newMarks,
          score: p.score - last.pointsScored,
          totalDartsThrown: Math.max(0, p.totalDartsThrown - 1),
          totalMarksEarned: Math.max(0, p.totalMarksEarned - last.marksEarned),
        };
      });

      return {
        currentRoundDarts: state.currentRoundDarts.slice(0, -1),
        players: newPlayers,
        winner: null,
      };
    }),

  nextTurn: () =>
    set((state) => {
      if (state.winner) return state;
      return {
        currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
        currentRoundDarts: [],
      };
    }),

  resetGame: () => set(DEFAULT_STATE),
}));
