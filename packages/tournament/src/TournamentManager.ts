import { BracketsManager } from "brackets-manager";
import type { CrudInterface, Database } from "brackets-manager";
import type { InputStage, Seeding } from "brackets-model";
import type { TournamentFormat, MatchResult } from "./types.ts";

/** Maps our format names to brackets-manager StageType (they're the same strings). */
const FORMAT_TO_STAGE_TYPE: Record<TournamentFormat, InputStage["type"]> = {
  single_elimination: "single_elimination",
  double_elimination: "double_elimination",
  round_robin: "round_robin",
};

function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Pads a seeding list with null BYEs to the next power of two.
 * Required by brackets-manager for elimination formats.
 */
function padSeeding(names: string[]): Seeding {
  const size = nextPowerOfTwo(names.length);
  const seeding: Seeding = [...names];
  while (seeding.length < size) seeding.push(null);
  return seeding;
}

export class TournamentManager {
  private manager: BracketsManager;

  constructor(storage: CrudInterface) {
    this.manager = new BracketsManager(storage);
  }

  /**
   * Creates bracket structure for a tournament.
   * Participants must already be inserted into storage before calling this.
   *
   * @param tournamentId - The tournament_id used by brackets-manager (can be number or string).
   * @param format - Tournament format.
   * @param participantNames - Ordered list of participant names (seeding order).
   */
  async createStage(
    tournamentId: number | string,
    format: TournamentFormat,
    participantNames: string[],
  ): Promise<void> {
    const isElimination = format !== "round_robin";
    const seeding: Seeding = isElimination
      ? padSeeding(participantNames)
      : participantNames;

    await this.manager.create.stage({
      tournamentId,
      name: "Main",
      type: FORMAT_TO_STAGE_TYPE[format],
      seeding,
      settings: {
        size: isElimination
          ? nextPowerOfTwo(participantNames.length)
          : undefined,
        grandFinal: format === "double_elimination" ? "simple" : undefined,
        balanceByes: true,
        groupCount: format === "round_robin" ? 1 : undefined,
      },
    });
  }

  /**
   * Records the result of a match.
   */
  async recordResult(matchId: number, result: MatchResult): Promise<void> {
    await this.manager.update.match({
      id: matchId,
      opponent1: {
        score: result.opponent1Score,
        result: result.opponent1Score > result.opponent2Score ? "win" : "loss",
      },
      opponent2: {
        score: result.opponent2Score,
        result: result.opponent2Score > result.opponent1Score ? "win" : "loss",
      },
    });
  }

  /**
   * Gets the full bracket data for a tournament.
   */
  async getBracketData(tournamentId: number | string): Promise<Database> {
    // Export all data, then filter to this tournament
    const data = await this.manager.export();
    return {
      participant: data.participant.filter(
        (p) => p.tournament_id === tournamentId,
      ),
      stage: data.stage.filter((s) => s.tournament_id === tournamentId),
      group: data.group.filter((g) =>
        data.stage.some(
          (s) => s.id === g.stage_id && s.tournament_id === tournamentId,
        ),
      ),
      round: data.round.filter((r) =>
        data.stage.some(
          (s) => s.id === r.stage_id && s.tournament_id === tournamentId,
        ),
      ),
      match: data.match.filter((m) =>
        data.stage.some(
          (s) => s.id === m.stage_id && s.tournament_id === tournamentId,
        ),
      ),
      match_game: data.match_game.filter((mg) =>
        data.stage.some(
          (s) => s.id === mg.stage_id && s.tournament_id === tournamentId,
        ),
      ),
    };
  }

  /**
   * Gets all matches for a tournament.
   */
  async getMatches(tournamentId: number | string): Promise<Database["match"]> {
    const data = await this.getBracketData(tournamentId);
    return data.match;
  }

  /**
   * Gets the underlying BracketsManager for advanced operations.
   */
  get brackets(): BracketsManager {
    return this.manager;
  }
}
