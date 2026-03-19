import type {
  Segment,
  CricketOptions,
  CricketState,
} from "@nlc-darts/engine";
import {
  cricketEngine,
  CRICKET_TARGETS,
  DEFAULT_CRICKET_OPTIONS,
} from "@nlc-darts/engine";
import { ServerMessage } from "../messages.js";
import { BaseGameRoom } from "./BaseGameRoom.js";

export class CricketRoom extends BaseGameRoom<CricketState, CricketOptions> {
  protected engine = cricketEngine;

  protected parseOptions(raw: unknown): CricketOptions {
    if (raw && typeof raw === "object") {
      return {
        ...DEFAULT_CRICKET_OPTIONS,
        ...(raw as Partial<CricketOptions>),
      };
    }
    return DEFAULT_CRICKET_OPTIONS;
  }

  protected emitGameEvents(state: CricketState, segment: Segment): void {
    // Get the last thrown dart's effective marks for the event
    const lastDart = state.currentRoundDarts.at(-1);
    const effectiveMarks = lastDart?.effectiveMarks ?? 0;

    // Dart hit event
    this.broadcast(ServerMessage.GAME_EVENT, {
      eventName: "dart_hit",
      data: { segment, effectiveMarks },
    });

    // Emit open numbers after each dart
    this.emitOpenNumbers(state);

    // Game won event
    if (state.winner) {
      this.broadcast(ServerMessage.GAME_EVENT, {
        eventName: "game_won",
        data: { playerName: state.winner },
      });
    }
  }

  protected override onTurnChanged(): void {
    this.emitOpenNumbers(this.gameState);
  }

  private emitOpenNumbers(state: CricketState): void {
    const openNumbers = CRICKET_TARGETS.filter(
      (t) => !state.players.every((p) => p.marks[t] >= 3),
    );
    this.broadcast(ServerMessage.GAME_EVENT, {
      eventName: "open_numbers",
      data: { numbers: openNumbers },
    });
  }
}
