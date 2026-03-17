import type { Segment } from "../board/Dartboard.ts";
import { SegmentType } from "../board/Dartboard.ts";
import type { GameEngine } from "./GameEngine.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TicTacToeOptions {
  roundLimit: number; // 0 = unlimited
  singleBull: boolean; // true = both bull zones = 1 mark; false = outer=1, inner=2
}

export const DEFAULT_TICTACTOE_OPTIONS: TicTacToeOptions = {
  roundLimit: 20,
  singleBull: false,
};

export interface TicTacToeThrownDart {
  segment: Segment;
  gridIndex: number | null; // which grid cell was targeted (null = off-grid)
  marksAdded: number; // marks actually applied (capped)
  claimed: boolean; // did this dart claim the square?
}

export interface TicTacToePlayer {
  name: string;
  marks: number[]; // 9 entries, 0–4 per grid cell
  claimed: number[]; // grid indices this player owns
  rounds: {
    darts: { shortName: string; marksAdded: number; value: number }[];
  }[];
}

export interface TicTacToeState {
  options: TicTacToeOptions;
  players: TicTacToePlayer[];
  grid: number[]; // 9 numbers — grid[4] is always 25 (bull)
  owner: (0 | 1 | null)[]; // who owns each cell (player index or null)
  currentPlayerIndex: number;
  currentRound: number; // 1-based
  currentRoundDarts: TicTacToeThrownDart[];
  winner: string | null;
  isCatsGame: boolean;
}

// ---------------------------------------------------------------------------
// Win-line constants
// ---------------------------------------------------------------------------

const WIN_LINES: readonly [number, number, number][] = [
  [0, 1, 2], // rows
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6], // cols
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8], // diagonals
  [2, 4, 6],
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate 8 unique random numbers from 1–20 for the non-bull grid cells.
 * Seeded by no RNG — uses Math.random (shuffled Fisher-Yates).
 */
export function generateGrid(): number[] {
  const pool = Array.from({ length: 20 }, (_, i) => i + 1);
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picks = pool.slice(0, 8);
  // Grid: [0..3] = first 4, [4] = bull (25), [5..8] = next 4
  return [...picks.slice(0, 4), 25, ...picks.slice(4, 8)];
}

function marksForSegment(
  segment: Segment,
  singleBull: boolean,
): { number: number; marks: number } {
  const section = segment.Section;

  // Bull
  if (section === 25) {
    if (singleBull) return { number: 25, marks: 1 };
    // inner bull (double) = 2 marks, outer bull (single) = 1 mark
    return {
      number: 25,
      marks: segment.Type === SegmentType.Double ? 2 : 1,
    };
  }

  // Regular number 1-20
  if (section >= 1 && section <= 20) {
    switch (segment.Type) {
      case SegmentType.Triple:
        return { number: section, marks: 3 };
      case SegmentType.Double:
        return { number: section, marks: 2 };
      case SegmentType.Single:
        return { number: section, marks: 1 };
      default:
        return { number: section, marks: 0 };
    }
  }

  return { number: 0, marks: 0 };
}

function checkWinner(owner: (0 | 1 | null)[]): 0 | 1 | null {
  for (const [a, b, c] of WIN_LINES) {
    if (owner[a] !== null && owner[a] === owner[b] && owner[b] === owner[c]) {
      return owner[a];
    }
  }
  return null;
}

/**
 * Cat's game: no winning line remains possible for either player.
 * A line is possible for a player if no cell in that line is owned by the opponent.
 */
