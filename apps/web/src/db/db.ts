import { openDB } from "idb";
import type { DBSchema } from "idb";
import type { GameSessionRecord, PlayerRecord } from "@nlc-darts/engine";
import { logger } from "../lib/logger.ts";

const log = logger.child({ module: "db" });

// ── IndexedDB schema ──────────────────────────────────────────────────────────

interface NLCDartsDB extends DBSchema {
  players: {
    key: string;
    value: PlayerRecord;
    indexes: { by_name: string };
  };
  game_sessions: {
    key: string;
    value: GameSessionRecord;
    indexes: { by_playedAt: number };
  };
}

// ── DB singleton ──────────────────────────────────────────────────────────────

let dbPromise: ReturnType<typeof openDB<NLCDartsDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<NLCDartsDB>("nlc-darts", 1, {
      upgrade(db) {
        const playerStore = db.createObjectStore("players", { keyPath: "id" });
        playerStore.createIndex("by_name", "name");
        const sessionStore = db.createObjectStore("game_sessions", {
          keyPath: "id",
        });
        sessionStore.createIndex("by_playedAt", "playedAt");
      },
    });
  }
  return dbPromise;
}

// ── Player CRUD ───────────────────────────────────────────────────────────────

/** Retrieve all saved players from IndexedDB. */
export async function dbGetAllPlayers(): Promise<PlayerRecord[]> {
  const db = await getDB();
  return db.getAll("players");
}

/**
 * Create a new player record.
 *
 * @param name - Display name for the player.
 * @returns The newly created player record.
 */
export async function dbAddPlayer(name: string): Promise<PlayerRecord> {
  const db = await getDB();
  const id =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const player: PlayerRecord = { id, name, createdAt: Date.now() };
  await db.add("players", player);
  return player;
}

/**
 * Delete a player by ID.
 *
 * @param id - Player record ID.
 */
export async function dbDeletePlayer(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("players", id);
}

/**
 * Rename an existing player.
 *
 * @param id - Player record ID.
 * @param name - New display name.
 */
export async function dbRenamePlayer(id: string, name: string): Promise<void> {
  const db = await getDB();
  const player = await db.get("players", id);
  if (player) await db.put("players", { ...player, name });
}

// ── Session recording ─────────────────────────────────────────────────────────

/**
 * Persist a completed game session to IndexedDB.
 *
 * @param session - The game session record to save.
 */
export async function dbSaveSession(session: GameSessionRecord): Promise<void> {
  const db = await getDB();
  await db.add("game_sessions", session);
  log.info(
    { sessionId: session.id, gameType: session.gameType },
    "Game session saved",
  );
}

/**
 * Retrieve all game sessions that include the given player.
 *
 * @param playerId - Player record ID to filter by.
 * @returns Sessions ordered by play date.
 */
export async function dbGetSessionsForPlayer(
  playerId: string,
): Promise<GameSessionRecord[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("game_sessions", "by_playedAt");
  return all.filter((s) => s.participants.some((p) => p.playerId === playerId));
}
