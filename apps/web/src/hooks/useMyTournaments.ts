import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabaseClient.ts";
import type { Tournament } from "@nlc-darts/tournament";

interface MyTournamentEntry {
  tournament: Tournament;
  role: "organiser" | "player";
  registeredAt: string;
}

interface MyTournamentsState {
  upcoming: MyTournamentEntry[];
  past: MyTournamentEntry[];
  loading: boolean;
  error: string | null;
}

async function fetchMyTournaments(
  userId: string,
  signal: AbortSignal,
  setState: React.Dispatch<React.SetStateAction<MyTournamentsState>>,
) {
  setState((s) => ({ ...s, loading: true, error: null }));

  // Fetch tournaments the user registered for
  const { data: registrations, error: regError } = await supabase
    .from("tournament_registrations")
    .select("tournament_id, registered_at")
    .eq("user_id", userId);

  if (signal.aborted) return;

  if (regError) {
    setState((s) => ({
      ...s,
      loading: false,
      error: regError.message,
    }));
    return;
  }

  const tournamentIds = (registrations ?? []).map(
    (r: { tournament_id: string }) => r.tournament_id,
  );

  // Also fetch tournaments the user created (they might not have registered)
  const { data: created } = await supabase
    .from("tournaments")
    .select("id")
    .eq("created_by", userId);

  if (signal.aborted) return;

  const createdIds = (created ?? []).map((t: { id: string }) => t.id);

  const allIds = [...new Set([...tournamentIds, ...createdIds])];
  if (allIds.length === 0) {
    setState({ upcoming: [], past: [], loading: false, error: null });
    return;
  }

  const { data: tournaments, error: tErr } = await supabase
    .from("tournaments")
    .select("*")
    .in("id", allIds)
    .order("created_at", { ascending: false });

  if (signal.aborted) return;

  if (tErr) {
    setState((s) => ({ ...s, loading: false, error: tErr.message }));
    return;
  }

  const regMap = new Map(
    (registrations ?? []).map(
      (r: { tournament_id: string; registered_at: string }) => [
        r.tournament_id,
        r.registered_at,
      ],
    ),
  );

  const entries: MyTournamentEntry[] = (tournaments ?? []).map(
    (row: Record<string, unknown>) => ({
      tournament: {
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
      },
      role:
        (row.created_by as string) === userId
          ? ("organiser" as const)
          : ("player" as const),
      registeredAt: regMap.get(row.id as string) ?? (row.created_at as string),
    }),
  );

  const upcoming = entries.filter(
    (e) =>
      e.tournament.status === "registration" ||
      e.tournament.status === "in_progress",
  );
  const past = entries.filter(
    (e) =>
      e.tournament.status === "completed" ||
      e.tournament.status === "cancelled",
  );

  setState({ upcoming, past, loading: false, error: null });
}

export function useMyTournaments(userId: string | null) {
  const [state, setState] = useState<MyTournamentsState>({
    upcoming: [],
    past: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    void fetchMyTournaments(userId, controller.signal, setState);
    return () => {
      controller.abort();
    };
  }, [userId]);

  const refresh = useCallback(() => {
    if (!userId) return;
    const controller = new AbortController();
    void fetchMyTournaments(userId, controller.signal, setState);
  }, [userId]);

  return { ...state, refresh };
}
