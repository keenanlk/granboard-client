import { useCallback, useEffect, useRef, useState } from "react";
import { Client } from "colyseus.js";
import type { Room } from "colyseus.js";
import { gameEventBus } from "../events/gameEventBus.ts";
import type { GameEventMap } from "../events/GameEvents.ts";
import type { OnlineConfig } from "../store/useOnlineStore.ts";
import { logger } from "../lib/logger.ts";

const log = logger.child({ module: "colyseus" });

const rawColyseusUrl =
  (import.meta.env.VITE_COLYSEUS_URL as string | undefined) ??
  ((import.meta.env.PROD
    ? (() => {
        throw new Error("VITE_COLYSEUS_URL must be set in production");
      })()
    : `${location.protocol === "https:" ? "https" : "http"}://192.168.40.151:2567`) as string);

// Support relative proxy paths (e.g. "/colyseus-proxy") by resolving to absolute URL
const COLYSEUS_URL = rawColyseusUrl.startsWith("/")
  ? `${location.origin}${rawColyseusUrl}`
  : rawColyseusUrl;

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

// Module-level callback refs — survive component remounts so handlers
// registered once keep pointing to the *current* component's callbacks.
let lastSeenSeq = 0;
const cbRefs = {
  restore: null as ((state: unknown) => void) | null,
  gameEnded: null as ((winner: string) => void) | undefined | null,
  disconnect: null as (() => void) | undefined | null,
  turnDelay: null as (() => void) | undefined | null,
};

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

  // Keep module-level refs pointing to the current component's callbacks
  cbRefs.restore = restoreState;
  cbRefs.gameEnded = onGameEnded;
  cbRefs.disconnect = onOpponentDisconnected;
  cbRefs.turnDelay = onTurnDelay;

  const isHost = onlineConfig?.isHost;
  const colyseusRoomId = onlineConfig?.colyseusRoomId;

  useEffect(() => {
    if (!onlineConfig) return;

    function installHandlers(r: Room) {
      r.onMessage(
        "state_update",
        (payload: { state: unknown; seq: number }) => {
          if (payload.seq <= lastSeenSeq) return;
          lastSeenSeq = payload.seq;
          log.debug({ seq: payload.seq }, "State update received");
          cbRefs.restore?.(payload.state);
        },
      );

      r.onMessage(
        "game_event",
        (payload: { eventName: keyof GameEventMap; data: never }) => {
          gameEventBus.emit(payload.eventName, payload.data);
        },
      );

      r.onMessage("turn_delay", () => {
        cbRefs.turnDelay?.();
      });

      r.onMessage("game_ended", (payload: { winner: string }) => {
        cbRefs.gameEnded?.(payload.winner);
      });

      r.onMessage("player_left", () => {
        cbRefs.disconnect?.();
      });
    }

    // If we already have an active room for this config, reuse it.
    // Handlers are already installed — just reset seq and request fresh state.
    if (activeRoom && activeRoomId === (colyseusRoomId ?? "host")) {
      roomRef.current = activeRoom;
      lastSeenSeq = 0;
      activeRoom.send("request_state", {});
      queueMicrotask(() => setConnectedRoom(activeRoom));
      return;
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

        activeRoom = room;
        activeRoomId = colyseusRoomId ?? "host";
        roomRef.current = room;
        setConnectedRoom(room);
        installHandlers(room);
        room.send("request_state", {});
        log.info({ roomId: room.roomId }, "Room connected");
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
