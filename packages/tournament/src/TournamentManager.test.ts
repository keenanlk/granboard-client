import { describe, it, expect } from "vitest";
import { TournamentManager } from "./TournamentManager.ts";
import type { CrudInterface, DataTypes, Table } from "brackets-manager";

/**
 * In-memory storage implementing brackets-manager's CrudInterface.
 * Used for testing TournamentManager without a real database.
 */
function createInMemoryStorage(): CrudInterface {
  const tables: Record<string, unknown[]> = {
    participant: [],
    stage: [],
    group: [],
    round: [],
    match: [],
    match_game: [],
  };
  let nextId = 1;

  return {
    async insert<T extends Table>(
      table: T,
      value: unknown,
    ): Promise<number | boolean> {
      if (Array.isArray(value)) {
        for (const item of value) {
          const record = { ...(item as object), id: nextId++ };
          tables[table].push(record);
        }
        return true;
      }
      const record = { ...(value as object), id: nextId++ };
      tables[table].push(record);
      return record.id;
    },

    async select<T extends Table>(
      table: T,
      idOrFilter?: number | string | Partial<DataTypes[T]>,
    ): Promise<DataTypes[T] | DataTypes[T][] | null> {
      const rows = tables[table] as DataTypes[T][];

      if (idOrFilter === undefined) {
        return rows;
      }

      if (typeof idOrFilter === "number" || typeof idOrFilter === "string") {
        return (
          rows.find(
            (r) => (r as DataTypes[T] & { id: number }).id === idOrFilter,
          ) ?? null
        );
      }

      const filter = idOrFilter as Partial<DataTypes[T]>;
      const filtered = rows.filter((row) =>
        (Object.keys(filter) as (keyof DataTypes[T])[]).every(
          (key) => row[key] === filter[key],
        ),
      );
      return filtered.length > 0 ? filtered : null;
    },

    async update<T extends Table>(
      table: T,
      idOrFilter: unknown,
      value: unknown,
    ): Promise<boolean> {
      const rows = tables[table] as Record<string, unknown>[];
      const updateObj = value as Record<string, unknown>;

      if (typeof idOrFilter === "number" || typeof idOrFilter === "string") {
        const row = rows.find((r) => r.id === idOrFilter);
        if (!row) return false;
        Object.assign(row, updateObj);
        return true;
      }

      const filter = idOrFilter as Record<string, unknown>;
      let updated = false;
      for (const row of rows) {
        let matches = true;
        for (const key in filter) {
          if (row[key] !== filter[key]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          Object.assign(row, updateObj);
          updated = true;
        }
      }
      return updated;
    },

    async delete<T extends Table>(
      table: T,
      filter?: unknown,
    ): Promise<boolean> {
      if (filter === undefined) {
        tables[table] = [];
        return true;
      }
      const filterObj = filter as Record<string, unknown>;
      const before = tables[table].length;
      tables[table] = (tables[table] as Record<string, unknown>[]).filter(
        (row) => {
          for (const key in filterObj) {
            if (row[key] !== filterObj[key]) return true;
          }
          return false;
        },
      );
      return tables[table].length < before;
    },
  } as CrudInterface;
}

describe("TournamentManager", () => {
  // ── Single Elimination ──────────────────────────────────────────────────

  describe("single elimination", () => {
    it("creates bracket with correct structure for 4 players", async () => {
      const storage = createInMemoryStorage();
      const manager = new TournamentManager(storage);

      await manager.createStage(1, "single_elimination", [
        "Alice",
        "Bob",
        "Charlie",
        "Dave",
      ]);

      const data = await manager.getBracketData(1);
      expect(data.participant).toHaveLength(4);
      expect(data.stage).toHaveLength(1);
      expect(data.stage[0].type).toBe("single_elimination");
      // 4 players: 2 semis + 1 final = 3 matches
      expect(data.match).toHaveLength(3);
      expect(data.round).toHaveLength(2);
      expect(data.group).toHaveLength(1);
    });

    it("creates bracket with correct structure for 8 players", async () => {
      const storage = createInMemoryStorage();
      const manager = new TournamentManager(storage);

      const players = Array.from({ length: 8 }, (_, i) => `Player ${i + 1}`);
      await manager.createStage(1, "single_elimination", players);

      const data = await manager.getBracketData(1);
      expect(data.participant).toHaveLength(8);
      // 8 players: 4 + 2 + 1 = 7 matches
      expect(data.match).toHaveLength(7);
      expect(data.round).toHaveLength(3);
    });

    it("creates bracket for 2 players (single final)", async () => {
      const storage = createInMemoryStorage();
      const manager = new TournamentManager(storage);

      await manager.createStage(1, "single_elimination", ["Alice", "Bob"]);

      const data = await manager.getBracketData(1);
      expect(data.participant).toHaveLength(2);
      expect(data.match).toHaveLength(1);
      expect(data.round).toHaveLength(1);
    });

    it("handles BYEs correctly with non-power-of-2 participant count", async () => {
      const storage = createInMemoryStorage();
      const manager = new TournamentManager(storage);

      // 3 players — TournamentManager should auto-pad to 4 with a null BYE
      await manager.createStage(1, "single_elimination", [
        "Alice",
        "Bob",
        "Charlie",
      ]);

      const data = await manager.getBracketData(1);
      expect(data.participant).toHaveLength(3);
      // 4 slots → 3 matches (2 semis + 1 final), one BYE auto-advances
      expect(data.match).toHaveLength(3);
    });

    it("handles 5 players by padding to 8", async () => {
      const storage = createInMemoryStorage();
      const manager = new TournamentManager(storage);

      await manager.createStage(1, "single_elimination", [
        "Alice",
        "Bob",
        "Charlie",
        "Dave",
        "Eve",
      ]);

      const data = await manager.getBracketData(1);
      expect(data.participant).toHaveLength(5);
      // 8 slots → 7 matches
      expect(data.match).toHaveLength(7);
    });
  });

  // ── Match Result Recording ──────────────────────────────────────────────

  describe("recordResult", () => {
    it("records a match result with scores", async () => {
      const storage = createInMemoryStorage();
      const manager = new TournamentManager(storage);

      await manager.createStage(1, "single_elimination", ["Alice", "Bob"]);
      const data = await manager.getBracketData(1);
      const matchId = data.match[0].id as number;

      await manager.recordResult(matchId, {
        opponent1Score: 3,
        opponent2Score: 1,
      });

      const updated = await manager.getBracketData(1);
      const match = updated.match[0];
      expect(match.opponent1?.score).toBe(3);
      expect(match.opponent2?.score).toBe(1);
      expect(match.opponent1?.result).toBe("win");
      expect(match.opponent2?.result).toBe("loss");
    });

    it("advances winner to next round in single elimination", async () => {
      const storage = createInMemoryStorage();
      const manager = new TournamentManager(storage);

      await manager.createStage(1, "single_elimination", [
        "Alice",
        "Bob",
        "Charlie",
        "Dave",
      ]);

      const data = await manager.getBracketData(1);
      // Find first round matches
      const r1Matches = data.match.filter(
        (m) => m.round_id === data.round[0].id,
      );
      expect(r1Matches).toHaveLength(2);

      // Record first semi: Alice wins
      await manager.recordResult(r1Matches[0].id as number, {
        opponent1Score: 3,
        opponent2Score: 0,
      });

      // Record second semi: Dave wins
      await manager.recordResult(r1Matches[1].id as number, {
        opponent1Score: 1,
        opponent2Score: 3,
      });

      // Check the final match has the winners
      const updated = await manager.getBracketData(1);
      const finalRound = updated.round.find((r) => r.number === 2);
      const finalMatch = updated.match.find(
        (m) => m.round_id === finalRound!.id,
      );
      expect(finalMatch).toBeDefined();
      expect(finalMatch!.opponent1?.id).toBeTruthy();
      expect(finalMatch!.opponent2?.id).toBeTruthy();
    });

    it("completes a full tournament", async () => {
      const storage = createInMemoryStorage();
      const manager = new TournamentManager(storage);

      await manager.createStage(1, "single_elimination", [
        "Alice",
        "Bob",
        "Charlie",
        "Dave",
      ]);

      const data = await manager.getBracketData(1);
      const r1Matches = data.match.filter(
        (m) => m.round_id === data.round[0].id,
      );

      // Semis
      await manager.recordResult(r1Matches[0].id as number, {
        opponent1Score: 3,
        opponent2Score: 1,
      });
      await manager.recordResult(r1Matches[1].id as number, {
        opponent1Score: 2,
        opponent2Score: 3,
      });

      // Final
      const afterSemis = await manager.getBracketData(1);
      const finalRound = afterSemis.round.find((r) => r.number === 2);
      const finalMatch = afterSemis.match.find(
        (m) => m.round_id === finalRound!.id,
      );
      await manager.recordResult(finalMatch!.id as number, {
        opponent1Score: 3,
        opponent2Score: 2,
      });

      // All matches should be completed (status >= 4)
      const final = await manager.getBracketData(1);
      const allCompleted = final.match.every((m) => m.status >= 4);
      expect(allCompleted).toBe(true);
    });
  });

  // ── Round Robin ─────────────────────────────────────────────────────────

  describe("round robin", () => {
    it("creates bracket for 3 players", async () => {
      const storage = createInMemoryStorage();
      const manager = new TournamentManager(storage);

      await manager.createStage(1, "round_robin", ["Alice", "Bob", "Charlie"]);

      const data = await manager.getBracketData(1);
      expect(data.participant).toHaveLength(3);
      expect(data.stage[0].type).toBe("round_robin");
      // 3 players: 3 matches (A vs B, A vs C, B vs C)
      expect(data.match).toHaveLength(3);
    });

    it("creates bracket for 4 players", async () => {
      const storage = createInMemoryStorage();
      const manager = new TournamentManager(storage);

      await manager.createStage(1, "round_robin", [
        "Alice",
        "Bob",
        "Charlie",
        "Dave",
      ]);

      const data = await manager.getBracketData(1);
      expect(data.participant).toHaveLength(4);
      // 4 players: 6 matches (4 choose 2)
      expect(data.match).toHaveLength(6);
    });

    it("can record results in round robin", async () => {
      const storage = createInMemoryStorage();
      const manager = new TournamentManager(storage);

      await manager.createStage(1, "round_robin", ["Alice", "Bob", "Charlie"]);

      const data = await manager.getBracketData(1);

      // Record all matches
      for (const match of data.match) {
        await manager.recordResult(match.id as number, {
          opponent1Score: 3,
          opponent2Score: 1,
        });
      }

      const updated = await manager.getBracketData(1);
      const allCompleted = updated.match.every((m) => m.status >= 4);
      expect(allCompleted).toBe(true);
    });
  });

  // ── Double Elimination ──────────────────────────────────────────────────

  describe("double elimination", () => {
    it("creates bracket with winner and loser brackets", async () => {
      const storage = createInMemoryStorage();
      const manager = new TournamentManager(storage);

      await manager.createStage(1, "double_elimination", [
        "Alice",
        "Bob",
        "Charlie",
        "Dave",
      ]);

      const data = await manager.getBracketData(1);
      expect(data.participant).toHaveLength(4);
      expect(data.stage[0].type).toBe("double_elimination");
      // Double elim has winner bracket, loser bracket, and grand final groups
      expect(data.group.length).toBeGreaterThanOrEqual(2);
      // More matches than single elim (losers get second chance)
      expect(data.match.length).toBeGreaterThan(3);
    });
  });

  // ── Tournament Isolation ────────────────────────────────────────────────

  describe("tournament isolation", () => {
    it("getBracketData only returns data for the specified tournament", async () => {
      const storage = createInMemoryStorage();
      const manager = new TournamentManager(storage);

      await manager.createStage(1, "single_elimination", ["Alice", "Bob"]);
      await manager.createStage(2, "single_elimination", [
        "Charlie",
        "Dave",
        "Eve",
        "Frank",
      ]);

      const t1 = await manager.getBracketData(1);
      const t2 = await manager.getBracketData(2);

      expect(t1.participant).toHaveLength(2);
      expect(t1.match).toHaveLength(1);

      expect(t2.participant).toHaveLength(4);
      expect(t2.match).toHaveLength(3);
    });
  });

  // ── getMatches ──────────────────────────────────────────────────────────

  describe("getMatches", () => {
    it("returns only matches for the given tournament", async () => {
      const storage = createInMemoryStorage();
      const manager = new TournamentManager(storage);

      await manager.createStage(1, "single_elimination", [
        "Alice",
        "Bob",
        "Charlie",
        "Dave",
      ]);

      const matches = await manager.getMatches(1);
      expect(matches).toHaveLength(3);
    });
  });

  // ── Edge Cases ──────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("getBracketData returns empty arrays for non-existent tournament", async () => {
      const storage = createInMemoryStorage();
      const manager = new TournamentManager(storage);

      const data = await manager.getBracketData(999);
      expect(data.participant).toHaveLength(0);
      expect(data.stage).toHaveLength(0);
      expect(data.match).toHaveLength(0);
    });
  });
});
