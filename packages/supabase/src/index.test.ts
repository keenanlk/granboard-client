import { describe, it, expect } from "vitest";
import type { Database, Json, Tables } from "./index.ts";

describe("supabase types", () => {
  it("Database type has public schema with tables", () => {
    // Compile-time check: if Database type is broken, this won't compile
    const _check: keyof Database["public"]["Tables"] =
      "online_players" as const;
    expect(_check).toBe("online_players");
  });

  it("Json type accepts valid JSON values", () => {
    const str: Json = "hello";
    const num: Json = 42;
    const bool: Json = true;
    const nul: Json = null;
    const obj: Json = { key: "value" };
    const arr: Json = [1, 2, 3];
    expect([str, num, bool, nul, obj, arr]).toHaveLength(6);
  });

  it("Tables type resolves to row type", () => {
    // Compile-time check: Tables<"online_players"> should resolve to the row type
    type PlayerRow = Tables<"online_players">;
    const player: PlayerRow = {
      id: "abc",
      display_name: "Test",
      last_seen: new Date().toISOString(),
      status: "online",
    };
    expect(player.id).toBe("abc");
  });
});
