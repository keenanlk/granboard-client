import type { Segment, X01Options, X01State } from "@nlc-darts/engine";
import { x01Engine, DEFAULT_X01_OPTIONS } from "@nlc-darts/engine";
import { ServerMessage } from "../messages.js";
import { BaseGameRoom } from "./BaseGameRoom.js";

export class X01Room extends BaseGameRoom<X01State, X01Options> {
  protected engine = x01Engine;

  protected parseOptions(raw: unknown): X01Options {
    if (raw && typeof raw === "object") {
      return { ...DEFAULT_X01_OPTIONS, ...(raw as Partial<X01Options>) };
    }
    return DEFAULT_X01_OPTIONS;
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
