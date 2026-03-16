import { SegmentID, SegmentSection, SegmentType, type Segment } from "../board/Dartboard.ts";
import type { GameEngine } from "./GameEngine.ts";

export const CRICKET_TARGETS = [20, 19, 18, 17, 16, 15, 25] as const;
export type CricketTarget = (typeof CRICKET_TARGETS)[number];

export interface CricketOptions {
  /** Both outer and inner bull count as 1 mark. Default: false (outer=1, inner=2). */
  singleBull: boolean;
  /** Maximum rounds per player. 0 = unlimited. Default: 20. */
  roundLimit: number;
  /** Cut-throat mode: points go to opponents, lowest score wins. Default: false. */
  cutThroat: boolean;
}

export const DEFAULT_CRICKET_OPTIONS: CricketOptions = {
  singleBull: false,
  roundLimit: 20,
  cutThroat: false,
};

export interface CricketThrownDart {
  segment: Segment;
  target: CricketTarget | null; // null = not a valid cricket target
  marksAdded: number;           // marks added toward closing (≤3 cap); used for undo
  marksEarned: number;          // raw physical marks from the dart (1/2/3); used for animation
  effectiveMarks: number;       // marks that counted: closing marks + scoring extras; used for totalMarksEarned / undo
  pointsScored: number;
  /** Cut-throat only: which opponents received points (for undo). */
  pointsDistributed?: { playerIndex: number; points: number }[];
}

export interface CricketRound {
  score: number;
  marksEarned: number;
  darts: { value: number; shortName: string }[];
}

export interface CricketPlayer {
  name: string;
  marks: Record<CricketTarget, number>; // 0–3, capped
  score: number;
  totalDartsThrown: number;
  totalMarksEarned: number;
  rounds: CricketRound[];
}

export interface CricketState {
  options: CricketOptions;
  players: CricketPlayer[];
  currentPlayerIndex: number;
  currentRound: number; // 1-based
  currentRoundDarts: CricketThrownDart[];
  winner: string | null;
}

export function emptyMarks(): Record<CricketTarget, number> {
  return { 20: 0, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 };
}

// ---------------------------------------------------------------------------
// Rule helpers (private to this module)
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
  cutThroat: boolean,
): { scoringExtras: number; pointsScored: number; pointsDistributed?: { playerIndex: number; points: number }[] } {
  if (extraMarks === 0) return { scoringExtras: 0, pointsScored: 0 };
  const faceValue = target === 25 ? 25 : target;
  const perMark = extraMarks * faceValue;

  if (cutThroat) {
    // Points go to each opponent who hasn't closed this number
    const distributed: { playerIndex: number; points: number }[] = [];
    players.forEach((p, i) => {
      if (i !== currentPlayerIndex && p.marks[target] < 3) {
        distributed.push({ playerIndex: i, points: perMark });
      }
    });
    if (distributed.length === 0) return { scoringExtras: 0, pointsScored: 0 };
    const totalDistributed = distributed.reduce((sum, d) => sum + d.points, 0);
    return { scoringExtras: extraMarks, pointsScored: totalDistributed, pointsDistributed: distributed };
  }

  const anyOpponentOpen = players.some(
    (p, i) => i !== currentPlayerIndex && p.marks[target] < 3,
  );
  if (!anyOpponentOpen) return { scoringExtras: 0, pointsScored: 0 };
  return {
    scoringExtras: extraMarks,
    pointsScored: perMark,
  };
}

/*
 * Rule: cricket win condition — both conditions must be true simultaneously:
 * 1. The player has closed all 7 targets (20, 19, 18, 17, 16, 15, bull) — each needs 3 marks.
 * 2. The player's score is greater than or equal to every opponent's score.
 * A player who closes everything first but trails on points has NOT yet won.
 *
 * Stalemate rule: if all players have closed all targets, nobody can score anymore.
 * In that case, the player with the highest score wins (first by score, then by current turn order).
 */
