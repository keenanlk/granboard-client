import {
  SegmentSection,
  SegmentType,
  type Segment,
} from "../board/Dartboard.ts";
import type { GameEngine } from "./GameEngine.ts";
import {
  ATW_SEQUENCE,
  BULL_INDEX,
  FINISHED_INDEX,
  type ATWOptions,
  type ATWPlayer,
  type ATWRound,
  type ATWState,
  type ATWThrownDart,
} from "./atw.types.ts";

// ---------------------------------------------------------------------------
// Rule helpers
// ---------------------------------------------------------------------------

function getTargetNumber(targetIndex: number): number {
  if (targetIndex >= FINISHED_INDEX) return 25; // shouldn't display, but safe fallback
  return ATW_SEQUENCE[targetIndex];
}

/*
 * Rule: does this dart hit the player's current target?
 * - For numbers 1-20: segment.Section must equal the target number.
 * - For Bull (target 25): segment.Section must be BULL (25).
 */
function isHit(segment: Segment, currentTarget: number): boolean {
  return segment.Section === currentTarget;
}

/*
 * Rule: how many positions to advance on a hit
 * - Single = 1, Double = 2, Triple = 3
 * - Bull: outer bull (Single) = 1, inner bull (Double) = 1 (still just finishes)
 * - Capped so targetIndex never exceeds BULL_INDEX
 */
function getAdvancement(segment: Segment): number {
  if (segment.Section === SegmentSection.BULL) {
    // Both outer and inner bull advance by 1 (just need to hit Bull to finish)
    return 1;
  }
  switch (segment.Type) {
    case SegmentType.Triple:
      return 3;
    case SegmentType.Double:
      return 2;
    default:
      return 1;
  }
}

/*
 * Rule: determine winners when the round containing first finish completes
 * All players who finished in that round are winners.
 */
function collectWinners(
  players: ATWPlayer[],
  firstFinishRound: number,
): string[] {
  return players
    .filter((p) => p.finished && p.finishedInRound === firstFinishRound)
    .map((p) => p.name);
}

/*
 * Rule: round limit — furthest player(s) win
 */
function furthestWinners(players: ATWPlayer[]): string[] {
  // Finished players are furthest (targetIndex = FINISHED_INDEX = 21)
  const maxIndex = Math.max(...players.map((p) => p.targetIndex));
  return players.filter((p) => p.targetIndex === maxIndex).map((p) => p.name);
}

// ---------------------------------------------------------------------------
// Engine class
// ---------------------------------------------------------------------------

/**
 * Game engine for Around the World (ATW) mode implementing the GameEngine interface.
 */
export class ATWEngine implements GameEngine<ATWState, ATWOptions> {
  startGame(options: ATWOptions, playerNames: string[]): ATWState {
    return {
      options,
      players: playerNames.map((name) => ({
        name,
        targetIndex: 0,
        currentTarget: ATW_SEQUENCE[0],
        finished: false,
        finishedInRound: null,
        rounds: [],
        totalDartsThrown: 0,
      })),
      currentPlayerIndex: 0,
      currentRound: 1,
      currentRoundDarts: [],
      winners: null,
      firstFinishRound: null,
    };
  }

