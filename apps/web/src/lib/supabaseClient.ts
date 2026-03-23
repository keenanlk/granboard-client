import { createClient } from "@supabase/supabase-js";
import { logger } from "./logger.ts";

const log = logger.child({ module: "supabase" });

const rawUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
// Support relative proxy paths (e.g. "/supabase-proxy") by resolving to absolute URL
const supabaseUrl = rawUrl?.startsWith("/")
  ? `${location.origin}${rawUrl}`
  : rawUrl;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  log.warn(
    {},
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — online features disabled",
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
