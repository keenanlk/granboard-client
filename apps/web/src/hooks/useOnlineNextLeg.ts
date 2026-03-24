import { useCallback, useEffect, useRef, useState } from "react";
import type { Room } from "colyseus.js";

export type NextLegState = "idle" | "sent" | "opponent_ready" | "accepted";

/**
 * Coordinates a "Next Leg" handshake between two players in the same
 * Colyseus game room. Both players must click "Next Leg" before the
 * game resets for the next leg.
 */
export function useOnlineNextLeg(room: Room | null) {
  const [state, setState] = useState<NextLegState>("idle");
  const listenersAttached = useRef(false);

  useEffect(() => {
    if (!room || listenersAttached.current) return;
    listenersAttached.current = true;

    room.onMessage("next_leg_request", () => {
      setState((s) => (s === "sent" ? "accepted" : "opponent_ready"));
    });

    room.onMessage("next_leg_accept", () => {
      setState("accepted");
    });
  }, [room]);

  const requestNextLeg = useCallback(() => {
    if (!room) return;
    setState((prev) => {
      if (prev === "opponent_ready") {
        room.send("next_leg_accept", {});
        return "accepted";
      }
      room.send("next_leg_request", {});
      return "sent";
    });
  }, [room]);

  const reset = useCallback(() => {
    setState("idle");
  }, []);

  return { nextLegState: state, requestNextLeg, resetNextLeg: reset };
}
