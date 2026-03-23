import { supabase } from "./supabaseClient.ts";
import {
  computeX01Grade,
  computeCricketGrade,
  ROLLING_WINDOW,
  MIN_GAMES_FOR_GRADE,
} from "@nlc-darts/engine";
import type { Grade } from "@nlc-darts/engine";

export interface OnlinePlayerStats {
  x01: { grade: Grade | null; ppd: number; games: number };
  cricket: { grade: Grade | null; mpr: number; games: number };
}

const EMPTY_STATS: OnlinePlayerStats = {
  x01: { grade: null, ppd: 0, games: 0 },
  cricket: { grade: null, mpr: 0, games: 0 },
};

export async function fetchPlayerStats(
  playerId: string,
): Promise<OnlinePlayerStats> {
  const [x01Result, cricketResult] = await Promise.all([
    supabase
      .from("game_results")
      .select("total_score, total_darts")
      .eq("player_id", playerId)
      .eq("game_type", "x01")
      .order("played_at", { ascending: false })
      .limit(ROLLING_WINDOW),
    supabase
      .from("game_results")
      .select("total_marks, total_rounds")
      .eq("player_id", playerId)
      .eq("game_type", "cricket")
      .order("played_at", { ascending: false })
      .limit(ROLLING_WINDOW),
  ]);

  const x01Rows = x01Result.data ?? [];
  const cricketRows = cricketResult.data ?? [];

  const x01Games = x01Rows.length;
  const totalScore = x01Rows.reduce((sum, r) => sum + (r.total_score ?? 0), 0);
  const totalDarts = x01Rows.reduce((sum, r) => sum + (r.total_darts ?? 0), 0);
  const avgPpd = totalDarts > 0 ? totalScore / totalDarts : 0;

  const cricketGames = cricketRows.length;
  const totalMarks = cricketRows.reduce((sum, r) => sum + (r.total_marks ?? 0), 0);
  const totalRounds = cricketRows.reduce((sum, r) => sum + (r.total_rounds ?? 0), 0);
  const avgMpr = totalRounds > 0 ? totalMarks / totalRounds : 0;

  return {
    x01: {
      grade: x01Games >= MIN_GAMES_FOR_GRADE ? computeX01Grade(avgPpd) : null,
      ppd: Math.round(avgPpd * 10) / 10,
      games: x01Games,
    },
    cricket: {
      grade:
        cricketGames >= MIN_GAMES_FOR_GRADE
          ? computeCricketGrade(avgMpr)
          : null,
      mpr: Math.round(avgMpr * 100) / 100,
      games: cricketGames,
    },
  };
}

export { EMPTY_STATS };
