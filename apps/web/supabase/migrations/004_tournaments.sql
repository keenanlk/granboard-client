-- ─────────────────────────────────────────────────────────────────────────────
-- 004_tournaments.sql — Tournament support tables
-- ─────────────────────────────────────────────────────────────────────────────

-- Tournaments (organiser-created, schedulable)
CREATE TABLE IF NOT EXISTS "public"."tournaments" (
    "id"                    uuid DEFAULT gen_random_uuid() NOT NULL,
    "name"                  text NOT NULL,
    "format"                text NOT NULL,
    "visibility"            text NOT NULL DEFAULT 'public',
    "status"                text NOT NULL DEFAULT 'registration',
    "join_code"             char(6) NOT NULL,
    "created_by"            uuid NOT NULL,
    "scheduled_at"          timestamp with time zone,
    "registration_deadline" timestamp with time zone,
    "max_participants"      integer,
    "game_settings"         jsonb,
    "created_at"            timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tournaments_join_code_key" UNIQUE ("join_code"),
    CONSTRAINT "tournaments_format_check" CHECK (format = ANY (ARRAY['single_elimination','double_elimination','round_robin'])),
    CONSTRAINT "tournaments_visibility_check" CHECK (visibility = ANY (ARRAY['public','private'])),
    CONSTRAINT "tournaments_status_check" CHECK (status = ANY (ARRAY['registration','in_progress','completed','cancelled'])),
    CONSTRAINT "tournaments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."online_players"("id") ON DELETE CASCADE
);

