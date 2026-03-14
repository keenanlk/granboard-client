import type { GameSessionRecord } from "./db.ts";

export interface X01Stats {
  gamesPlayed: number;
  wins: number;
  ppd: number;       // points per dart
  avgRound: number;  // average 3-dart score
  bestRound: number; // best single round score
}

export interface CricketStats {
  gamesPlayed: number;
  wins: number;
  mpr: number;          // marks per round
  avgRoundScore: number; // average points scored per round
}

export interface HighScoreStats {
  gamesPlayed: number;
  wins: number;
  avgScore: number;  // avg final game score
  bestScore: number; // best single game score
  avgRound: number;  // avg round score
  bestRound: number; // best single round
}

export interface PlayerStats {
  x01: X01Stats;
  cricket: CricketStats;
  highscore: HighScoreStats;
  totalGames: number;
  totalWins: number;
}

export function computePlayerStats(sessions: GameSessionRecord[], playerId: string): PlayerStats {
  const x01Sessions = sessions.filter(
    (s) => s.gameType === "x01" && s.participants.some((p) => p.playerId === playerId),
  );
  const cricketSessions = sessions.filter(
    (s) => s.gameType === "cricket" && s.participants.some((p) => p.playerId === playerId),
  );
  const highscoreSessions = sessions.filter(
    (s) => s.gameType === "highscore" && s.participants.some((p) => p.playerId === playerId),
  );

  const x01Wins = x01Sessions.filter((s) =>
    s.participants.some((p) => p.playerId === playerId && p.isWinner),
  ).length;
  const x01Rounds = x01Sessions.flatMap((s) => s.rounds.filter((r) => r.playerId === playerId));
  const x01TotalDarts = x01Rounds.reduce((sum, r) => sum + r.darts.length, 0);
  const x01TotalPoints = x01Rounds.reduce((sum, r) => sum + r.roundScore, 0);
  const x01RoundScores = x01Rounds.map((r) => r.roundScore);

  const cricketWins = cricketSessions.filter((s) =>
    s.participants.some((p) => p.playerId === playerId && p.isWinner),
  ).length;
  const cricketRounds = cricketSessions.flatMap((s) =>
    s.rounds.filter((r) => r.playerId === playerId),
  );
  const cricketTotalMarks = cricketRounds.reduce(
    (sum, r) => sum + r.darts.reduce((ds, d) => ds + (d.marksEarned ?? 0), 0),
    0,
  );
  const cricketTotalPoints = cricketRounds.reduce((sum, r) => sum + r.roundScore, 0);

  const highscoreWins = highscoreSessions.filter((s) =>
    s.participants.some((p) => p.playerId === playerId && p.isWinner),
  ).length;
  const highscoreRounds = highscoreSessions.flatMap((s) =>
    s.rounds.filter((r) => r.playerId === playerId),
  );
  const highscoreRoundScores = highscoreRounds.map((r) => r.roundScore);
  const highscoreFinalScores = highscoreSessions.map(
    (s) => s.participants.find((p) => p.playerId === playerId)?.finalScore ?? 0,
  );

  const totalGames = x01Sessions.length + cricketSessions.length + highscoreSessions.length;
  const totalWins = x01Wins + cricketWins + highscoreWins;

  return {
    totalGames,
    totalWins,
    x01: {
      gamesPlayed: x01Sessions.length,
      wins: x01Wins,
      ppd: x01TotalDarts > 0 ? x01TotalPoints / x01TotalDarts : 0,
      avgRound: x01Rounds.length > 0 ? x01TotalPoints / x01Rounds.length : 0,
      bestRound: x01RoundScores.length > 0 ? Math.max(...x01RoundScores) : 0,
    },
    cricket: {
      gamesPlayed: cricketSessions.length,
      wins: cricketWins,
      mpr: cricketRounds.length > 0 ? cricketTotalMarks / cricketRounds.length : 0,
      avgRoundScore: cricketRounds.length > 0 ? cricketTotalPoints / cricketRounds.length : 0,
    },
    highscore: {
      gamesPlayed: highscoreSessions.length,
      wins: highscoreWins,
      avgScore:
        highscoreFinalScores.length > 0
          ? highscoreFinalScores.reduce((a, b) => a + b, 0) / highscoreFinalScores.length
          : 0,
      bestScore: highscoreFinalScores.length > 0 ? Math.max(...highscoreFinalScores) : 0,
      avgRound:
        highscoreRounds.length > 0
          ? highscoreRoundScores.reduce((a, b) => a + b, 0) / highscoreRounds.length
          : 0,
      bestRound: highscoreRoundScores.length > 0 ? Math.max(...highscoreRoundScores) : 0,
    },
  };
}
