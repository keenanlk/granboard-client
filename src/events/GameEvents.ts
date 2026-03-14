import type { Segment } from "../board/Dartboard.ts";

export type GameEventMap = {
  dart_hit: { segment: Segment; effectiveMarks?: number };
  bust: Record<string, never>;
  game_won: { playerName: string };
  next_turn: Record<string, never>;
  /** Cricket only: numbers the current player has open (closed by them, not yet by all) */
  open_numbers: { numbers: number[] };
};
