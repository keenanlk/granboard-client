import type { Segment } from "@nlc-darts/engine";
import type { GameController } from "./GameController.ts";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Controller used by the remote (non-host) player in online mode.
 * Instead of mutating local game state, it sends messages to the host
 * via the Supabase room channel. The host processes all darts and
 * broadcasts state updates back.
 */
export class OnlineRemoteController implements GameController {
  channel: RealtimeChannel;

  constructor(channel: RealtimeChannel) {
    this.channel = channel;
  }

  onDartHit(segment: Segment): void {
    this.channel.send({
      type: "broadcast",
      event: "dart_hit",
      payload: {
        segment: {
          ID: segment.ID,
          Type: segment.Type,
          Section: segment.Section,
          Value: segment.Value,
          LongName: segment.LongName,
          ShortName: segment.ShortName,
        },
      },
    });
  }

  onNextTurn(): void {
    this.channel.send({
      type: "broadcast",
      event: "action_request",
      payload: { action: "next_turn" },
    });
  }

  sendUndo(): void {
    this.channel.send({
      type: "broadcast",
      event: "action_request",
      payload: { action: "undo" },
    });
  }
}
