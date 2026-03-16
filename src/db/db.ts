import { openDB } from "idb";
import type { DBSchema } from "idb";

// ── Schema types ──────────────────────────────────────────────────────────────

export interface PlayerRecord {
  id: string;
  name: string;
  createdAt: number;
}

export interface RecordedDart {
  value: number;
  shortName: string;
  scored?: boolean; // x01: whether the dart counted
  marksEarned?: number; // cricket: raw marks from this dart
}

export interface RoundRecord {
  playerIndex: number;
  playerName: string;
  playerId: string | null;
  round: number;
  darts: RecordedDart[];
  roundScore: number;
}

export interface GameSessionRecord {
  id: string;
  gameType: "x01" | "cricket" | "highscore";
  playedAt: number;
  options: unknown;
  participants: {
    playerId: string | null;
    name: string;
    finalScore: number;
    isWinner: boolean;
  }[];
  rounds: RoundRecord[];
}

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

export async function dbGetAllPlayers(): Promise<PlayerRecord[]> {
  const db = await getDB();
  return db.getAll("players");
}

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

export async function dbDeletePlayer(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("players", id);
}

export async function dbRenamePlayer(id: string, name: string): Promise<void> {
  const db = await getDB();
  const player = await db.get("players", id);
  if (player) await db.put("players", { ...player, name });
}

// ── Session recording ─────────────────────────────────────────────────────────

export async function dbSaveSession(session: GameSessionRecord): Promise<void> {
  const db = await getDB();
  await db.add("game_sessions", session);
}

export async function dbGetSessionsForPlayer(
  playerId: string,
): Promise<GameSessionRecord[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("game_sessions", "by_playedAt");
  return all.filter((s) => s.participants.some((p) => p.playerId === playerId));
}
