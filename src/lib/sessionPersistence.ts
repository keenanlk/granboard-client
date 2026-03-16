import type { BotSkill } from "../bot/Bot.ts";
import type { SetConfig, LegResult } from "./setTypes.ts";

export interface PersistedSession {
  gameType: "x01" | "cricket" | "highscore";
  options: unknown;
  playerNames: string[];
  playerIds: (string | null)[];
  botSkills: (BotSkill | null)[];
  gameState: unknown;
  savedAt: number;
  /** Set match fields — present only when this leg is part of a set */
  setConfig?: SetConfig;
  legResults?: LegResult[];
  currentLegIndex?: number;
}

const STORAGE_KEY = "nlc-active-session";

export function saveSession(session: PersistedSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Silently fail — localStorage may be full or unavailable
  }
}

export function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}
