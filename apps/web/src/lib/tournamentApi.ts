import { supabase } from "./supabaseClient.ts";
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

export async function createOnlineTournament(
  data: CreateTournamentData,
  userId: string,
): Promise<{ id: string; joinCode: string } | null> {
  const joinCode = await generateUniqueJoinCode();

  const { data: tournament, error } = await supabase
    .from("tournaments")
    .insert({
      name: data.name,
      format: data.format,
      visibility: data.visibility,
      status: "registration",
      join_code: joinCode,
      created_by: userId,
      scheduled_at: data.scheduledAt ?? null,
      registration_deadline: data.registrationDeadline ?? null,
      max_participants: data.maxParticipants ?? null,
      game_settings: data.gameSettings,
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
    user_id: userId,
  });

  return { id: tournament.id, joinCode: tournament.join_code };
}
