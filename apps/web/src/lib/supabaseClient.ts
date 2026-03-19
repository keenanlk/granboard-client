import { createClient } from "@supabase/supabase-js";
import { logger } from "./logger.ts";

const log = logger.child({ module: "supabase" });

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  log.warn({}, "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — online features disabled");
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
