import { openDB } from "idb";
import type { DBSchema, IDBPDatabase } from "idb";
import type {
  CrudInterface,
  DataTypes,
  Table,
  Participant,
  Stage,
  Group,
  Round,
  Match,
  MatchGame,
} from "@nlc-darts/tournament";

// ── IndexedDB schema ────────────────────────────────────────────────────────

interface TournamentDB extends DBSchema {
  participant: {
    key: number;
    value: Participant;
    indexes: { by_tournament_id: number | string };
  };
  stage: {
    key: number;
    value: Stage;
    indexes: { by_tournament_id: number | string };
  };
  group: {
    key: number;
    value: Group;
    indexes: { by_stage_id: number };
  };
  round: {
    key: number;
    value: Round;
    indexes: { by_stage_id: number; by_group_id: number };
  };
  match: {
    key: number;
    value: Match;
    indexes: {
      by_stage_id: number;
      by_group_id: number;
      by_round_id: number;
    };
  };
  match_game: {
    key: number;
    value: MatchGame;
    indexes: { by_stage_id: number; by_parent_id: number };
  };
}

// ── DB singleton ────────────────────────────────────────────────────────────

let dbPromise: ReturnType<typeof openDB<TournamentDB>> | null = null;

function getDB(): Promise<IDBPDatabase<TournamentDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TournamentDB>("nlc-darts-tournaments", 1, {
      upgrade(db) {
        const participantStore = db.createObjectStore("participant", {
          keyPath: "id",
          autoIncrement: true,
        });
        participantStore.createIndex("by_tournament_id", "tournament_id");

        const stageStore = db.createObjectStore("stage", {
          keyPath: "id",
          autoIncrement: true,
        });
        stageStore.createIndex("by_tournament_id", "tournament_id");

        const groupStore = db.createObjectStore("group", {
          keyPath: "id",
          autoIncrement: true,
        });
        groupStore.createIndex("by_stage_id", "stage_id");

        const roundStore = db.createObjectStore("round", {
          keyPath: "id",
          autoIncrement: true,
        });
        roundStore.createIndex("by_stage_id", "stage_id");
        roundStore.createIndex("by_group_id", "group_id");

        const matchStore = db.createObjectStore("match", {
          keyPath: "id",
          autoIncrement: true,
        });
        matchStore.createIndex("by_stage_id", "stage_id");
        matchStore.createIndex("by_group_id", "group_id");
        matchStore.createIndex("by_round_id", "round_id");

        const matchGameStore = db.createObjectStore("match_game", {
          keyPath: "id",
          autoIncrement: true,
        });
        matchGameStore.createIndex("by_stage_id", "stage_id");
        matchGameStore.createIndex("by_parent_id", "parent_id");
      },
    });
  }
  return dbPromise;
}

// ── Filter helper ───────────────────────────────────────────────────────────

function matchesFilter<T>(item: T, filter: Partial<T>): boolean {
  for (const key in filter) {
    const filterVal = filter[key];
    const itemVal = (item as Record<string, unknown>)[key];
    if (
      filterVal !== null &&
      typeof filterVal === "object" &&
      !Array.isArray(filterVal)
    ) {
      if (
        itemVal === null ||
        typeof itemVal !== "object" ||
        !matchesFilter(itemVal, filterVal as Partial<typeof itemVal>)
      ) {
        return false;
      }
    } else if (itemVal !== filterVal) {
      return false;
    }
  }
  return true;
}

// ── CrudInterface implementation ────────────────────────────────────────────

