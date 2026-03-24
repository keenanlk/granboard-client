import { Client } from "colyseus.js";
import type { Room } from "colyseus.js";
import { ConnectionManager } from "./ConnectionManager.ts";
import { gameEventBus } from "../events/gameEventBus.ts";
import type { GameEventMap } from "../events/GameEvents.ts";
import { logger } from "../lib/logger.ts";
import type { OnlineStoreState } from "../store/online.types.ts";

const log = logger.child({ module: "colyseus-conn" });

const rawColyseusUrl =
  (import.meta.env.VITE_COLYSEUS_URL as string | undefined) ??
  ((import.meta.env.PROD
    ? (() => {
        throw new Error("VITE_COLYSEUS_URL must be set in production");
      })()
    : `${location.protocol === "https:" ? "https" : "http"}://192.168.40.151:2567`) as string);

const COLYSEUS_URL = rawColyseusUrl.startsWith("/")
  ? `${location.origin}${rawColyseusUrl}`
  : rawColyseusUrl;

export interface ColyseusCallbacks {
  restoreState: (state: unknown) => void;
  onGameEnded?: (winner: string) => void;
  onOpponentDisconnected?: () => void;
  onTurnDelay?: () => void;
}

type StoreWriter = (partial: Partial<OnlineStoreState>) => void;

export class ColyseusConnectionManager extends ConnectionManager {
  private client: Client;
  private room: Room | null = null;
  private lastSeenSeq = 0;
  private callbacks: ColyseusCallbacks | null = null;
  private setState: StoreWriter;

  constructor(setState: StoreWriter) {
    super(3); // max 3 retries
    this.client = new Client(COLYSEUS_URL);
    this.setState = setState;
  }

  /** Bind store writer (called when store is ready). */
  bindStore(setState: StoreWriter): void {
    this.setState = setState;
  }

  /** Get the current Colyseus room (if connected). */
  getRoom(): Room | null {
    return this.room;
  }

  /** Install message handlers. Can be called to update callbacks without reconnecting. */
  installHandlers(callbacks: ColyseusCallbacks): void {
    this.callbacks = callbacks;
    if (!this.room) return;
    this.attachRoomHandlers(this.room);
  }

  /** Create a new game room (host). */
  async createRoom(
    gameType: string,
    options: {
      gameOptions: unknown;
      playerNames: string[];
      playerIds: (string | null)[];
      roomId?: string;
    },
  ): Promise<Room> {
    this.lastSeenSeq = 0;
    const room = await this.client.create(gameType, options);
    this.room = room;
    this.resetReconnect();
    this.attachRoomHandlers(room);
    this.setState({ colyseusPhase: "connected" });
    log.info({ roomId: room.roomId }, "Room created");
    return room;
  }

  /** Join an existing room by ID (guest). */
  async joinRoom(roomId: string): Promise<Room> {
    this.lastSeenSeq = 0;
    const room = await this.client.joinById(roomId);
    this.room = room;
    this.resetReconnect();
    this.attachRoomHandlers(room);
    this.setState({ colyseusPhase: "connected" });
    log.info({ roomId: room.roomId }, "Room joined");
    return room;
  }

  /** Request current state from server. */
  requestState(): void {
    this.lastSeenSeq = 0;
    this.room?.send("request_state", {});
  }

  /** Send a message to the room. */
  send(type: string, data: unknown = {}): void {
    if (!this.room) {
      log.warn({ type }, "No room for send");
      return;
    }
    this.room.send(type, data);
  }

  /** Leave the current room gracefully. */
  async leave(): Promise<void> {
    if (this.room) {
      log.info({ roomId: this.room.roomId }, "Leaving room");
      try {
        await this.room.leave();
      } catch {
        // Already left or disconnected
      }
      this.room = null;
    }
    this.lastSeenSeq = 0;
    this.setState({ colyseusPhase: "disconnected" });
  }

  private attachRoomHandlers(room: Room): void {
    room.removeAllListeners();

    room.onMessage(
      "state_update",
      (payload: { state: unknown; seq: number }) => {
        if (payload.seq <= this.lastSeenSeq) return;
        // Seq gap detection
        if (this.lastSeenSeq > 0 && payload.seq > this.lastSeenSeq + 1) {
          log.warn(
            { expected: this.lastSeenSeq + 1, got: payload.seq },
            "Seq gap detected",
          );
        }
        this.lastSeenSeq = payload.seq;
        this.callbacks?.restoreState(payload.state);
      },
    );

    room.onMessage(
      "game_event",
      (payload: { eventName: keyof GameEventMap; data: never }) => {
        gameEventBus.emit(payload.eventName, payload.data);
      },
    );

    room.onMessage("turn_delay", () => {
      this.callbacks?.onTurnDelay?.();
    });

    room.onMessage("game_ended", (payload: { winner: string }) => {
      this.callbacks?.onGameEnded?.(payload.winner);
    });

    room.onMessage("player_left", () => {
      this.callbacks?.onOpponentDisconnected?.();
    });

    // Next leg messages
    room.onMessage("next_leg_request", () => {
      const s = this.setState;
      // Read nextLegPhase from whatever the store says
      s({ nextLegPhase: "opponent_ready" });
    });

    room.onMessage("next_leg_accept", () => {
      this.setState({ nextLegPhase: "accepted" });
    });

    // Rematch messages via Colyseus (server-relayed)
    room.onMessage("rematch_request", () => {
      this.setState({ rematchPhase: "received" });
    });

    room.onMessage("rematch_accept", () => {
      this.setState({ rematchPhase: "accepted" });
    });

    room.onMessage("rematch_decline", () => {
      this.setState({ rematchPhase: "declined" });
    });

    room.onLeave((code: number) => {
      log.info({ code, roomId: room.roomId }, "Room onLeave");
      if (code === 1000 || code === 4000) {
        // Normal close
        this.room = null;
        this.setState({ colyseusPhase: "disconnected" });
      } else {
        // Abnormal close — try to reconnect
        this.setState({ colyseusPhase: "reconnecting" });
        this.attemptReconnect(room);
      }
    });
  }

  private attemptReconnect(oldRoom: Room): void {
    const scheduled = this.scheduleReconnect(async () => {
      try {
        log.info(
          { attempt: this.reconnectAttempts, roomId: oldRoom.roomId },
          "Attempting reconnect",
        );
        const newRoom = await this.client.reconnect(oldRoom.reconnectionToken);
        this.room = newRoom;
        this.resetReconnect();
        this.attachRoomHandlers(newRoom);
        this.setState({ colyseusPhase: "connected" });
        // Request fresh state
        this.requestState();
        log.info({ roomId: newRoom.roomId }, "Reconnected");
      } catch (err) {
        log.warn({ err, attempt: this.reconnectAttempts }, "Reconnect failed");
        if (this.reconnectAttempts < this.maxRetries) {
          this.attemptReconnect(oldRoom);
        } else {
          this.room = null;
          this.setState({ colyseusPhase: "error" });
        }
      }
    });

    if (!scheduled) {
      this.room = null;
      this.setState({ colyseusPhase: "error" });
    }
  }

  override cleanup(): void {
    if (this.room) {
      try {
        this.room.leave();
      } catch {
        // Already disconnected
      }
      this.room = null;
    }
    this.lastSeenSeq = 0;
    this.callbacks = null;
    super.cleanup();
  }
}