  addDart(state: ATWState, segment: Segment): Partial<ATWState> {
    const { currentPlayerIndex: ci, players, currentRound } = state;
    const player = players[ci];

    if (state.winners || state.currentRoundDarts.length >= 3 || player.finished)
      return state;

    const hit = isHit(segment, player.currentTarget);
    let advanced = 0;
    let newTargetIndex = player.targetIndex;
    let finished = false;

    if (hit) {
      if (player.targetIndex === BULL_INDEX) {
        // Player is on Bull and hit Bull → finished!
        finished = true;
        newTargetIndex = FINISHED_INDEX;
        advanced = 1;
      } else {
        advanced = getAdvancement(segment);
        newTargetIndex = Math.min(player.targetIndex + advanced, BULL_INDEX);
      }
    }

    const dart: ATWThrownDart = {
      segment,
      hit,
      advanced,
      previousTargetIndex: player.targetIndex,
    };

    const newPlayers = players.map((p, i) => {
      if (i !== ci) return p;
      return {
        ...p,
        targetIndex: newTargetIndex,
        currentTarget: finished ? 25 : getTargetNumber(newTargetIndex),
        finished,
        finishedInRound: finished ? currentRound : p.finishedInRound,
        totalDartsThrown: p.totalDartsThrown + 1,
      };
    });

    const newFirstFinishRound =
      finished && state.firstFinishRound === null
        ? currentRound
        : state.firstFinishRound;

    return {
      currentRoundDarts: [...state.currentRoundDarts, dart],
      players: newPlayers,
      firstFinishRound: newFirstFinishRound,
    };
  }

  undoLastDart(state: ATWState): Partial<ATWState> {
    if (state.currentRoundDarts.length === 0) return state;

    const last = state.currentRoundDarts[state.currentRoundDarts.length - 1];
    const prevIndex = last.previousTargetIndex;

    // Check if undoing removes the only finisher to clear firstFinishRound
    const ci = state.currentPlayerIndex;
    const wasFinished = state.players[ci].finished;

    const newPlayers = state.players.map((p, i) => {
      if (i !== ci) return p;
      return {
        ...p,
        targetIndex: prevIndex,
        currentTarget: getTargetNumber(prevIndex),
        finished: false,
        finishedInRound: null,
        totalDartsThrown: Math.max(0, p.totalDartsThrown - 1),
      };
    });

    // If this player was the only one finished, clear firstFinishRound
    let newFirstFinishRound = state.firstFinishRound;
    if (wasFinished) {
      const anyOtherFinished = newPlayers.some(
        (p, i) => i !== ci && p.finished,
      );
      if (!anyOtherFinished) newFirstFinishRound = null;
    }

    return {
      currentRoundDarts: state.currentRoundDarts.slice(0, -1),
      players: newPlayers,
      firstFinishRound: newFirstFinishRound,
      winners: null,
    };
  }

  nextTurn(state: ATWState): Partial<ATWState> {
    if (state.winners) return state;

    const ci = state.currentPlayerIndex;
    const player = state.players[ci];

    // Build round record
    const startTargetIndex =
      state.currentRoundDarts.length > 0
        ? state.currentRoundDarts[0].previousTargetIndex
        : player.targetIndex;
    const roundRecord: ATWRound = {
      darts: state.currentRoundDarts.map((d) => ({
        shortName: d.segment.ShortName,
        hit: d.hit,
      })),
      startTargetIndex,
      endTargetIndex: player.targetIndex,
    };

    const updatedPlayers = state.players.map((p, i) => {
      if (i !== ci) return p;
      return { ...p, rounds: [...p.rounds, roundRecord] };
    });

    const isLastPlayer = ci === state.players.length - 1;
    const nextPlayerIndex = isLastPlayer ? 0 : ci + 1;
    const nextRound = isLastPlayer
      ? state.currentRound + 1
      : state.currentRound;

    // Check: did someone finish and this is the end of that round?
    if (isLastPlayer && state.firstFinishRound !== null) {
      const winners = collectWinners(updatedPlayers, state.firstFinishRound);
      if (winners.length > 0) {
        return {
          players: updatedPlayers,
          currentRoundDarts: [],
          winners,
        };
      }
    }

    // Check: round limit reached after last player
    if (
      isLastPlayer &&
      state.options.roundLimit > 0 &&
      state.currentRound >= state.options.roundLimit
    ) {
      return {
        players: updatedPlayers,
        currentRoundDarts: [],
        winners: furthestWinners(updatedPlayers),
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

/**
 * Singleton instance of ATWEngine.
 */
export const atwEngine = new ATWEngine();
