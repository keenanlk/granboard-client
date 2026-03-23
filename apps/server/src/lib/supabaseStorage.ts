import type { SupabaseClient } from "@supabase/supabase-js";
import type { CrudInterface, DataTypes, Table } from "@nlc-darts/tournament";

const TABLE_MAP: Record<Table, string> = {
  participant: "tournament_participants",
  stage: "tournament_stages",
  group: "tournament_groups",
  round: "tournament_rounds",
  match: "tournament_matches",
  match_game: "tournament_match_games",
};

// Uses an untyped SupabaseClient because this adapter dynamically maps
// bracket-manager table names → Supabase table names at runtime.
export function createSupabaseStorage(client: SupabaseClient): CrudInterface {
  return {
    async insert<T extends Table>(
      table: T,
      value: unknown,
    ): Promise<number | boolean> {
      const supaTable = TABLE_MAP[table];

      if (Array.isArray(value)) {
        const { error } = await client.from(supaTable).insert(value);
        if (error)
          throw new Error(`Insert into ${supaTable} failed: ${error.message}`);
        return true;
      }

      const { data, error } = await client
        .from(supaTable)
        .insert(value as Record<string, unknown>)
        .select("id")
        .single();
      if (error)
        throw new Error(`Insert into ${supaTable} failed: ${error.message}`);
      return data.id as number;
    },

    async select<T extends Table>(
      table: T,
      idOrFilter?: number | string | Partial<DataTypes[T]>,
    ): Promise<DataTypes[T] | DataTypes[T][] | null> {
      const supaTable = TABLE_MAP[table];

      if (idOrFilter === undefined) {
        const { data, error } = await client.from(supaTable).select("*");
        if (error)
          throw new Error(`Select from ${supaTable} failed: ${error.message}`);
        return (data as DataTypes[T][]) ?? null;
      }

      if (typeof idOrFilter === "number" || typeof idOrFilter === "string") {
        const { data, error } = await client
          .from(supaTable)
          .select("*")
          .eq("id", idOrFilter)
          .single();
        if (error) {
          if (error.code === "PGRST116") return null;
          throw new Error(`Select from ${supaTable} failed: ${error.message}`);
        }
        return data as DataTypes[T];
      }

      let query = client.from(supaTable).select("*");
      for (const [key, val] of Object.entries(idOrFilter)) {
        if (val !== undefined) {
          if (val !== null && typeof val === "object" && !Array.isArray(val)) {
            query = query.contains(key, val);
          } else {
            query = query.eq(key, val);
          }
        }
      }
      const { data, error } = await query;
      if (error)
        throw new Error(`Select from ${supaTable} failed: ${error.message}`);
      return data && data.length > 0 ? (data as DataTypes[T][]) : null;
    },

    async update<T extends Table>(
      table: T,
      idOrFilter: number | string | Partial<DataTypes[T]>,
      value: DataTypes[T] | Partial<DataTypes[T]>,
    ): Promise<boolean> {
      const supaTable = TABLE_MAP[table];

      if (typeof idOrFilter === "number" || typeof idOrFilter === "string") {
        const { error } = await client
          .from(supaTable)
          .update(value as Record<string, unknown>)
          .eq("id", idOrFilter);
        if (error)
          throw new Error(`Update ${supaTable} failed: ${error.message}`);
        return true;
      }

      let query = client
        .from(supaTable)
        .update(value as Record<string, unknown>);
      for (const [key, val] of Object.entries(idOrFilter)) {
        if (val !== undefined) {
          query = query.eq(key, val);
        }
      }
      const { error } = await query;
      if (error)
        throw new Error(`Update ${supaTable} failed: ${error.message}`);
      return true;
    },

    async delete<T extends Table>(
      table: T,
      filter?: Partial<DataTypes[T]>,
    ): Promise<boolean> {
      const supaTable = TABLE_MAP[table];

      if (filter === undefined) {
        const { error } = await client.from(supaTable).delete().gte("id", 0);
        if (error)
          throw new Error(`Delete from ${supaTable} failed: ${error.message}`);
        return true;
      }

      let query = client.from(supaTable).delete();
      for (const [key, val] of Object.entries(filter)) {
        if (val !== undefined) {
          query = query.eq(key, val);
        }
      }
      const { error } = await query;
      if (error)
        throw new Error(`Delete from ${supaTable} failed: ${error.message}`);
      return true;
    },
  } as CrudInterface;
}
