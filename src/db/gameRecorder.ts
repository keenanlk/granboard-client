import { dbSaveSession } from "./db.ts";
import type {
  GameSessionRecord,
  RecordedDart,
  RoundRecord,
} from "./db.types.ts";

export class GameRecorder {
  private rounds: RoundRecord[] = [];
  private roundCounters: number[];
  private gameType: "x01" | "cricket" | "highscore" | "atw" | "tictactoe";
  private playerNames: string[];
  private playerIds: (string | null)[];
  private options: unknown;

  constructor(
    gameType: "x01" | "cricket" | "highscore" | "atw" | "tictactoe",
    playerNames: string[],
    playerIds: (string | null)[],
    options: unknown,
  ) {
    this.gameType = gameType;
    this.playerNames = playerNames;
    this.playerIds = playerIds;
    this.options = options;
    this.roundCounters = playerNames.map(() => 0);
  }

  /** Call this before nextTurn() — captures the just-completed round for a player. */
  recordRound(playerIndex: number, darts: RecordedDart[], roundScore: number) {
    this.roundCounters[playerIndex]++;
    this.rounds.push({
      playerIndex,
      playerName: this.playerNames[playerIndex],
      playerId: this.playerIds[playerIndex],
      round: this.roundCounters[playerIndex],
      darts,
      roundScore,
    });
  }

  /** Call when the game ends. Only writes to DB if at least one named player is in the game. */
  async save(winnerNames: string[], finalScores: number[]): Promise<void> {
    const hasNamedPlayer = this.playerIds.some((id) => id !== null);
    if (!hasNamedPlayer) return;

    const session: GameSessionRecord = {
      id:
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      gameType: this.gameType,
      playedAt: Date.now(),
      options: this.options,
      participants: this.playerNames.map((name, i) => ({
        playerId: this.playerIds[i],
        name,
        finalScore: finalScores[i],
        isWinner: winnerNames.includes(name),
      })),
      rounds: this.rounds,
    };

    await dbSaveSession(session);
  }
}
