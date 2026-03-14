import {
  CreateSegment,
  SegmentID,
  SegmentSection,
  SegmentType,
  type Segment,
} from "../board/Dartboard.ts";
import type { GameEngine } from "./GameEngine.ts";

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
    /** Player's opened state at the START of this round — used to restore on cross-turn undo. */
    openedBefore: boolean;
  }[];
  /** Total darts thrown this game (all darts, including busts and double-in misses). */
  totalDartsThrown: number;
}

export interface X01State {
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
}

// ---------------------------------------------------------------------------
// Rule helpers (private to this module)
// ---------------------------------------------------------------------------

/*
 * Rule: splitBull
 * When splitBull is OFF — outer bull and inner bull are treated the same (both worth 50).
 * When splitBull is ON  — outer bull = 25, inner bull = 50 (split as separate targets).
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
 * 2. Score lands on exactly 1 when in double out or master out — unreachable finish.
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

function mapCurrentPlayer(
  players: Player[],
  index: number,
  fn: (p: Player) => Player,
): Player[] {
  return players.map((p, i) => (i === index ? fn(p) : p));
}

// ---------------------------------------------------------------------------
// Engine class
// ---------------------------------------------------------------------------

export class X01Engine implements GameEngine<X01State, X01Options> {
  startGame(options: X01Options, playerNames: string[]): X01State {
    return {
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
      turnStartOpened: playerNames.map(() => !options.doubleIn),
      isBust: false,
      winner: null,
    };
  }

  addDart(state: X01State, segment: Segment): Partial<X01State> {
    if (state.winner || state.isBust || state.currentRoundDarts.length >= 3) return state;

    const { currentPlayerIndex: ci, players, x01Options: opts, turnStartScores, turnStartOpened } = state;
    const player = players[ci];

    const effective = getEffectiveSegment(segment, opts.splitBull);
    const dbOrBull = isDoubleOrBull(effective);

    // Double-in: must hit a double before scoring begins
    if (opts.doubleIn && !player.opened) {
      if (!dbOrBull) {
        return {
          currentRoundDarts: [...state.currentRoundDarts, { segment: effective, scored: false }],
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
      return {
        currentRoundDarts: [...state.currentRoundDarts, { segment: effective, scored: false }],
        players: mapCurrentPlayer(players, ci, (p) => ({
          ...p,
          score: turnStartScores[ci],
          opened: turnStartOpened[ci],
          totalDartsThrown: p.totalDartsThrown + 1,
        })),
        isBust: true,
      };
    }

    return {
      currentRoundDarts: [...state.currentRoundDarts, { segment: effective, scored: true }],
      players: mapCurrentPlayer(players, ci, (p) => ({
        ...p,
        score: newScore,
        opened: true,
        totalDartsThrown: p.totalDartsThrown + 1,
      })),
      winner: newScore === 0 ? player.name : null,
    };
  }

  undoLastDart(state: X01State): Partial<X01State> {
    // Case 1: darts in current turn — undo the last dart.
    if (state.currentRoundDarts.length > 0) {
      const newRoundDarts = state.currentRoundDarts.slice(0, -1);
      const scoredTotal = newRoundDarts
        .filter((d) => d.scored)
        .reduce((sum, d) => sum + d.segment.Value, 0);
      const hasAnyScored = newRoundDarts.some((d) => d.scored);

      return {
        currentRoundDarts: newRoundDarts,
        players: state.players.map((p, i) => {
          if (i !== state.currentPlayerIndex) return p;
          return {
            ...p,
            score: state.turnStartScores[i] - scoredTotal,
            opened: state.turnStartOpened[i] || hasAnyScored,
            totalDartsThrown: Math.max(0, p.totalDartsThrown - 1),
          };
        }),
        isBust: false,
        winner: null,
      };
    }

    // Case 2: no darts thrown yet — undo the previous player's entire completed turn.
    const n = state.players.length;
    const prevIndex = (state.currentPlayerIndex - 1 + n) % n;
    const prevPlayer = state.players[prevIndex];
    if (prevPlayer.rounds.length === 0) return state;

    const lastRound = prevPlayer.rounds[prevPlayer.rounds.length - 1];
    const restoredScore = prevPlayer.score + lastRound.score;

    const newPlayers = state.players.map((p, i) =>
      i !== prevIndex ? p : {
        ...p,
        score: restoredScore,
        opened: lastRound.openedBefore,
        rounds: p.rounds.slice(0, -1),
        totalDartsThrown: Math.max(0, p.totalDartsThrown - lastRound.darts.length),
      }
    );

    return {
      currentPlayerIndex: prevIndex,
      currentRoundDarts: [],
      players: newPlayers,
      turnStartScores: newPlayers.map((p) => p.score),
      turnStartOpened: newPlayers.map((p) => p.opened),
      isBust: false,
      winner: null,
    };
  }

  nextTurn(state: X01State): Partial<X01State> {
    if (state.winner) return state;

    const ci = state.currentPlayerIndex;
    const roundScore = state.turnStartScores[ci] - state.players[ci].score;
    const roundDarts = state.currentRoundDarts.map((d) => ({
      value: d.segment.Value,
      shortName: d.segment.ShortName,
      scored: d.scored,
    }));

    return {
      currentPlayerIndex: (ci + 1) % state.players.length,
      currentRoundDarts: [],
      players: state.players.map((p, i) =>
        i === ci
          ? { ...p, rounds: [...p.rounds, { score: roundScore, darts: roundDarts, openedBefore: state.turnStartOpened[ci] }] }
          : p,
      ),
      turnStartScores: state.players.map((p) => p.score),
      turnStartOpened: state.players.map((p) => p.opened),
      isBust: false,
    };
  }
}

export const x01Engine = new X01Engine();
