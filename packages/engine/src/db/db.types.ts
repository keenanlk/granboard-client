/** A stored player profile. */
export interface PlayerRecord {
  id: string;
  name: string;
  createdAt: number;
}

/** A single dart as persisted in game history. */
export interface RecordedDart {
  value: number;
  shortName: string;
  scored?: boolean; // x01: whether the dart counted
  marksEarned?: number; // cricket: raw marks from this dart
}

/** A persisted round containing darts and score for one player turn. */
export interface RoundRecord {
  playerIndex: number;
  playerName: string;
  playerId: string | null;
  round: number;
  darts: RecordedDart[];
  roundScore: number;
}

/** A complete persisted game session with participants and round history. */
export interface GameSessionRecord {
  id: string;
  gameType: "x01" | "cricket" | "highscore" | "atw" | "tictactoe";
  playedAt: number;
  options: unknown;
  participants: {
    playerId: string | null;
    name: string;
    finalScore: number;
    isWinner: boolean;
  }[];
  rounds: RoundRecord[];
}

/** Aggregated statistics for a player's X01 game history. */
export interface X01Stats {
  gamesPlayed: number;
  wins: number;
  ppd: number; // points per dart
  avgRound: number; // average 3-dart score
  bestRound: number; // best single round score
}

/** Aggregated statistics for a player's Cricket game history. */
export interface CricketStats {
  gamesPlayed: number;
  wins: number;
  mpr: number; // marks per round
  avgRoundScore: number; // average points scored per round
}

/** Aggregated statistics for a player's High Score game history. */
export interface HighScoreStats {
  gamesPlayed: number;
  wins: number;
  avgScore: number; // avg final game score
  bestScore: number; // best single game score
  avgRound: number; // avg round score
  bestRound: number; // best single round
}

/** Combined per-game-type statistics and overall totals for a player. */
export interface PlayerStats {
  x01: X01Stats;
  cricket: CricketStats;
  highscore: HighScoreStats;
  totalGames: number;
  totalWins: number;
}
