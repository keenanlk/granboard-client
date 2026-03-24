import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabaseClient.ts";
import { ensureOnlinePlayer } from "../lib/tournamentApi.ts";
import type { Tournament, TournamentFilters } from "@nlc-darts/tournament";

const PAGE_SIZE = 20;

interface DiscoverState {
  tournaments: Tournament[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
}

async function fetchPage(
  offset: number,
  replace: boolean,
  activeFilters: TournamentFilters,
  signal: AbortSignal,
  setState: React.Dispatch<React.SetStateAction<DiscoverState>>,
) {
  setState((s) => ({ ...s, loading: true, error: null }));

  let query = supabase
    .from("tournaments")
    .select("*")
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (activeFilters.format) query = query.eq("format", activeFilters.format);
  if (activeFilters.status) query = query.eq("status", activeFilters.status);
  if (activeFilters.search)
    query = query.ilike("name", `%${activeFilters.search}%`);

  const { data, error } = await query;

  if (signal.aborted) return;

  if (error) {
    setState((s) => ({
      ...s,
      loading: false,
      error: error.message,
    }));
    return;
  }

  const mapped = (data ?? []).map(mapTournament);
  setState((s) => ({
    tournaments: replace ? mapped : [...s.tournaments, ...mapped],
    loading: false,
    hasMore: (data?.length ?? 0) === PAGE_SIZE,
    error: null,
  }));
}

export function useDiscoverTournaments() {
  const [filters, setFilters] = useState<TournamentFilters>({});
  const [state, setState] = useState<DiscoverState>({
    tournaments: [],
    loading: false,
    hasMore: true,
    error: null,
  });

  // Reset and fetch when filters change
  useEffect(() => {
    const controller = new AbortController();
    void fetchPage(0, true, filters, controller.signal, setState);
    return () => {
      controller.abort();
    };
  }, [filters]);

  const loadMore = useCallback(() => {
    const controller = new AbortController();
    void fetchPage(
      state.tournaments.length,
      false,
      filters,
      controller.signal,
      setState,
    );
  }, [state.tournaments.length, filters]);

  const refresh = useCallback(() => {
    const controller = new AbortController();
    void fetchPage(0, true, filters, controller.signal, setState);
  }, [filters]);

  return {
    ...state,
    filters,
    setFilters,
    loadMore,
    refresh,
  };
}

export async function findTournamentByCode(
  code: string,
): Promise<Tournament | null> {
  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("join_code", code.toUpperCase())
    .maybeSingle();

  if (error || !data) return null;
  return mapTournament(data);
}

export async function registerForTournament(
  tournamentId: string,
): Promise<boolean> {
  // Ensure the user has an online_players row (FK requirement).
  // Tournament registration can happen without going through the lobby flow.
  const userId = await ensureOnlinePlayer();
  if (!userId) return false;

  const { error } = await supabase
    .from("tournament_registrations")
    .insert({ tournament_id: tournamentId, user_id: userId });
  // 23505 = already registered (unique constraint conflict) — treat as success
  if (error && error.code === "23505") return true;
  return !error;
}

export async function unregisterFromTournament(
  tournamentId: string,
  userId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("tournament_registrations")
    .delete()
    .eq("tournament_id", tournamentId)
    .eq("user_id", userId);
  return !error;
}

function mapTournament(row: Record<string, unknown>): Tournament {
  return {
    id: row.id as string,
    name: row.name as string,
    format: row.format as Tournament["format"],
    visibility: row.visibility as Tournament["visibility"],
    status: row.status as Tournament["status"],
    joinCode: row.join_code as string,
    createdBy: row.created_by as string,
    scheduledAt: (row.scheduled_at as string) ?? null,
    registrationDeadline: (row.registration_deadline as string) ?? null,
    maxParticipants: (row.max_participants as number) ?? null,
    createdAt: row.created_at as string,
    gameSettings: (row.game_settings as Tournament["gameSettings"]) ?? null,
  };
}
