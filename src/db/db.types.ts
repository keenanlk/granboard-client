export interface PlayerRecord {
  id: string;
  name: string;
  createdAt: number;
}

export interface RecordedDart {
  value: number;
  shortName: string;
  scored?: boolean; // x01: whether the dart counted
  marksEarned?: number; // cricket: raw marks from this dart
}

export interface RoundRecord {
  playerIndex: number;
  playerName: string;
  playerId: string | null;
  round: number;
  darts: RecordedDart[];
  roundScore: number;
}

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

export interface X01Stats {
  gamesPlayed: number;
  wins: number;
  ppd: number; // points per dart
  avgRound: number; // average 3-dart score
  bestRound: number; // best single round score
}

export interface CricketStats {
  gamesPlayed: number;
  wins: number;
  mpr: number; // marks per round
  avgRoundScore: number; // average points scored per round
}

export interface HighScoreStats {
  gamesPlayed: number;
  wins: number;
  avgScore: number; // avg final game score
  bestScore: number; // best single game score
  avgRound: number; // avg round score
  bestRound: number; // best single round
}

export interface PlayerStats {
  x01: X01Stats;
  cricket: CricketStats;
  highscore: HighScoreStats;
  totalGames: number;
  totalWins: number;
}
