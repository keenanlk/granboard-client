import { create } from "zustand";
import {
  CreateSegment,
  SegmentID,
  SegmentSection,
  SegmentType,
  type Segment,
} from "../board/Dartboard.ts";

export interface X01Options {
  startingScore: 301 | 501 | 701;
  /** When false (default), outer bull scores 50 same as double bull. When true, bulls are split (outer = 25, inner = 50). */
  splitBull: boolean;
  /** Final dart must be a double (or bull) to win. Default: false. */
  doubleOut: boolean;
  /** Final dart must be a double, triple, or bull to win. Default: false. */
  masterOut: boolean;
  /** Must hit a double (or bull) before scoring begins. Default: false. */
  doubleIn: boolean;
}

export const DEFAULT_X01_OPTIONS: X01Options = {
  startingScore: 501,
  splitBull: false,
  doubleOut: false,
  masterOut: false,
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
  rounds: {
    score: number;
    darts: { value: number; shortName: string; scored: boolean }[];
  }[];
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

// ---------------------------------------------------------------------------
// addDart helpers
// ---------------------------------------------------------------------------

/*
 * Rule: splitBull
 * When splitBull is OFF — outer bull and inner bull are treated the same (both worth 50).
 * When splitBull is ON  — outer bull = 25, inner bull = 50 (split as separate targets).
 * To implement "same", we swap the outer bull segment for a double-bull segment before scoring.
 */
function getEffectiveSegment(segment: Segment, splitBull: boolean): Segment {
  return !splitBull && segment.ID === SegmentID.BULL
    ? CreateSegment(SegmentID.DBL_BULL)
    : segment;
}

/*
 * Rule: what counts as a "double" for finish/entry purposes
 * - Any double ring segment (D1–D20) counts as a double.
 * - Any bull (outer or inner) also counts as a double.
 * - Singles and triples do NOT count as doubles.
 */
function isDoubleOrBull(seg: Segment): boolean {
  return seg.Type === SegmentType.Double || seg.Section === SegmentSection.BULL;
}

/*
 * Rule: bust conditions (any one of these = bust, turn is canceled)
 * 1. Score goes below 0 — overshot.
 * 2. Score lands on exactly 1 when in double out or master out — unreachable finish (no segment scores 1 as a double/master).
 * 3. doubleOut is on and score reaches 0 on a non-double/non-bull — invalid finish.
 * 4. masterOut is on and score reaches 0 on a single — must finish on double, triple, or bull.
 */
function isX01Bust(newScore: number, opts: X01Options, seg: Segment): boolean {
  if (newScore < 0) return true;
  if (newScore === 1 && (opts.doubleOut || opts.masterOut)) return true;
  return (
    (newScore === 0 && opts.doubleOut && !isDoubleOrBull(seg)) ||
    (newScore === 0 &&
      opts.masterOut &&
      !isDoubleOrBull(seg) &&
      seg.Type !== SegmentType.Triple)
  );
}

/** Returns a new players array with only the player at `index` updated via `fn`. */
function mapCurrentPlayer(
  players: Player[],
  index: number,
  fn: (p: Player) => Player,
): Player[] {
  return players.map((p, i) => (i === index ? fn(p) : p));
}

// ---------------------------------------------------------------------------

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
        rounds: [],
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
      if (state.winner || state.isBust || state.currentRoundDarts.length >= 3)
        return state;

      const {
        currentPlayerIndex: ci,
        players,
        x01Options: opts,
        turnStartScores,
        turnStartOpened,
      } = state;
      const player = players[ci];

      const effective = getEffectiveSegment(segment, opts.splitBull);
      const dbOrBull = isDoubleOrBull(effective);

      // Double-in: must hit a double before scoring begins
      if (opts.doubleIn && !player.opened) {
        if (!dbOrBull) {
          // Dart thrown but scores 0 — player not yet opened
          return {
            currentRoundDarts: [
              ...state.currentRoundDarts,
              { segment: effective, scored: false },
            ],
            players: mapCurrentPlayer(players, ci, (p) => ({
              ...p,
              totalDartsThrown: p.totalDartsThrown + 1,
            })),
          };
        }
        // Opening double — fall through to score it normally
      }

      const newScore = player.score - effective.Value;

      if (isX01Bust(newScore, opts, effective)) {
        // Entire turn canceled — reset to turn-start score and opened state
        return {
          currentRoundDarts: [
            ...state.currentRoundDarts,
            { segment: effective, scored: false },
          ],
          players: mapCurrentPlayer(players, ci, (p) => ({
            ...p,
            score: turnStartScores[ci],
            opened: turnStartOpened[ci],
            totalDartsThrown: p.totalDartsThrown + 1,
          })),
          isBust: true,
        };
      }

      // Valid dart — update score and mark player as opened
      return {
        currentRoundDarts: [
          ...state.currentRoundDarts,
          { segment: effective, scored: true },
        ],
        players: mapCurrentPlayer(players, ci, (p) => ({
          ...p,
          score: newScore,
          opened: true,
          totalDartsThrown: p.totalDartsThrown + 1,
        })),
        winner: newScore === 0 ? player.name : null,
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
      const ci = state.currentPlayerIndex;
      const roundScore = state.turnStartScores[ci] - state.players[ci].score;
      const roundDarts = state.currentRoundDarts.map((d) => ({
        value: d.segment.Value,
        shortName: d.segment.ShortName,
        scored: d.scored,
      }));
      const nextIndex = (ci + 1) % state.players.length;
      return {
        currentPlayerIndex: nextIndex,
        currentRoundDarts: [],
        players: state.players.map((p, i) =>
          i === ci
            ? {
                ...p,
                rounds: [...p.rounds, { score: roundScore, darts: roundDarts }],
              }
            : p,
        ),
        turnStartScores: state.players.map((p) => p.score),
        turnStartOpened: state.players.map((p) => p.opened),
        isBust: false,
      };
    }),

  resetGame: () => set(DEFAULT_STATE),
}));