function checkCricketWinner(
  player: CricketPlayer,
  allPlayers: CricketPlayer[],
  currentIndex: number,
  cutThroat: boolean,
): string | null {
  const allClosed = CRICKET_TARGETS.every((t) => player.marks[t] >= 3);

  if (cutThroat) {
    // Cut-throat: lowest score wins when all closed
    const leadsAll = allPlayers.every((p, i) => i === currentIndex || player.score <= p.score);
    if (allClosed && leadsAll) return player.name;
  } else {
    const leadsAll = allPlayers.every((p, i) => i === currentIndex || player.score >= p.score);
    if (allClosed && leadsAll) return player.name;
  }

  // Stalemate: all players have closed all targets
  const allPlayersClosedAll = allPlayers.every((p) =>
    CRICKET_TARGETS.every((t) => p.marks[t] >= 3),
  );
  if (allPlayersClosedAll) {
    if (cutThroat) {
      const minScore = Math.min(...allPlayers.map((p) => p.score));
      return allPlayers.find((p) => p.score === minScore)!.name;
    }
    const maxScore = Math.max(...allPlayers.map((p) => p.score));
    return allPlayers.find((p) => p.score === maxScore)!.name;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Engine class
// ---------------------------------------------------------------------------

export class CricketEngine implements GameEngine<CricketState, CricketOptions> {
  startGame(options: CricketOptions, playerNames: string[]): CricketState {
    return {
      options,
      players: playerNames.map((name) => ({
        name,
        marks: emptyMarks(),
        score: 0,
        totalDartsThrown: 0,
        totalMarksEarned: 0,
        rounds: [],
      })),
      currentPlayerIndex: 0,
      currentRound: 1,
      currentRoundDarts: [],
      winner: null,
    };
  }

  addDart(state: CricketState, segment: Segment): Partial<CricketState> {
    if (state.winner || state.currentRoundDarts.length >= 3) return state;

    const { currentPlayerIndex: ci, players, options } = state;
    const player = players[ci];

    const { target, marksEarned } = getCricketTargetAndMarks(segment, options.singleBull);
    const currentMarks = target !== null ? player.marks[target] : 0;
    const marksToAdd = target !== null ? Math.min(marksEarned, 3 - currentMarks) : 0;
    const extraMarks = marksEarned - marksToAdd;

    const { scoringExtras, pointsScored, pointsDistributed } =
      target !== null
        ? calcPointsFromExtras(target, extraMarks, players, ci, options.cutThroat)
        : { scoringExtras: 0, pointsScored: 0, pointsDistributed: undefined };

    const effectiveMarks = marksToAdd + scoringExtras;

    const newPlayers = players.map((p, i) => {
      if (i === ci) {
        // Current player: update marks + darts stats; score only in standard mode
        const newMarks =
          target !== null
            ? { ...p.marks, [target]: Math.min(currentMarks + marksToAdd, 3) }
            : p.marks;
        return {
          ...p,
          marks: newMarks,
          score: options.cutThroat ? p.score : p.score + pointsScored,
          totalDartsThrown: p.totalDartsThrown + 1,
          totalMarksEarned: p.totalMarksEarned + effectiveMarks,
        };
      }
      // Cut-throat: add points to opponents in the distributed list
      if (options.cutThroat && pointsDistributed) {
        const entry = pointsDistributed.find((d) => d.playerIndex === i);
        if (entry) return { ...p, score: p.score + entry.points };
      }
      return p;
    });

    const winner = checkCricketWinner(newPlayers[ci], newPlayers, ci, options.cutThroat);

    const dart: CricketThrownDart = {
      segment, target, marksAdded: marksToAdd, marksEarned, effectiveMarks, pointsScored,
      ...(pointsDistributed ? { pointsDistributed } : {}),
    };

    return {
      currentRoundDarts: [...state.currentRoundDarts, dart],
      players: newPlayers,
      winner,
    };
  }

  undoLastDart(state: CricketState): Partial<CricketState> {
    if (state.currentRoundDarts.length === 0) return state;

    const last = state.currentRoundDarts[state.currentRoundDarts.length - 1];
    const isCutThroat = state.options.cutThroat;

    return {
      currentRoundDarts: state.currentRoundDarts.slice(0, -1),
      players: state.players.map((p, i) => {
        if (i === state.currentPlayerIndex) {
          const newMarks =
            last.target !== null
              ? { ...p.marks, [last.target]: p.marks[last.target] - last.marksAdded }
              : p.marks;
          return {
            ...p,
            marks: newMarks,
            score: isCutThroat ? p.score : p.score - last.pointsScored,
            totalDartsThrown: Math.max(0, p.totalDartsThrown - 1),
            totalMarksEarned: Math.max(0, p.totalMarksEarned - last.effectiveMarks),
          };
        }
        // Cut-throat: reverse points distributed to opponents
        if (isCutThroat && last.pointsDistributed) {
          const entry = last.pointsDistributed.find((d) => d.playerIndex === i);
          if (entry) return { ...p, score: p.score - entry.points };
        }
        return p;
      }),
      winner: null,
    };
  }

  nextTurn(state: CricketState): Partial<CricketState> {
    if (state.winner) return state;

    const roundScore = state.currentRoundDarts.reduce((sum, d) => sum + d.pointsScored, 0);
    const roundMarks = state.currentRoundDarts.reduce((sum, d) => sum + d.effectiveMarks, 0);
    const roundRecord: CricketRound = {
      score: roundScore,
      marksEarned: roundMarks,
      darts: state.currentRoundDarts.map((d) => ({
        value: d.segment.Value,
        shortName: d.segment.ShortName,
      })),
    };

    const updatedPlayers = state.players.map((p, i) => {
      if (i !== state.currentPlayerIndex) return p;
      return { ...p, rounds: [...p.rounds, roundRecord] };
    });

    const isLastPlayer = state.currentPlayerIndex === state.players.length - 1;
    const nextPlayerIndex = isLastPlayer ? 0 : state.currentPlayerIndex + 1;
    const nextRound = isLastPlayer ? state.currentRound + 1 : state.currentRound;

    // Round limit reached after the last player finishes
    if (isLastPlayer && state.options.roundLimit > 0 && state.currentRound >= state.options.roundLimit) {
      const bestScore = state.options.cutThroat
        ? Math.min(...updatedPlayers.map((p) => p.score))
        : Math.max(...updatedPlayers.map((p) => p.score));
      const winner = updatedPlayers.find((p) => p.score === bestScore)!.name;
      return {
        players: updatedPlayers,
        currentRoundDarts: [],
        winner,
      };
    }

    return {
      players: updatedPlayers,
      currentPlayerIndex: nextPlayerIndex,
      currentRound: nextRound,
      currentRoundDarts: [],
    };
  }
}

export const cricketEngine = new CricketEngine();