function isCatsGame(owner: (0 | 1 | null)[]): boolean {
  for (const [a, b, c] of WIN_LINES) {
    const cells = [owner[a], owner[b], owner[c]];
    // Line is still open for player 0 if no cell is owned by player 1
    if (!cells.includes(1)) return false;
    // Line is still open for player 1 if no cell is owned by player 0
    if (!cells.includes(0)) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class TicTacToeEngine implements GameEngine<
  TicTacToeState,
  TicTacToeOptions
> {
  startGame(options: TicTacToeOptions, playerNames: string[]): TicTacToeState {
    const grid = generateGrid();
    return {
      options,
      players: playerNames.map((name) => ({
        name,
        marks: Array(9).fill(0) as number[],
        claimed: [],
        rounds: [],
      })),
      grid,
      owner: Array(9).fill(null) as (0 | 1 | null)[],
      currentPlayerIndex: 0,
      currentRound: 1,
      currentRoundDarts: [],
      winner: null,
      isCatsGame: false,
    };
  }

  addDart(state: TicTacToeState, segment: Segment): Partial<TicTacToeState> {
    if (state.winner || state.isCatsGame) return state;
    if (state.currentRoundDarts.length >= 3) return state;

    const { number: hitNumber, marks: rawMarks } = marksForSegment(
      segment,
      state.options.singleBull,
    );

    // Find grid index for this number
    const gridIndex = hitNumber > 0 ? state.grid.indexOf(hitNumber) : -1;

    // Off-grid or miss
    if (gridIndex === -1 || rawMarks === 0) {
      return {
        currentRoundDarts: [
          ...state.currentRoundDarts,
          { segment, gridIndex: null, marksAdded: 0, claimed: false },
        ],
      };
    }

    // Square already claimed (locked)
    if (state.owner[gridIndex] !== null) {
      return {
        currentRoundDarts: [
          ...state.currentRoundDarts,
          { segment, gridIndex, marksAdded: 0, claimed: false },
        ],
      };
    }

    const pi = state.currentPlayerIndex;
    const currentMarks = state.players[pi].marks[gridIndex];
    const marksAdded = Math.min(rawMarks, 4 - currentMarks);
    const newMarks = currentMarks + marksAdded;
    const didClaim = newMarks >= 4;

    // Update player marks
    const updatedPlayers = state.players.map((p, i) => {
      if (i !== pi) return p;
      const newMarksArr = [...p.marks];
      newMarksArr[gridIndex] = newMarks;
      const newClaimed = didClaim ? [...p.claimed, gridIndex] : [...p.claimed];
      return { ...p, marks: newMarksArr, claimed: newClaimed };
    });

    // Update owner
    const newOwner = [...state.owner];
    if (didClaim) {
      newOwner[gridIndex] = pi as 0 | 1;
    }

    // Check win
    const winnerIdx = didClaim ? checkWinner(newOwner) : null;
    const cats = winnerIdx === null && didClaim ? isCatsGame(newOwner) : false;

    return {
      players: updatedPlayers,
      owner: newOwner,
      currentRoundDarts: [
        ...state.currentRoundDarts,
        { segment, gridIndex, marksAdded, claimed: didClaim },
      ],
      winner:
        winnerIdx !== null ? updatedPlayers[winnerIdx].name : state.winner,
      isCatsGame: cats || state.isCatsGame,
    };
  }

  undoLastDart(state: TicTacToeState): Partial<TicTacToeState> {
    if (state.currentRoundDarts.length === 0) return state;

    const lastDart =
      state.currentRoundDarts[state.currentRoundDarts.length - 1];
    const newDarts = state.currentRoundDarts.slice(0, -1);

    // If the last dart had no effect, just remove it
    if (lastDart.marksAdded === 0 && !lastDart.claimed) {
      return { currentRoundDarts: newDarts, winner: null, isCatsGame: false };
    }

    const pi = state.currentPlayerIndex;
    const gridIndex = lastDart.gridIndex!;

    // Restore player marks
    const updatedPlayers = state.players.map((p, i) => {
      if (i !== pi) return p;
      const newMarksArr = [...p.marks];
      newMarksArr[gridIndex] -= lastDart.marksAdded;
      const newClaimed = lastDart.claimed
        ? p.claimed.filter((c) => c !== gridIndex)
        : [...p.claimed];
      return { ...p, marks: newMarksArr, claimed: newClaimed };
    });

    // Restore owner
    const newOwner = [...state.owner];
    if (lastDart.claimed) {
      newOwner[gridIndex] = null;
    }

    return {
      players: updatedPlayers,
      owner: newOwner,
      currentRoundDarts: newDarts,
      winner: null,
      isCatsGame: false,
    };
  }

  nextTurn(state: TicTacToeState): Partial<TicTacToeState> {
    if (state.winner || state.isCatsGame) return state;

    const pi = state.currentPlayerIndex;

    // Record round
    const updatedPlayers = state.players.map((p, i) => {
      if (i !== pi) return p;
      return {
        ...p,
        rounds: [
          ...p.rounds,
          {
            darts: state.currentRoundDarts.map((d) => ({
              shortName: d.segment.ShortName,
              marksAdded: d.marksAdded,
              value: d.segment.Value,
            })),
          },
        ],
      };
    });

    const isLastPlayer = pi === state.players.length - 1;
    const nextPlayerIndex = isLastPlayer ? 0 : pi + 1;
    const nextRound = isLastPlayer
      ? state.currentRound + 1
      : state.currentRound;

    // Check round limit
    if (
      isLastPlayer &&
      state.options.roundLimit > 0 &&
      state.currentRound >= state.options.roundLimit
    ) {
      return {
        players: updatedPlayers,
        currentRoundDarts: [],
        isCatsGame: true,
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

export const ticTacToeEngine = new TicTacToeEngine();
