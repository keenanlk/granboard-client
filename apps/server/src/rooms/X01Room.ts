import type { Segment, X01Options, X01State } from "@nlc-darts/engine";
import { x01Engine, DEFAULT_X01_OPTIONS } from "@nlc-darts/engine";
import { ServerMessage } from "../messages.js";
import { BaseGameRoom } from "./BaseGameRoom.js";

/** Colyseus room for X01 (301/501/etc.) dart games. */
export class X01Room extends BaseGameRoom<X01State, X01Options> {
  protected engine = x01Engine;

  protected parseOptions(raw: unknown): X01Options {
    if (raw && typeof raw === "object") {
      const r = raw as Record<string, unknown>;
      const VALID_SCORES = [301, 501, 701];
      return {
        startingScore: VALID_SCORES.includes(r.startingScore as number)
          ? (r.startingScore as 301 | 501 | 701)
          : DEFAULT_X01_OPTIONS.startingScore,
        splitBull:
          typeof r.splitBull === "boolean"
            ? r.splitBull
            : DEFAULT_X01_OPTIONS.splitBull,
        doubleOut:
          typeof r.doubleOut === "boolean"
            ? r.doubleOut
            : DEFAULT_X01_OPTIONS.doubleOut,
        masterOut:
          typeof r.masterOut === "boolean"
            ? r.masterOut
            : DEFAULT_X01_OPTIONS.masterOut,
        doubleIn:
          typeof r.doubleIn === "boolean"
            ? r.doubleIn
            : DEFAULT_X01_OPTIONS.doubleIn,
      };
    }
    return DEFAULT_X01_OPTIONS;
  }

  protected get gameTypeName(): string {
    return "x01";
  }

  protected extractPlayerGameStats(
    state: X01State,
    playerIndex: number,
  ): {
    totalDarts: number;
    totalScore: number;
    totalMarks: number;
    totalRounds: number;
  } {
    const player = state.players[playerIndex];
    const totalDarts = player.totalDartsThrown;
    // Total score = sum of all round scores (points scored toward the target)
    let totalScore = player.rounds.reduce((sum, r) => sum + r.score, 0);
    let totalRounds = player.rounds.length;

    // Include unflushed current round (nextTurn hasn't been called yet at game end)
    if (
      state.currentPlayerIndex === playerIndex &&
      state.currentRoundDarts.length > 0
    ) {
      totalScore += state.turnStartScores[playerIndex] - player.score;
      totalRounds += 1;
    }

    return {
      totalDarts,
      totalScore,
      totalMarks: 0, // Not applicable for X01
      totalRounds,
    };
  }

  protected emitGameEvents(state: X01State, segment: Segment): void {
    // Dart hit event
    this.broadcast(ServerMessage.GAME_EVENT, {
      eventName: "dart_hit",
      data: { segment },
    });

    // Bust event
    if (state.isBust) {
      this.broadcast(ServerMessage.GAME_EVENT, {
        eventName: "bust",
        data: {},
      });
    }

    // Game won event
    if (state.winner) {
      this.broadcast(ServerMessage.GAME_EVENT, {
        eventName: "game_won",
        data: { playerName: state.winner },
      });
    }
  }
}
