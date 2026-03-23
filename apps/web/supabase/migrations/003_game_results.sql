-- Game results table for tracking per-player stats from online games
CREATE TABLE game_results (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     uuid REFERENCES rooms(id),
  game_type   text NOT NULL,
  player_id   uuid NOT NULL,
  opponent_id uuid,
  won         boolean NOT NULL,
  total_darts integer NOT NULL,
  total_score integer NOT NULL,
  total_marks integer DEFAULT 0,
  total_rounds integer NOT NULL,
  ppd         float,
  mpr         float,
  played_at   timestamptz DEFAULT now()
);

CREATE INDEX idx_game_results_player_type ON game_results(player_id, game_type, played_at DESC);

-- RLS: players can read their own results, service role can insert
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can read own results"
  ON game_results FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "Service role can insert results"
  ON game_results FOR INSERT
  WITH CHECK (true);
