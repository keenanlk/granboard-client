import { useCallback, useEffect, useRef, useState } from "react";
import { Client } from "colyseus.js";
import type { Room } from "colyseus.js";
import { gameEventBus } from "../events/gameEventBus.ts";
import type { GameEventMap } from "../events/GameEvents.ts";
import type { OnlineConfig } from "../store/useOnlineStore.ts";
import { logger } from "../lib/logger.ts";

const log = logger.child({ module: "colyseus" });

const COLYSEUS_URL =
  (import.meta.env.VITE_COLYSEUS_URL as string) ?? "http://localhost:2567";

/** Module-level room storage — survives StrictMode re-renders */
let pendingRoom: Room | null = null;

/** Store a pre-created Colyseus room so the hook can adopt it instead of creating a new one. */
export function setPendingColyseusRoom(room: Room) {
  pendingRoom = room;
}

/** Options for the {@link useColyseusSync} hook. */
interface UseColyseusSyncOptions {
  onlineConfig: OnlineConfig | null | undefined;
  restoreState: (state: unknown) => void;
  onGameEnded?: (winner: string) => void;
  onOpponentDisconnected?: () => void;
  onTurnDelay?: () => void;
}

/** Return value from the {@link useColyseusSync} hook. */
interface UseColyseusSyncReturn {
  room: Room | null;
  sendDart: (segmentId: number) => void;
  sendNextTurn: () => void;
  sendUndo: () => void;
  isOnline: boolean;
}

/** Tracks which room ID we've already connected to */
let activeRoomId: string | null = null;
let activeRoom: Room | null = null;
let connectingTo: string | null = null; // guards async joinById
let cleanupTimer: ReturnType<typeof setTimeout> | null = null;

/** Manages a Colyseus room connection for online multiplayer state sync. */
export function useColyseusSync({
  onlineConfig,
  restoreState,
  onGameEnded,
  onOpponentDisconnected,
  onTurnDelay,
}: UseColyseusSyncOptions): UseColyseusSyncReturn {
  const [connectedRoom, setConnectedRoom] = useState<Room | null>(null);
  const roomRef = useRef<Room | null>(null);
  const lastSeenSeqRef = useRef(0);

  const restoreRef = useRef(restoreState);
  const onGameEndedRef = useRef(onGameEnded);
  const onDisconnectRef = useRef(onOpponentDisconnected);
  const onTurnDelayRef = useRef(onTurnDelay);
  useEffect(() => {
    restoreRef.current = restoreState;
    onGameEndedRef.current = onGameEnded;
    onDisconnectRef.current = onOpponentDisconnected;
    onTurnDelayRef.current = onTurnDelay;
  });

  const isHost = onlineConfig?.isHost;
  const colyseusRoomId = onlineConfig?.colyseusRoomId;

  useEffect(() => {
    if (!onlineConfig) return;

    function setupHandlersOnRoom(r: Room) {
      r.onMessage(
        "state_update",
        (payload: { state: unknown; seq: number }) => {
          if (payload.seq <= lastSeenSeqRef.current) return;
          lastSeenSeqRef.current = payload.seq;
          log.debug({ seq: payload.seq }, "State update received");
          restoreRef.current(payload.state);
        },
      );

      r.onMessage(
        "game_event",
        (payload: { eventName: keyof GameEventMap; data: never }) => {
          gameEventBus.emit(payload.eventName, payload.data);
        },
      );

      r.onMessage("turn_delay", () => {
        onTurnDelayRef.current?.();
      });

      r.onMessage("game_ended", (payload: { winner: string }) => {
        onGameEndedRef.current?.(payload.winner);
      });

      r.onMessage("player_left", () => {
        onDisconnectRef.current?.();
      });

      // Request fresh state now that handlers are registered
      r.send("request_state", {});
    }

    // If we already have an active room for this config, reuse but re-register handlers
    if (activeRoom && activeRoomId === (colyseusRoomId ?? "host")) {
      roomRef.current = activeRoom;
      setupHandlersOnRoom(activeRoom);
      queueMicrotask(() => setConnectedRoom(activeRoom));
      return;
    }

    function setupRoomHandlers(r: Room) {
      activeRoom = r;
      activeRoomId = colyseusRoomId ?? "host";
      roomRef.current = r;
      setConnectedRoom(r);
      setupHandlersOnRoom(r);
      log.info({ roomId: r.roomId }, "Room connected");
    }

    async function connect() {
      const connectId = colyseusRoomId ?? "host";
      // Prevent duplicate async connections (StrictMode race)
      if (connectingTo === connectId || activeRoomId === connectId) return;
      connectingTo = connectId;

      try {
        let room: Room | null = null;

        if (isHost) {
          // Host: reuse the room created in App.tsx
          if (pendingRoom) {
            room = pendingRoom;
            pendingRoom = null;
          } else {
            // Fallback: create new room
            const client = new Client(COLYSEUS_URL);
            room = await client.create(onlineConfig.gameType!, {
              gameOptions: onlineConfig.gameOptions,
              playerNames: onlineConfig.playerNames,
              playerIds: onlineConfig.playerIds,
              roomId: onlineConfig.roomId,
            });
          }
        } else if (colyseusRoomId) {
          // Guest: join the specific room the host created
          const client = new Client(COLYSEUS_URL);
          room = await client.joinById(colyseusRoomId);
        }

        if (!room) return;
        // Always set up handlers — even if StrictMode set disposed=true,
        // the room connection is real and needs handlers
        setupRoomHandlers(room);
      } catch (err) {
        connectingTo = null;
        log.error({ err }, "Connection failed");
      }
    }

    connect();

    return undefined;
  }, [onlineConfig, isHost, colyseusRoomId]);

  // Deferred cleanup: schedule leave on unmount, cancel on remount (StrictMode)
  useEffect(() => {
    if (cleanupTimer !== null) {
      clearTimeout(cleanupTimer);
      cleanupTimer = null;
    }
    return () => {
      cleanupTimer = setTimeout(() => {
        if (activeRoom) {
          log.info({ roomId: activeRoom.roomId }, "Leaving room");
          activeRoom.leave();
          activeRoom = null;
          activeRoomId = null;
          connectingTo = null;
        }
        cleanupTimer = null;
      }, 200);
    };
  }, []);

  const sendDart = useCallback((segmentId: number) => {
    roomRef.current?.send("dart_hit", { segmentId });
  }, []);

  const sendNextTurn = useCallback(() => {
    roomRef.current?.send("next_turn", {});
  }, []);

  const sendUndo = useCallback(() => {
    roomRef.current?.send("undo", {});
  }, []);

  return {
    room: connectedRoom,
    sendDart,
    sendNextTurn,
    sendUndo,
    isOnline: !!onlineConfig,
  };
}