-- Who has registered for each tournament
CREATE TABLE IF NOT EXISTS "public"."tournament_registrations" (
    "id"            uuid DEFAULT gen_random_uuid() NOT NULL,
    "tournament_id" uuid NOT NULL,
    "user_id"       uuid NOT NULL,
    "registered_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "tournament_registrations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tournament_registrations_unique" UNIQUE ("tournament_id", "user_id"),
    CONSTRAINT "tournament_registrations_tournament_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE,
    CONSTRAINT "tournament_registrations_user_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."online_players"("id") ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- brackets-manager tables
-- Integer serial PKs to match brackets-manager's internal ID expectations.
-- Written exclusively by Colyseus via supabaseAdmin (service role bypasses RLS).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "public"."tournament_participants" (
    "id"            serial NOT NULL,
    "tournament_id" uuid NOT NULL,
    "name"          text NOT NULL,
    CONSTRAINT "tournament_participants_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tournament_participants_tournament_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."tournament_stages" (
    "id"            serial NOT NULL,
    "tournament_id" uuid NOT NULL,
    "name"          text NOT NULL,
    "type"          text NOT NULL,
    "number"        integer NOT NULL,
    "settings"      jsonb,
    CONSTRAINT "tournament_stages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tournament_stages_tournament_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."tournament_groups" (
    "id"       serial NOT NULL,
    "stage_id" integer NOT NULL,
    "number"   integer NOT NULL,
    CONSTRAINT "tournament_groups_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tournament_groups_stage_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."tournament_stages"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."tournament_rounds" (
    "id"       serial NOT NULL,
    "stage_id" integer NOT NULL,
    "group_id" integer NOT NULL,
    "number"   integer NOT NULL,
    CONSTRAINT "tournament_rounds_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tournament_rounds_group_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."tournament_groups"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."tournament_matches" (
    "id"          serial NOT NULL,
    "stage_id"    integer NOT NULL,
    "group_id"    integer NOT NULL,
    "round_id"    integer NOT NULL,
    "number"      integer NOT NULL,
    "child_count" integer NOT NULL DEFAULT 0,
    "opponent1"   jsonb,
    "opponent2"   jsonb,
    "status"      integer NOT NULL DEFAULT 0,
    CONSTRAINT "tournament_matches_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tournament_matches_group_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."tournament_groups"("id") ON DELETE CASCADE,
    CONSTRAINT "tournament_matches_round_fkey" FOREIGN KEY ("round_id") REFERENCES "public"."tournament_rounds"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "public"."tournament_match_games" (
    "id"        serial NOT NULL,
    "stage_id"  integer NOT NULL,
    "parent_id" integer NOT NULL,
    "number"    integer NOT NULL,
    "opponent1" jsonb,
    "opponent2" jsonb,
    "status"    integer NOT NULL DEFAULT 0,
    CONSTRAINT "tournament_match_games_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tournament_match_games_parent_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."tournament_matches"("id") ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX "idx_tournaments_visibility_status" ON "public"."tournaments" ("visibility", "status");
CREATE INDEX "idx_tournaments_join_code"          ON "public"."tournaments" ("join_code");
CREATE INDEX "idx_tournament_registrations_user"  ON "public"."tournament_registrations" ("user_id");
CREATE INDEX "idx_tournament_registrations_tid"   ON "public"."tournament_registrations" ("tournament_id");
CREATE INDEX "idx_tournament_participants_tid"     ON "public"."tournament_participants" ("tournament_id");
CREATE INDEX "idx_tournament_stages_tid"           ON "public"."tournament_stages" ("tournament_id");
CREATE INDEX "idx_tournament_matches_group"        ON "public"."tournament_matches" ("group_id");
CREATE INDEX "idx_tournament_matches_round"        ON "public"."tournament_matches" ("round_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants (match existing pattern)
-- ─────────────────────────────────────────────────────────────────────────────

GRANT ALL ON TABLE "public"."tournaments"              TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."tournament_registrations" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."tournament_participants"  TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."tournament_stages"        TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."tournament_groups"        TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."tournament_rounds"        TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."tournament_matches"       TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."tournament_match_games"   TO "anon", "authenticated", "service_role";

-- Grant usage on serial sequences so service_role can insert
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA "public" TO "anon", "authenticated", "service_role";

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "public"."tournaments"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tournament_registrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tournament_participants"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tournament_stages"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tournament_groups"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tournament_rounds"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tournament_matches"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tournament_match_games"   ENABLE ROW LEVEL SECURITY;

-- Tournaments: public ones readable by anyone; organiser can always read their own
CREATE POLICY "Public tournaments readable" ON "public"."tournaments"
    FOR SELECT USING (visibility = 'public' OR created_by = auth.uid());

-- Tournaments: authenticated users can create
CREATE POLICY "Authenticated can create tournaments" ON "public"."tournaments"
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Tournaments: organiser can update their own
CREATE POLICY "Organiser can update own tournament" ON "public"."tournaments"
    FOR UPDATE USING (created_by = auth.uid());

-- Registrations: users can read all registrations for tournaments they can see
CREATE POLICY "Read registrations" ON "public"."tournament_registrations"
    FOR SELECT USING (true);

-- Registrations: users can insert their own
CREATE POLICY "Insert own registration" ON "public"."tournament_registrations"
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Registrations: users can delete their own
CREATE POLICY "Delete own registration" ON "public"."tournament_registrations"
    FOR DELETE USING (user_id = auth.uid());

-- Bracket tables: read-only from client; writes go through Colyseus (service role bypasses RLS)
CREATE POLICY "Bracket participants readable" ON "public"."tournament_participants" FOR SELECT USING (true);
CREATE POLICY "Bracket stages readable"      ON "public"."tournament_stages"       FOR SELECT USING (true);
CREATE POLICY "Bracket groups readable"      ON "public"."tournament_groups"       FOR SELECT USING (true);
CREATE POLICY "Bracket rounds readable"      ON "public"."tournament_rounds"       FOR SELECT USING (true);
CREATE POLICY "Bracket matches readable"     ON "public"."tournament_matches"      FOR SELECT USING (true);
CREATE POLICY "Bracket match games readable" ON "public"."tournament_match_games"  FOR SELECT USING (true);
