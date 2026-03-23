import type { X01Options } from "../engine/x01.types.ts";
import type { CricketOptions } from "../engine/cricket.types.ts";
import type { BotSkill } from "../bot/Bot.ts";

/** Best-of set format: best of 1, 3, 5, 7, or 9 legs. */
export type SetFormat = "bo1" | "bo3" | "bo5" | "bo7" | "bo9";

/** Configuration for a single leg within a set. */
export interface LegConfig {
  gameType: "x01" | "cricket";
  x01Options?: X01Options;
  cricketOptions?: CricketOptions;
}

/** Determines who throws first in subsequent legs: loser of previous leg or alternating. */
export type ThrowOrder = "loser" | "alternate";

/** Full configuration for a multi-leg set. */
export interface SetConfig {
  format: SetFormat;
  legs: LegConfig[];
  throwOrder: ThrowOrder;
}

/** Result of a completed leg within a set. */
export interface LegResult {
  winnerName: string;
  winnerIndex: number;
}

/** Complete mutable state for a set in progress. */
export interface SetState {
  config: SetConfig;
  legResults: LegResult[];
  currentLegIndex: number;
  playerNames: string[];
  playerIds: (string | null)[];
  botSkills: (BotSkill | null)[];
}

/** Read-only snapshot of set progress for UI display. */
export interface SetProgress {
  legResults: LegResult[];
  totalLegs: number;
  currentLeg: number;
  playerNames: string[];
}

/**
 * Returns the winner's name once someone has won the majority of legs,
 * or null if the set is still in progress.
 */
export function getSetWinner(
  legResults: LegResult[],
  format: SetFormat,
): string | null {
  const needed = Math.ceil(parseInt(format.slice(2)) / 2);
  const wins = new Map<string, number>();
  for (const r of legResults) {
    const count = (wins.get(r.winnerName) ?? 0) + 1;
    wins.set(r.winnerName, count);
    if (count >= needed) return r.winnerName;
  }
  return null;
}

/**
 * Returns the total number of legs for a given format.
 */
export function legCount(format: SetFormat): number {
  return parseInt(format.slice(2));
}
