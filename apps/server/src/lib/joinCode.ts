import type { SupabaseClient } from "@supabase/supabase-js";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 to avoid confusion
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

/**
 * Generates a unique 6-character join code.
 * Checks for collisions against the `tournaments` table and retries up to 3 times.
 */
export async function generateJoinCode(
  supabase: SupabaseClient,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = generateCode();
    const { data } = await supabase
      .from("tournaments")
      .select("id")
      .eq("join_code", code)
      .maybeSingle();

    if (!data) return code;
  }

  throw new Error(
    `Failed to generate unique join code after ${MAX_RETRIES} attempts`,
  );
}
