import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { CreateSegment } from "@nlc-darts/engine";
import type { Segment, SegmentID } from "@nlc-darts/engine";
import type { OnlineConfig } from "../store/online.types.ts";
import { supabase } from "../lib/supabaseClient.ts";
import { gameEventBus } from "../events/gameEventBus.ts";
import type { GameEventMap } from "../events/GameEvents.ts";

/** Game events that should be forwarded to the remote player for LED/sound effects */
const FORWARDED_EVENTS: (keyof GameEventMap)[] = [
  "dart_hit",
  "bust",
  "game_won",
  "next_turn",
  "open_numbers",
];

/** Options for the {@link useOnlineSync} hook. */
export interface UseOnlineSyncOptions {
  /** Pass null/undefined for offline games — hook becomes a no-op */
  onlineConfig: OnlineConfig | null | undefined;
  getSerializableState: () => unknown;
  restoreState: (state: unknown) => void;
  onRemoteDartHit?: (segment: Segment) => void;
  onRemoteUndo?: () => void;
  onRemoteNextTurn?: () => void;
  onGameEnded?: (winners: string[]) => void;
  onOpponentDisconnected?: () => void;
  /** Remote: called when host starts the between-turn delay */
  onTurnDelay?: () => void;
}

/**
 * Core online sync hook — always safe to call (no-op when onlineConfig is null).
 *
 * Host mode: Listens for dart_hit / action_request messages from remote, and
 * exposes broadcastState() to send full state after each mutation.
 * Also forwards game events (LED/sound triggers) to the remote.
 *
 * Remote mode: Listens for state_update messages and calls restoreState().
 * Also re-emits forwarded game events on the local event bus.
 */
export function useOnlineSync({
  onlineConfig,
  getSerializableState,
  restoreState,
  onRemoteDartHit,
  onRemoteUndo,
  onRemoteNextTurn,
  onGameEnded,
  onOpponentDisconnected,
  onTurnDelay,
}: UseOnlineSyncOptions) {
  const seqRef = useRef(0);
  const lastSeenSeqRef = useRef(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const getStateRef = useRef(getSerializableState);
  const restoreRef = useRef(restoreState);
  const onRemoteDartRef = useRef(onRemoteDartHit);
  const onRemoteUndoRef = useRef(onRemoteUndo);
  const onRemoteNextTurnRef = useRef(onRemoteNextTurn);
  const onGameEndedRef = useRef(onGameEnded);
  const onDisconnectRef = useRef(onOpponentDisconnected);
  const onTurnDelayRef = useRef(onTurnDelay);
  useEffect(() => {
    getStateRef.current = getSerializableState;
    restoreRef.current = restoreState;
    onRemoteDartRef.current = onRemoteDartHit;
    onRemoteUndoRef.current = onRemoteUndo;
    onRemoteNextTurnRef.current = onRemoteNextTurn;
    onGameEndedRef.current = onGameEnded;
    onDisconnectRef.current = onOpponentDisconnected;
    onTurnDelayRef.current = onTurnDelay;
  });

  function broadcastState() {
    const channel = channelRef.current;
    if (!channel || !onlineConfig?.isHost) return;

    seqRef.current += 1;
    const state = getStateRef.current();
    channel.send({
      type: "broadcast",
      event: "state_update",
      payload: { state, seq: seqRef.current },
    });
  }

  /** Host calls this when the between-turn delay starts so remote shows its own countdown */
  function broadcastTurnDelay() {
    const channel = channelRef.current;
    if (!channel || !onlineConfig?.isHost) return;
    channel.send({
      type: "broadcast",
      event: "turn_delay",
      payload: {},
    });
  }

  const roomId = onlineConfig?.roomId;
  const isHost = onlineConfig?.isHost;

  // Host: forward local game events to remote for LED/sound effects
  useEffect(() => {
    if (!roomId || !isHost) return;

    const unsubs = FORWARDED_EVENTS.map((eventName) =>
      gameEventBus.on(eventName, ((payload: unknown) => {
        const channel = channelRef.current;
        if (!channel) return;
        channel.send({
          type: "broadcast",
          event: "game_event",
          payload: { eventName, data: payload },
        });
      }) as never),
    );

    return () => unsubs.forEach((unsub) => unsub());
  }, [roomId, isHost]);

  useEffect(() => {
    if (!roomId) return; // offline — no-op

    let channel: RealtimeChannel | null = null;
    channel = supabase.channel(`room:${roomId}`);
    channel.subscribe();
    channelRef.current = channel;

    if (isHost) {
      channel.on(
        "broadcast",
        { event: "dart_hit" },
        ({ payload }: { payload: { segment: Segment } }) => {
          const seg = CreateSegment(payload.segment.ID as SegmentID);
          onRemoteDartRef.current?.(seg);
        },
      );

      channel.on(
        "broadcast",
        { event: "action_request" },
        ({ payload }: { payload: { action: string } }) => {
          if (payload.action === "undo") {
            onRemoteUndoRef.current?.();
          } else if (payload.action === "next_turn") {
            onRemoteNextTurnRef.current?.();
          }
        },
      );
    } else {
      channel.on(
        "broadcast",
        { event: "state_update" },
        ({ payload }: { payload: { state: unknown; seq: number } }) => {
          if (payload.seq <= lastSeenSeqRef.current) return;
          lastSeenSeqRef.current = payload.seq;
          restoreRef.current(payload.state);
        },
      );

      channel.on(
        "broadcast",
        { event: "game_ended" },
        ({ payload }: { payload: { winners: string[] } }) => {
          onGameEndedRef.current?.(payload.winners);
        },
      );

      channel.on("broadcast", { event: "turn_delay" }, () => {
        onTurnDelayRef.current?.();
      });

      // Re-emit game events from host on local event bus for LED/sound effects
      channel.on(
        "broadcast",
        { event: "game_event" },
        ({
          payload,
        }: {
          payload: { eventName: keyof GameEventMap; data: never };
        }) => {
          gameEventBus.emit(payload.eventName, payload.data);
        },
      );
    }

    channel.on("broadcast", { event: "player_left" }, () => {
      onDisconnectRef.current?.();
    });

    return () => {
      channelRef.current = null;
    };
  }, [roomId, isHost]);

  return { broadcastState, broadcastTurnDelay, isOnline: !!onlineConfig };
}
