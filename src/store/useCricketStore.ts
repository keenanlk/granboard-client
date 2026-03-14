import { create } from "zustand";
import { SegmentID, SegmentSection, SegmentType, type Segment } from "../board/Dartboard.ts";

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
  marksEarned: number;          // raw physical marks from the dart (1/2/3); used for animation
  effectiveMarks: number;       // marks that counted: closing marks + scoring extras; used for totalMarksEarned / undo
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

// ---------------------------------------------------------------------------
// addDart helpers
// ---------------------------------------------------------------------------

/*
 * Rule: which segments are valid cricket targets and how many marks they earn
 * - Bull (any ring): always target 25.
 *     - Outer bull = 1 mark always.
 *     - Inner bull = 2 marks normally; 1 mark if singleBull option is on.
 * - Numbers 15–20: valid targets worth 1/2/3 marks for single/double/triple.
 * - Any other segment (1–14, miss): not a cricket target — scores nothing.
 */
function getCricketTargetAndMarks(
  segment: Segment,
  singleBull: boolean,
): { target: CricketTarget | null; marksEarned: number } {
  if (segment.Section === SegmentSection.BULL) {
    const marksEarned = segment.ID === SegmentID.DBL_BULL && !singleBull ? 2 : 1;
    return { target: 25, marksEarned };
  }
  if (segment.Section >= 15 && segment.Section <= 20) {
    const marksEarned =
      segment.Type === SegmentType.Triple ? 3
      : segment.Type === SegmentType.Double ? 2
      : 1;
    return { target: segment.Section as CricketTarget, marksEarned };
  }
  return { target: null, marksEarned: 0 };
}

/*
 * Rule: when do extra marks (beyond the 3-cap) score points?
 * - If the player has already closed a number (3 marks), additional hits on it can score points.
 * - Points only score if at least one opponent still has fewer than 3 marks on that number.
 * - Once all opponents have also closed it, extra marks on that number score nothing.
 * - Point value = face value of the number (bull = 25 per mark).
 */
function calcPointsFromExtras(
  target: CricketTarget,
  extraMarks: number,
  players: CricketPlayer[],
  currentPlayerIndex: number,
): { scoringExtras: number; pointsScored: number } {
  if (extraMarks === 0) return { scoringExtras: 0, pointsScored: 0 };
  const anyOpponentOpen = players.some(
    (p, i) => i !== currentPlayerIndex && p.marks[target] < 3,
  );
  if (!anyOpponentOpen) return { scoringExtras: 0, pointsScored: 0 };
  return {
    scoringExtras: extraMarks,
    pointsScored: extraMarks * (target === 25 ? 25 : target),
  };
}

/*
 * Rule: cricket win condition — both conditions must be true simultaneously:
 * 1. The player has closed all 7 targets (20, 19, 18, 17, 16, 15, bull) — each needs 3 marks.
 * 2. The player's score is greater than or equal to every opponent's score.
 * A player who closes everything first but trails on points has NOT yet won.
 */
function checkCricketWinner(
  player: CricketPlayer,
  allPlayers: CricketPlayer[],
  currentIndex: number,
): string | null {
  const allClosed = CRICKET_TARGETS.every((t) => player.marks[t] >= 3);
  const leadsAll = allPlayers.every((p, i) => i === currentIndex || player.score >= p.score);
  return allClosed && leadsAll ? player.name : null;
}

// ---------------------------------------------------------------------------

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

      const { currentPlayerIndex: ci, players, options } = state;
      const player = players[ci];

      const { target, marksEarned } = getCricketTargetAndMarks(segment, options.singleBull);

      const currentMarks = target !== null ? player.marks[target] : 0;
      const marksToAdd = target !== null ? Math.min(marksEarned, 3 - currentMarks) : 0;
      const extraMarks = marksEarned - marksToAdd;

      // Points only score if at least one opponent hasn't closed this target yet
      const { scoringExtras, pointsScored } =
        target !== null
          ? calcPointsFromExtras(target, extraMarks, players, ci)
          : { scoringExtras: 0, pointsScored: 0 };

      // effectiveMarks: closing marks + marks that actually scored (used for undo / stats)
      const effectiveMarks = marksToAdd + scoringExtras;

      const newPlayers = players.map((p, i) => {
        if (i !== ci) return p;
        const newMarks =
          target !== null
            ? { ...p.marks, [target]: Math.min(currentMarks + marksToAdd, 3) }
            : p.marks;
        return {
          ...p,
          marks: newMarks,
          score: p.score + pointsScored,
          totalDartsThrown: p.totalDartsThrown + 1,
          totalMarksEarned: p.totalMarksEarned + effectiveMarks,
        };
      });

      const winner = checkCricketWinner(newPlayers[ci], newPlayers, ci);

      return {
        currentRoundDarts: [
          ...state.currentRoundDarts,
          { segment, target, marksAdded: marksToAdd, marksEarned, effectiveMarks, pointsScored },
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
          totalMarksEarned: Math.max(0, p.totalMarksEarned - last.effectiveMarks),
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
