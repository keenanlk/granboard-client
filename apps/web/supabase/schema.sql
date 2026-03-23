


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."game_results" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid",
    "game_type" "text" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "opponent_id" "uuid",
    "won" boolean NOT NULL,
    "total_darts" integer NOT NULL,
    "total_score" integer NOT NULL,
    "total_marks" integer DEFAULT 0,
    "total_rounds" integer NOT NULL,
    "ppd" double precision,
    "mpr" double precision,
    "played_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."game_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "from_id" "uuid" NOT NULL,
    "to_id" "uuid" NOT NULL,
    "room_id" "uuid" NOT NULL,
    "game_type" "text" NOT NULL,
    "game_options" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:00:30'::interval) NOT NULL,
    CONSTRAINT "invites_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."online_players" (
    "id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "status" "text" DEFAULT 'online'::"text" NOT NULL,
    "last_seen" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "online_players_status_check" CHECK (("status" = ANY (ARRAY['online'::"text", 'in_game'::"text"])))
);


ALTER TABLE "public"."online_players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "host_id" "uuid" NOT NULL,
    "guest_id" "uuid",
    "status" "text" DEFAULT 'waiting'::"text" NOT NULL,
    "game_type" "text" NOT NULL,
    "game_options" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "rooms_game_type_check" CHECK (("game_type" = ANY (ARRAY['x01'::"text", 'cricket'::"text", 'set'::"text"]))),
    CONSTRAINT "rooms_status_check" CHECK (("status" = ANY (ARRAY['waiting'::"text", 'playing'::"text", 'finished'::"text", 'abandoned'::"text"])))
);


ALTER TABLE "public"."rooms" OWNER TO "postgres";


ALTER TABLE ONLY "public"."game_results"
    ADD CONSTRAINT "game_results_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."online_players"
    ADD CONSTRAINT "online_players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_game_results_player_type" ON "public"."game_results" USING "btree" ("player_id", "game_type", "played_at" DESC);



CREATE INDEX "idx_invites_to_pending" ON "public"."invites" USING "btree" ("to_id") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_rooms_status" ON "public"."rooms" USING "btree" ("status") WHERE ("status" = ANY (ARRAY['waiting'::"text", 'playing'::"text"]));



ALTER TABLE ONLY "public"."game_results"
    ADD CONSTRAINT "game_results_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id");



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_from_id_fkey" FOREIGN KEY ("from_id") REFERENCES "public"."online_players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invites"
    ADD CONSTRAINT "invites_to_id_fkey" FOREIGN KEY ("to_id") REFERENCES "public"."online_players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."online_players"
    ADD CONSTRAINT "online_players_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "public"."online_players"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."online_players"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can read online players" ON "public"."online_players" FOR SELECT USING (true);



CREATE POLICY "Anyone can read rooms" ON "public"."rooms" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can create invites" ON "public"."invites" FOR INSERT WITH CHECK (("auth"."uid"() = "from_id"));



CREATE POLICY "Authenticated users can create rooms" ON "public"."rooms" FOR INSERT WITH CHECK (("auth"."uid"() = "host_id"));



CREATE POLICY "Invite recipients can update invite status" ON "public"."invites" FOR UPDATE USING ((("auth"."uid"() = "to_id") OR ("auth"."uid"() = "from_id")));



CREATE POLICY "Participants or joiners can update rooms" ON "public"."rooms" FOR UPDATE USING ((("auth"."uid"() = "host_id") OR ("auth"."uid"() = "guest_id") OR (("guest_id" IS NULL) AND ("status" = 'waiting'::"text"))));



CREATE POLICY "Players can read own results" ON "public"."game_results" FOR SELECT USING (("auth"."uid"() = "player_id"));



CREATE POLICY "Service role can insert results" ON "public"."game_results" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can insert their own player record" ON "public"."online_players" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can read invites sent to or from them" ON "public"."invites" FOR SELECT USING ((("auth"."uid"() = "from_id") OR ("auth"."uid"() = "to_id")));



CREATE POLICY "Users can update their own player record" ON "public"."online_players" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."game_results" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."online_players" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rooms" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."invites";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."online_players";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."rooms";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";














































































































































































GRANT ALL ON TABLE "public"."game_results" TO "anon";
GRANT ALL ON TABLE "public"."game_results" TO "authenticated";
GRANT ALL ON TABLE "public"."game_results" TO "service_role";



GRANT ALL ON TABLE "public"."invites" TO "anon";
GRANT ALL ON TABLE "public"."invites" TO "authenticated";
GRANT ALL ON TABLE "public"."invites" TO "service_role";



GRANT ALL ON TABLE "public"."online_players" TO "anon";
GRANT ALL ON TABLE "public"."online_players" TO "authenticated";
GRANT ALL ON TABLE "public"."online_players" TO "service_role";



GRANT ALL ON TABLE "public"."rooms" TO "anon";
GRANT ALL ON TABLE "public"."rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."rooms" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































