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

// ── 2.1 Valid segmentId range (0=INNER_1 through 82=MISS) ───────────────────
const MIN_SEGMENT_ID = 0;
const MAX_SEGMENT_ID = 82;

// ── 2.5 Max concurrent rooms ────────────────────────────────────────────────
const MAX_ROOMS = Number(process.env.MAX_ROOMS) || 50;
let _activeRoomCount = 0;

/** Returns the current number of active game rooms. */
export function activeRoomCount(): number {
  return _activeRoomCount;
}

/** Options passed when creating a game room. */
interface RoomCreateOptions {
  /** Game-specific options blob, parsed by each room subclass. */
  gameOptions: unknown;
  /** Display names for each player, ordered by seat index. */
  playerNames: string[];
  /** Supabase user IDs for each player (null for guests). */
  playerIds: (string | null)[];
  /** Supabase room ID used to record match results. */
  roomId?: string;
}

/**
 * Abstract base for all game rooms.
 * Concrete subclasses provide the engine and game-specific helpers.
 */
export abstract class BaseGameRoom<
  TState extends { currentPlayerIndex: number; winner: string | null },
  TOptions,
> extends Room {
  /** Game engine that drives state transitions for this room type. */
  protected abstract engine: GameEngine<TState, TOptions>;
  /** Scoped logger instance for this room. */
  protected log!: Logger;

  /** Current authoritative game state. */
  protected gameState!: TState;
  /** Parsed game options for the current match. */
  protected gameOptions!: TOptions;
  /** Stack of previous states used for undo support. */
  protected undoStack: TState[] = [];
  /** Maps Colyseus session IDs to player seat indices. */
  protected playerMap = new Map<string, number>();
  /** Ordered display names for each player. */
  protected playerNames: string[] = [];
  /** Supabase user IDs for each player (null for guests). */
  protected playerIds: (string | null)[] = [];
  /** Supabase room row ID for recording results, if available. */
  protected supabaseRoomId: string | null = null;
  private seq = 0;
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;

  /** Timestamp when the room was created. */
  private createdAt = Date.now();
  /** Total darts thrown in this room. */
  private dartCount = 0;

  /** Subclass hook: extract typed options from the raw create payload. */
  protected abstract parseOptions(raw: unknown): TOptions;

  /** Subclass hook: generate game events after a dart is processed. */
  protected abstract emitGameEvents(state: TState, segment: Segment): void;

  /** Subclass hook: extract per-player stats at game end for recording. */
  protected abstract extractPlayerGameStats(
    state: TState,
    playerIndex: number,
  ): {
    totalDarts: number;
    totalScore: number;
    totalMarks: number;
    totalRounds: number;
  };

  onCreate(options: RoomCreateOptions): void {
    // 2.5 Max concurrent rooms
    if (_activeRoomCount >= MAX_ROOMS) {
      this.log = logger.child({ module: "room", roomId: this.roomId });
      this.log.warn(
        { activeRooms: _activeRoomCount, max: MAX_ROOMS },
        "Room limit reached",
      );
      throw new Error("Server room limit reached");
    }
    _activeRoomCount++;

    const { playerNames, playerIds, roomId } = options;
    this.log = logger.child({ module: "room", roomId: this.roomId });
    this.playerNames = playerNames;
    this.playerIds = playerIds;
    this.supabaseRoomId = roomId ?? null;
    this.gameOptions = this.parseOptions(options.gameOptions);
    this.gameState = this.engine.startGame(this.gameOptions, playerNames);
    this.setState(this.gameState);

    this.log.info(
      { playerNames, playerCount: playerNames.length },
      "Room created",
    );

    this.maxClients = 2;

    // Register message handlers
    this.onMessage(ClientMessage.DART_HIT, (client, payload) =>
      this.handleDartHit(client, payload),
    );
    this.onMessage(ClientMessage.NEXT_TURN, (client) =>
      this.handleNextTurn(client),
    );
    this.onMessage(ClientMessage.UNDO, (client) => this.handleUndo(client));
    this.onMessage(ClientMessage.REMATCH, () => this.handleRematch());

    // Client requests fresh state (after registering message handlers)
    this.onMessage("request_state", (client) => {
      client.send(ServerMessage.STATE_UPDATE, {
        state: this.getSerializableState(),
        seq: this.seq,
      });
    });

    // WebRTC signaling passthrough — relay to the other player
    this.onMessage(ClientMessage.WEBRTC_SIGNAL, (client, payload) =>
      this.broadcast(ClientMessage.WEBRTC_SIGNAL, payload, { except: client }),
    );
    // Camera status passthrough — relay to the other player
    this.onMessage(ClientMessage.CAMERA_STATUS, (client, payload) =>
      this.broadcast(ClientMessage.CAMERA_STATUS, payload, { except: client }),
    );

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
    this.log.info(
      { sessionId: client.sessionId, playerIndex },
      "Player joined",
    );

    // Send initial state to the joining client
    client.send(ServerMessage.STATE_UPDATE, {
      state: this.getSerializableState(),
      seq: this.seq,
    });

    this.resetInactivityTimer();
  }

  async onLeave(client: Client, consented?: boolean): Promise<void> {
    const playerIndex = this.playerMap.get(client.sessionId);
    this.log.info(
      { sessionId: client.sessionId, playerIndex, consented },
      "Player disconnected",
    );

    if (!consented) {
      // Allow reconnection
      try {
        await this.allowReconnection(client, RECONNECT_ALLOWANCE_MS / 1000);
        this.log.info(
          { sessionId: client.sessionId, playerIndex },
          "Player reconnected",
        );
        // Player reconnected — send current state
        client.send(ServerMessage.STATE_UPDATE, {
          state: this.getSerializableState(),
          seq: this.seq,
        });
        return;
      } catch {
        this.log.warn(
          { sessionId: client.sessionId, playerIndex },
          "Reconnection timed out",
        );
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
    _activeRoomCount = Math.max(0, _activeRoomCount - 1);
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
    const durationSec = Math.round((Date.now() - this.createdAt) / 1000);
    this.log.info(
      {
        durationSec,
        dartCount: this.dartCount,
        playerCount: this.playerMap.size,
      },
      "Room disposed",
    );
  }

  // ── Action handlers ─────────────────────────────────────────────────────

  private handleDartHit(
    client: Client,
    payload: { segmentId: SegmentID },
  ): void {
    try {
      const playerIndex = this.playerMap.get(client.sessionId);

      // Validate it's this player's turn
      if (playerIndex !== this.gameState.currentPlayerIndex) return;

      // Don't accept darts after game is won
      if (this.gameState.winner != null) return;

      // 2.1 Validate segmentId
      const sid = payload?.segmentId;
      if (
        typeof sid !== "number" ||
        !Number.isInteger(sid) ||
        sid < MIN_SEGMENT_ID ||
        sid > MAX_SEGMENT_ID
      ) {
        this.log.warn(
          { sessionId: client.sessionId, payload },
          "Invalid segmentId",
        );
        return;
      }

      const segment = CreateSegment(sid);
      this.dartCount++;
      this.log.debug({ segmentId: sid, playerIndex }, "Dart hit");

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
    } catch (err) {
      this.log.error(
        {
          err,
          roomId: this.roomId,
          playerIndex: this.playerMap.get(client.sessionId),
          payload,
        },
        "Error in handleDartHit",
      );
    }
  }

  private handleNextTurn(client: Client): void {
    try {
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
    } catch (err) {
      this.log.error(
        {
          err,
          roomId: this.roomId,
          playerIndex: this.playerMap.get(client.sessionId),
        },
        "Error in handleNextTurn",
      );
    }
  }

  private handleUndo(client: Client): void {
    try {
      const playerIndex = this.playerMap.get(client.sessionId);
      if (playerIndex !== this.gameState.currentPlayerIndex) return;
      if (this.gameState.winner != null) return;
      this.log.debug({ playerIndex }, "Undo");

      const changes = this.engine.undoLastDart(this.gameState);
      this.gameState = { ...this.gameState, ...changes };

      this.broadcastState();
      this.resetInactivityTimer();
    } catch (err) {
      this.log.error(
        {
          err,
          roomId: this.roomId,
          playerIndex: this.playerMap.get(client.sessionId),
        },
        "Error in handleUndo",
      );
    }
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
    this.undoStack = [
      ...this.undoStack.slice(-(UNDO_CAP - 1)),
      { ...this.gameState },
    ];
  }

  /** Reset game state for a rematch within the same room. */
  private handleRematch(): void {
    // Idempotent: only reset if the game is actually finished
    if (this.gameState.winner === null) return;
    this.log.info({}, "Rematch — resetting game state");
    this.gameState = this.engine.startGame(this.gameOptions, this.playerNames);
    this.undoStack = [];
    this.broadcastState();
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

  /** Determine the game type string for the game_results table. */
  protected abstract get gameTypeName(): string;

  private async recordResult(): Promise<void> {
    if (!supabaseAdmin || !this.supabaseRoomId) return;

    const sb = supabaseAdmin;
    const roomId = this.supabaseRoomId!;

    const doRecord = async () => {
      // Update room status
      await sb.from("rooms").update({ status: "finished" }).eq("id", roomId);

      // Insert per-player game results
      const winnerName = this.gameState.winner;
      const rows = this.playerNames
        .map((name, i) => {
          const playerId = this.playerIds[i];
          if (!playerId) return null; // Skip guests without auth

          const stats = this.extractPlayerGameStats(this.gameState, i);
          const ppd =
            stats.totalDarts > 0 ? stats.totalScore / stats.totalDarts : 0;
          const mpr =
            stats.totalRounds > 0 ? stats.totalMarks / stats.totalRounds : 0;

          // Find opponent ID
          const opponentIndex = i === 0 ? 1 : 0;
          const opponentId = this.playerIds[opponentIndex] ?? null;

          return {
            room_id: roomId,
            game_type: this.gameTypeName,
            player_id: playerId,
            opponent_id: opponentId,
            won: name === winnerName,
            total_darts: stats.totalDarts,
            total_score: stats.totalScore,
            total_marks: stats.totalMarks,
            total_rounds: stats.totalRounds,
            ppd,
            mpr,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      if (rows.length > 0) {
        const { error } = await sb.from("game_results").insert(rows);
        if (error) {
          this.log.error({ err: error }, "Failed to insert game_results");
        }
      }
    };

    try {
      await doRecord();
    } catch (err) {
      this.log.warn(
        { err, supabaseRoomId: this.supabaseRoomId },
        "Failed to record result — retrying in 2s",
      );
      // 3.2 Single retry after 2 seconds
      try {
        await new Promise((r) => setTimeout(r, 2000));
        await doRecord();
      } catch (retryErr) {
        this.log.error(
          { err: retryErr, supabaseRoomId: this.supabaseRoomId },
          "Retry failed — game result not recorded",
        );
      }
    }
  }
}
