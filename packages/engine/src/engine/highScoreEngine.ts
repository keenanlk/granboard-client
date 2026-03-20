import type { Segment } from "../board/Dartboard.ts";
import type { GameEngine } from "./GameEngine.ts";
import type {
  HighScoreOptions,
  HighScorePlayer,
  HighScoreState,
} from "./highScore.types.ts";

// ---------------------------------------------------------------------------
// Rule helpers (private to this module)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Engine class
// ---------------------------------------------------------------------------

/**
 * Game engine for High Score mode implementing the GameEngine interface.
 */
export class HighScoreEngine implements GameEngine<
  HighScoreState,
  HighScoreOptions
> {
  startGame(options: HighScoreOptions, playerNames: string[]): HighScoreState {
    return {
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
    };
  }

  addDart(state: HighScoreState, segment: Segment): Partial<HighScoreState> {
    if (state.winners || state.currentRoundDarts.length >= 3) return state;
    const value = normalizeSegmentValue(segment, state.options.splitBull);
    return {
      currentRoundDarts: [...state.currentRoundDarts, { segment, value }],
    };
  }

  undoLastDart(state: HighScoreState): Partial<HighScoreState> {
    if (state.currentRoundDarts.length === 0) return state;
    return {
      currentRoundDarts: state.currentRoundDarts.slice(0, -1),
    };
  }

  nextTurn(state: HighScoreState): Partial<HighScoreState> {
    if (state.winners) return state;

    const roundTotal = state.currentRoundDarts.reduce(
      (sum, d) => sum + d.value,
      0,
    );

    const updatedPlayers = state.players.map((p, i) => {
      if (i !== state.currentPlayerIndex) return p;
      return {
        ...p,
        score: p.score + roundTotal,
        rounds: [
          ...p.rounds,
          {
            score: roundTotal,
            darts: state.currentRoundDarts.map((d) => ({
              value: d.value,
              shortName: d.segment.ShortName,
            })),
          },
        ],
      };
    });

    const isLastPlayer = state.currentPlayerIndex === state.players.length - 1;
    const isLastRound = state.currentRound === state.options.rounds;
    const nextPlayerIndex = isLastPlayer ? 0 : state.currentPlayerIndex + 1;
    const nextRound = isLastPlayer
      ? state.currentRound + 1
      : state.currentRound;

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
  }
}

/**
 * Singleton instance of HighScoreEngine.
 */
export const highScoreEngine = new HighScoreEngine();
