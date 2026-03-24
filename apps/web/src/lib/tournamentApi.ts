import { supabase } from "./supabaseClient.ts";
import type { Json } from "@nlc-darts/supabase";
import type { CreateTournamentData } from "../screens/CreateTournamentScreen.tsx";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const MAX_RETRIES = 3;

function generateCode(): string {
  let code = "";
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARS[bytes[i] % CHARS.length];
  }
  return code;
}

async function generateUniqueJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = generateCode();
    const { data } = await supabase
      .from("tournaments")
      .select("id")
      .eq("join_code", code)
      .maybeSingle();
    if (!data) return code;
  }
  throw new Error("Failed to generate unique join code");
}

export async function ensureOnlinePlayer(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) {
    console.error("[ensureOnlinePlayer] no authenticated session");
    return null;
  }

  // Check if the row already exists
  const { data: existing } = await supabase
    .from("online_players")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) return userId;

  // Row doesn't exist — insert it
  const meta = session?.user?.user_metadata;
  const displayName =
    localStorage.getItem("nlc-online-name") ??
    (meta?.full_name as string | undefined) ??
    "Player";
  const avatarUrl = (meta?.avatar_url as string | undefined) ?? null;
  const { error } = await supabase.from("online_players").insert({
    id: userId,
    display_name: displayName,
    avatar_url: avatarUrl,
    status: "online",
    last_seen: new Date().toISOString(),
  });
  if (error) {
    // 23505 = already exists (race condition) — that's fine
    if (error.code === "23505") return userId;
    console.error("[ensureOnlinePlayer] insert failed:", error);
    return null;
  }

  // Verify the row actually exists (RLS can silently block inserts)
  const { data: verify } = await supabase
    .from("online_players")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (!verify) {
    console.error(
      "[ensureOnlinePlayer] row not created — RLS may be blocking. userId:",
      userId,
      "auth.uid:",
      session?.user?.id,
    );
    return null;
  }
  return userId;
}

export async function createOnlineTournament(
  data: CreateTournamentData,
): Promise<{ id: string; joinCode: string } | null> {
  // Ensure the user has an online_players row (FK requirement)
  const confirmedId = await ensureOnlinePlayer();
  if (!confirmedId) return null;

  const joinCode = await generateUniqueJoinCode();

  const { data: tournament, error } = await supabase
    .from("tournaments")
    .insert({
      name: data.name,
      format: data.format,
      visibility: data.visibility,
      status: "registration",
      join_code: joinCode,
      created_by: confirmedId,
      scheduled_at: data.scheduledAt ?? null,
      registration_deadline: data.registrationDeadline ?? null,
      max_participants: data.maxParticipants ?? null,
      game_settings: data.gameSettings as unknown as Json,
    })
    .select("id, join_code")
    .single();

  if (error) {
    console.error("Failed to create tournament:", error.message);
    return null;
  }

  // Auto-register the organiser
  await supabase.from("tournament_registrations").insert({
    tournament_id: tournament.id,
    user_id: confirmedId,
  });

  return { id: tournament.id, joinCode: tournament.join_code };
}
