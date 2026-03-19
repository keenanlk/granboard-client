import { Room } from "@colyseus/core";
import type { Client } from "@colyseus/core";
import type { GameEngine, Segment } from "@nlc-darts/engine";
import { CreateSegment } from "@nlc-darts/engine";
import type { SegmentID } from "@nlc-darts/engine";
import { ClientMessage, ServerMessage } from "../messages.js";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { logger } from "../lib/logger.js";
import type { Logger } from "@nlc-darts/logger";

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const RECONNECT_ALLOWANCE_MS = 30 * 1000; // 30 seconds
const UNDO_CAP = 12;

interface RoomCreateOptions {
  gameOptions: unknown;
  playerNames: string[];
  playerIds: (string | null)[];
  roomId?: string; // Supabase room ID for recording results
}

/**
 * Abstract base for all game rooms.
 * Concrete subclasses provide the engine and game-specific helpers.
 */
export abstract class BaseGameRoom<
  TState extends { currentPlayerIndex: number; winner: string | null },
  TOptions,
> extends Room {
  protected abstract engine: GameEngine<TState, TOptions>;
  protected log!: Logger;

  protected gameState!: TState;
  protected gameOptions!: TOptions;
  protected undoStack: TState[] = [];
  protected playerMap = new Map<string, number>(); // sessionId → playerIndex
  protected playerNames: string[] = [];
  protected playerIds: (string | null)[] = [];
  protected supabaseRoomId: string | null = null;
  private seq = 0;
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;

  /** Subclass hook: extract typed options from the raw create payload. */
  protected abstract parseOptions(raw: unknown): TOptions;

  /** Subclass hook: generate game events after a dart is processed. */
  protected abstract emitGameEvents(
    state: TState,
    segment: Segment,
  ): void;

  onCreate(options: RoomCreateOptions): void {
    const { playerNames, playerIds, roomId } = options;
    this.log = logger.child({ module: "room", roomId: this.roomId });
    this.playerNames = playerNames;
    this.playerIds = playerIds;
    this.supabaseRoomId = roomId ?? null;
    this.gameOptions = this.parseOptions(options.gameOptions);
    this.gameState = this.engine.startGame(this.gameOptions, playerNames);
    this.setState(this.gameState);

    this.log.info({ playerNames, playerCount: playerNames.length }, "Room created");

    this.maxClients = 2;

    // Register message handlers
    this.onMessage(ClientMessage.DART_HIT, (client, payload) =>
      this.handleDartHit(client, payload),
    );
    this.onMessage(ClientMessage.NEXT_TURN, (client) =>
      this.handleNextTurn(client),
    );
    this.onMessage(ClientMessage.UNDO, (client) =>
      this.handleUndo(client),
    );

    // Client requests fresh state (after registering message handlers)
    this.onMessage("request_state", (client) => {
      client.send(ServerMessage.STATE_UPDATE, {
        state: this.getSerializableState(),
        seq: this.seq,
      });
    });

    // Rematch passthrough
    this.onMessage(ClientMessage.REMATCH_REQUEST, (client) =>
      this.broadcast(ServerMessage.REMATCH_REQUEST, {}, { except: client }),
    );
    this.onMessage(ClientMessage.REMATCH_ACCEPT, (client) =>
      this.broadcast(ServerMessage.REMATCH_ACCEPT, {}, { except: client }),
    );
    this.onMessage(ClientMessage.REMATCH_DECLINE, (client) =>
      this.broadcast(ServerMessage.REMATCH_DECLINE, {}, { except: client }),
    );

    this.resetInactivityTimer();
  }

  onJoin(client: Client): void {
    const playerIndex = this.playerMap.size;
    this.playerMap.set(client.sessionId, playerIndex);
    this.log.info({ sessionId: client.sessionId, playerIndex }, "Player joined");

    // Send initial state to the joining client
    client.send(ServerMessage.STATE_UPDATE, {
      state: this.getSerializableState(),
      seq: this.seq,
    });

    this.resetInactivityTimer();
  }

  async onLeave(client: Client, code?: number): Promise<void> {
    const playerIndex = this.playerMap.get(client.sessionId);
    const consented = code === 4000; // WS_CLOSE_CONSENTED
    this.log.info({ sessionId: client.sessionId, playerIndex, consented }, "Player disconnected");

    if (!consented) {
      // Allow reconnection
      try {
        await this.allowReconnection(client, RECONNECT_ALLOWANCE_MS / 1000);
        this.log.info({ sessionId: client.sessionId, playerIndex }, "Player reconnected");
        // Player reconnected — send current state
        client.send(ServerMessage.STATE_UPDATE, {
          state: this.getSerializableState(),
          seq: this.seq,
        });
        return;
      } catch {
        this.log.warn({ sessionId: client.sessionId, playerIndex }, "Reconnection timed out");
      }
    }

    this.playerMap.delete(client.sessionId);

    // Notify remaining players
    this.broadcast(ServerMessage.PLAYER_LEFT, {
      playerIndex,
      playerName:
        playerIndex != null ? this.playerNames[playerIndex] : "Unknown",
    });
  }

  onDispose(): void {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    this.log.info({}, "Room disposed");
  }

  // ── Action handlers ─────────────────────────────────────────────────────

  private handleDartHit(
    client: Client,
    payload: { segmentId: SegmentID },
  ): void {
    const playerIndex = this.playerMap.get(client.sessionId);

    // Validate it's this player's turn
    if (playerIndex !== this.gameState.currentPlayerIndex) return;

    // Don't accept darts after game is won
    if (this.gameState.winner != null) return;

    const segment = CreateSegment(payload.segmentId);
    this.log.debug({ segmentId: payload.segmentId, playerIndex }, "Dart hit");

    // Push undo snapshot
    this.pushUndo();

    // Apply dart
    const changes = this.engine.addDart(this.gameState, segment);
    this.gameState = { ...this.gameState, ...changes };

    // Emit game events (dart_hit, bust, game_won, open_numbers etc.)
    this.emitGameEvents(this.gameState, segment);

    // Check for winner
    if (this.gameState.winner != null) {
      this.broadcast(ServerMessage.GAME_ENDED, {
        winner: this.gameState.winner,
      });
      this.recordResult();
    }

    this.broadcastState();
    this.resetInactivityTimer();
  }

  private handleNextTurn(client: Client): void {
    const playerIndex = this.playerMap.get(client.sessionId);
    if (playerIndex !== this.gameState.currentPlayerIndex) return;
    if (this.gameState.winner != null) return;
    this.log.debug({ playerIndex }, "Next turn");

    // Signal turn delay to all clients
    this.broadcast(ServerMessage.TURN_DELAY, {});

    this.pushUndo();
    const changes = this.engine.nextTurn(this.gameState);
    this.gameState = { ...this.gameState, ...changes };

    // Emit next_turn event
    this.broadcast(ServerMessage.GAME_EVENT, {
      eventName: "next_turn",
      data: {},
    });

    // Emit game-specific events on turn change (e.g., open_numbers for cricket)
    this.onTurnChanged();

    this.broadcastState();
    this.resetInactivityTimer();
  }

  private handleUndo(client: Client): void {
    const playerIndex = this.playerMap.get(client.sessionId);
    if (playerIndex !== this.gameState.currentPlayerIndex) return;
    if (this.gameState.winner != null) return;
    this.log.debug({ playerIndex }, "Undo");

    const changes = this.engine.undoLastDart(this.gameState);
    this.gameState = { ...this.gameState, ...changes };

    this.broadcastState();
    this.resetInactivityTimer();
  }

  // ── Broadcast helpers ───────────────────────────────────────────────────

  private broadcastState(): void {
    this.seq++;
    this.setState(this.gameState);
    this.broadcast(ServerMessage.STATE_UPDATE, {
      state: this.getSerializableState(),
      seq: this.seq,
    });
  }

  private getSerializableState(): TState & { undoStack: TState[] } {
    return { ...this.gameState, undoStack: this.undoStack };
  }

  private pushUndo(): void {
    this.undoStack = [...this.undoStack.slice(-(UNDO_CAP - 1)), { ...this.gameState }];
  }

  /** Subclass hook: called after nextTurn for game-specific events. */
  protected onTurnChanged(): void {
    // Default no-op, override in subclasses
  }

  // ── Inactivity ──────────────────────────────────────────────────────────

  private resetInactivityTimer(): void {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    this.inactivityTimer = setTimeout(() => {
      this.log.warn({}, "Room closed due to inactivity");
      this.disconnect();
    }, INACTIVITY_TIMEOUT_MS);
  }

  // ── Result recording ────────────────────────────────────────────────────

  private async recordResult(): Promise<void> {
    if (!supabaseAdmin || !this.supabaseRoomId) return;
    try {
      await supabaseAdmin
        .from("rooms")
        .update({ status: "finished" })
        .eq("id", this.supabaseRoomId);
    } catch (err) {
      this.log.error({ err, supabaseRoomId: this.supabaseRoomId }, "Failed to record game result");
    }
  }
}
