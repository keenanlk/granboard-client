import { useEffect, useRef, useState } from "react";
import type { OnlineConfig } from "../store/useOnlineStore.ts";
import { useOnlineStore } from "../store/useOnlineStore.ts";

export type RematchState =
  | "idle"
  | "sent" // local player requested, waiting for response
  | "received" // opponent requested, show accept/decline
  | "accepted" // both agreed — trigger rematch
  | "declined"; // someone declined — both go to lobby

/**
 * Manages the online rematch handshake via the room broadcast channel.
 * Returns the current rematch state and actions.
 */
export function useOnlineRematch(onlineConfig: OnlineConfig | undefined) {
  const [state, setState] = useState<RematchState>("idle");
  const channelSetup = useRef(false);

  useEffect(() => {
    if (!onlineConfig || channelSetup.current) return;
    const { roomChannel } = useOnlineStore.getState();
    if (!roomChannel) return;
    channelSetup.current = true;

    roomChannel.on("broadcast", { event: "rematch_request" }, () => {
      setState((s) => (s === "sent" ? "accepted" : "received"));
    });

    roomChannel.on("broadcast", { event: "rematch_accept" }, () => {
      setState("accepted");
    });

    roomChannel.on("broadcast", { event: "rematch_decline" }, () => {
      setState("declined");
    });
  }, [onlineConfig]);

  function requestRematch() {
    const { roomChannel } = useOnlineStore.getState();
    if (!roomChannel) return;
    roomChannel.send({
      type: "broadcast",
      event: "rematch_request",
      payload: {},
    });
    setState("sent");
  }

  function acceptRematch() {
    const { roomChannel } = useOnlineStore.getState();
    if (!roomChannel) return;
    roomChannel.send({
      type: "broadcast",
      event: "rematch_accept",
      payload: {},
    });
    setState("accepted");
  }

  function declineRematch() {
    const { roomChannel } = useOnlineStore.getState();
    if (!roomChannel) return;
    roomChannel.send({
      type: "broadcast",
      event: "rematch_decline",
      payload: {},
    });
    setState("declined");
  }

  return { rematchState: state, requestRematch, acceptRematch, declineRematch };
}
