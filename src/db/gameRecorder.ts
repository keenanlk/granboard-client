import { dbSaveSession, type GameSessionRecord, type RecordedDart, type RoundRecord } from "./db.ts";

export type { RecordedDart };

export class GameRecorder {
  private rounds: RoundRecord[] = [];
  private roundCounters: number[];

  constructor(
    private gameType: "x01" | "cricket" | "highscore",
    private playerNames: string[],
    private playerIds: (string | null)[],
    private options: unknown,
  ) {
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
      id: crypto.randomUUID(),
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
