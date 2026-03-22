import { createClient } from "@supabase/supabase-js";
import { logger } from "./lib/logger.js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.warn(
    {},
    "Supabase credentials not configured — result recording disabled",
  );
}

/** Supabase admin client using the service-role key, or null when credentials are missing. */
export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;