// Cast needed because CrudInterface uses overloaded signatures where single
// insert returns Promise<number> and array insert returns Promise<boolean>.
// TypeScript cannot verify a single implementation satisfies both overloads.
export const idbStorage = {
  async insert<T extends Table>(
    table: T,
    value: unknown,
  ): Promise<number | boolean> {
    const db = await getDB();

    if (Array.isArray(value)) {
      const tx = db.transaction(table, "readwrite");
      for (const item of value) {
        await tx.store.add(item as DataTypes[T]);
      }
      await tx.done;
      return true;
    }

    const id = await db
      .transaction(table, "readwrite")
      .store.add(value as DataTypes[T]);
    return id as number;
  },

  async select<T extends Table>(
    table: T,
    idOrFilter?: number | string | Partial<DataTypes[T]>,
  ): Promise<DataTypes[T] | DataTypes[T][] | null> {
    const db = await getDB();

    if (idOrFilter === undefined) {
      const all = await db.getAll(table);
      return all as DataTypes[T][];
    }

    if (typeof idOrFilter === "number" || typeof idOrFilter === "string") {
      const result = await db.get(
        table,
        idOrFilter as unknown as TournamentDB[T]["key"],
      );
      return (result as DataTypes[T]) ?? null;
    }

    const all = await db.getAll(table);
    const filtered = (all as DataTypes[T][]).filter((item) =>
      matchesFilter(item, idOrFilter),
    );
    return filtered.length > 0 ? filtered : null;
  },

  async update<T extends Table>(
    table: T,
    idOrFilter: number | string | Partial<DataTypes[T]>,
    value: DataTypes[T] | Partial<DataTypes[T]>,
  ): Promise<boolean> {
    const db = await getDB();

    if (typeof idOrFilter === "number" || typeof idOrFilter === "string") {
      const existing = await db.get(
        table,
        idOrFilter as unknown as TournamentDB[T]["key"],
      );
      if (!existing) return false;
      await db.put(table, { ...existing, ...value } as DataTypes[T]);
      return true;
    }

    const all = await db.getAll(table);
    const tx = db.transaction(table, "readwrite");
    let updated = false;
    for (const item of all) {
      if (matchesFilter(item as DataTypes[T], idOrFilter)) {
        await tx.store.put({ ...item, ...value } as DataTypes[T]);
        updated = true;
      }
    }
    await tx.done;
    return updated;
  },

  async delete<T extends Table>(
    table: T,
    filter?: Partial<DataTypes[T]>,
  ): Promise<boolean> {
    const db = await getDB();

    if (filter === undefined) {
      await db.clear(table);
      return true;
    }

    const all = await db.getAll(table);
    const tx = db.transaction(table, "readwrite");
    let deleted = false;
    for (const item of all) {
      if (matchesFilter(item as DataTypes[T], filter)) {
        const id = (item as DataTypes[T] & { id: number }).id;
        await tx.store.delete(id);
        deleted = true;
      }
    }
    await tx.done;
    return deleted;
  },
} as CrudInterface;

// ── Local tournament CRUD (not part of brackets-manager) ────────────────────

export interface LocalTournament {
  id: string;
  name: string;
  format: string;
  status: string;
  createdAt: number;
  bracketTournamentId: number;
}

interface LocalTournamentDB extends DBSchema {
  local_tournaments: {
    key: string;
    value: LocalTournament;
    indexes: { by_status: string };
  };
}

let localTournamentDbPromise: Promise<IDBPDatabase<LocalTournamentDB>> | null =
  null;

function getLocalTournamentDB(): Promise<IDBPDatabase<LocalTournamentDB>> {
  if (!localTournamentDbPromise) {
    localTournamentDbPromise = openDB<LocalTournamentDB>(
      "nlc-darts-local-tournaments",
      1,
      {
        upgrade(db) {
          const store = db.createObjectStore("local_tournaments", {
            keyPath: "id",
          });
          store.createIndex("by_status", "status");
        },
      },
    );
  }
  return localTournamentDbPromise;
}

let nextBracketId = 1;

export async function createLocalTournament(
  name: string,
  format: string,
): Promise<LocalTournament> {
  const db = await getLocalTournamentDB();
  const tournament: LocalTournament = {
    id: crypto.randomUUID(),
    name,
    format,
    status: "registration",
    createdAt: Date.now(),
    bracketTournamentId: nextBracketId++,
  };
  await db.add("local_tournaments", tournament);
  return tournament;
}

export async function getLocalTournament(
  id: string,
): Promise<LocalTournament | undefined> {
  const db = await getLocalTournamentDB();
  return db.get("local_tournaments", id);
}

export async function getAllLocalTournaments(): Promise<LocalTournament[]> {
  const db = await getLocalTournamentDB();
  return db.getAll("local_tournaments");
}

export async function updateLocalTournamentStatus(
  id: string,
  status: string,
): Promise<void> {
  const db = await getLocalTournamentDB();
  const tournament = await db.get("local_tournaments", id);
  if (tournament) {
    await db.put("local_tournaments", { ...tournament, status });
  }
}
