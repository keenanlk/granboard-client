import type { Segment } from "@nlc-darts/engine";
import type { GameController } from "./GameController.ts";
import type { Room } from "colyseus.js";

/**
 * Controller used by BOTH players in online mode (host and guest).
 * With Colyseus, both players send actions to the server — the host's
 * only distinction is creating the room. The server owns all game state.
 */
export class ColyseusRemoteController implements GameController {
  private room: Room;

  constructor(room: Room) {
    this.room = room;
  }

  onDartHit(segment: Segment): void {
    this.room.send("dart_hit", { segmentId: segment.ID });
  }

  onNextTurn(): void {
    this.room.send("next_turn", {});
  }

  sendUndo(): void {
    this.room.send("undo", {});
  }
}
