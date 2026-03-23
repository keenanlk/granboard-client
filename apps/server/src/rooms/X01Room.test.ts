import { describe, it, expect, vi, beforeEach } from "vitest";
import { SegmentID } from "@nlc-darts/engine";
import type { X01Options } from "@nlc-darts/engine";

vi.mock("@colyseus/core", () => {
  class MockRoom {
    roomId = "test-room";
    maxClients = 0;
    clients: unknown[] = [];
    _messageHandlers = new Map<
      string,
      (client: unknown, payload?: unknown) => void
    >();

    onMessage(
      type: string,
      handler: (client: unknown, payload?: unknown) => void,
    ) {
      this._messageHandlers.set(type, handler);
    }
    setState = vi.fn();
    broadcast = vi.fn();
    disconnect = vi.fn();
    allowReconnection = vi.fn();
  }
  return { Room: MockRoom };
});

vi.mock("../supabaseAdmin.ts", () => ({ supabaseAdmin: null }));
vi.mock("../lib/logger.ts", () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

import { X01Room } from "./X01Room.ts";

function createRoom(gameOptions: unknown = {}, playerNames = ["Alice", "Bob"]) {
  const room = new X01Room();
  room.onCreate({
    gameOptions,
    playerNames,
    playerIds: playerNames.map(() => null),
  });
  return room;
}

function getHandler(
  room: unknown,
  type: string,
): (client: unknown, payload?: unknown) => void {
  return (
    room as {
      _messageHandlers: Map<
        string,
        (client: unknown, payload?: unknown) => void
      >;
    }
  )._messageHandlers.get(type)!;
}

function mockClient(sessionId = "client-1") {
  return { sessionId, send: vi.fn() };
}

describe("X01Room", () => {
  describe("parseOptions", () => {
    it("returns default options when raw is null", () => {
      const room = createRoom(null);
      const state = (
        room as unknown as { gameState: { x01Options: X01Options } }
      ).gameState;
      expect(state.x01Options.startingScore).toBe(501);
      expect(state.x01Options.doubleOut).toBe(false);
    });

    it("returns default options when raw is undefined", () => {
      const room = createRoom(undefined);
      const state = (
        room as unknown as { gameState: { x01Options: X01Options } }
      ).gameState;
      expect(state.x01Options.startingScore).toBe(501);
    });

    it("merges partial options with defaults", () => {
      const room = createRoom({ doubleOut: true });
      const state = (
        room as unknown as { gameState: { x01Options: X01Options } }
      ).gameState;
      expect(state.x01Options.doubleOut).toBe(true);
      expect(state.x01Options.startingScore).toBe(501);
    });

    it("full options override defaults", () => {
      const opts: X01Options = {
        startingScore: 301,
        splitBull: true,
        doubleOut: true,
        masterOut: false,
        doubleIn: true,
      };
      const room = createRoom(opts);
      const state = (
        room as unknown as { gameState: { x01Options: X01Options } }
      ).gameState;
      expect(state.x01Options.startingScore).toBe(301);
      expect(state.x01Options.splitBull).toBe(true);
      expect(state.x01Options.doubleIn).toBe(true);
    });
  });

  describe("emitGameEvents", () => {
    let room: X01Room;

    beforeEach(() => {
      room = createRoom();
    });

    it("broadcasts dart_hit event", () => {
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);
      const handler = getHandler(room, "dart_hit");
      handler(client, { segmentId: SegmentID.OUTER_20 });

      const broadcastMock = (
        room as unknown as { broadcast: ReturnType<typeof vi.fn> }
      ).broadcast;
      const dartHitCall = broadcastMock.mock.calls.find(
        (c: unknown[]) =>
          c[0] === "game_event" &&
          (c[1] as { eventName: string }).eventName === "dart_hit",
      );
      expect(dartHitCall).toBeDefined();
      expect(dartHitCall![1].data.segment).toBeDefined();
    });

    it("broadcasts bust event when state.isBust", () => {
      // 301, no double-out. Round 1: 3x T20 = 180, remaining 121.
      // Skip P2. Round 2: 2x T20 = 120, remaining 1. Third T20 → -59 = bust.
      const bustRoom = createRoom({ startingScore: 301 });
      const client = mockClient();
      (bustRoom as unknown as { onJoin: (c: unknown) => void }).onJoin(client);
      const client2 = mockClient("client-2");
      (bustRoom as unknown as { onJoin: (c: unknown) => void }).onJoin(client2);

      const handler = getHandler(bustRoom, "dart_hit");
      const nextTurnHandler = getHandler(bustRoom, "next_turn");

      // Round 1: 3x T20 = 180
      handler(client, { segmentId: SegmentID.TRP_20 });
      handler(client, { segmentId: SegmentID.TRP_20 });
      handler(client, { segmentId: SegmentID.TRP_20 });
      nextTurnHandler(client);

      // Player 2's turn — skip
      nextTurnHandler(client2);

      // Round 2: 3x T20. First two bring score to 1, third busts (-59).
      handler(client, { segmentId: SegmentID.TRP_20 });
      handler(client, { segmentId: SegmentID.TRP_20 });
      handler(client, { segmentId: SegmentID.TRP_20 });

      const broadcastMock = (
        bustRoom as unknown as { broadcast: ReturnType<typeof vi.fn> }
      ).broadcast;
      const bustCalls = broadcastMock.mock.calls.filter(
        (c: unknown[]) =>
          c[0] === "game_event" &&
          (c[1] as { eventName: string }).eventName === "bust",
      );
      expect(bustCalls.length).toBeGreaterThanOrEqual(1);
    });

    it("broadcasts game_won event when state.winner is set", () => {
      // Use 301, throw T20 x3 = 180, next round T20 x2 = 120, remaining 1 won't work easily.
      // Instead: 301 game, non-double-out. T20(60)*5 = 300. Then single 1 = win.
      const winRoom = createRoom({ startingScore: 301 });
      const client = mockClient();
      (winRoom as unknown as { onJoin: (c: unknown) => void }).onJoin(client);
      const client2 = mockClient("client-2");
      (winRoom as unknown as { onJoin: (c: unknown) => void }).onJoin(client2);

      const handler = getHandler(winRoom, "dart_hit");
      const nextTurn = getHandler(winRoom, "next_turn");

      // Round 1: 3x T20 = 180
      handler(client, { segmentId: SegmentID.TRP_20 });
      handler(client, { segmentId: SegmentID.TRP_20 });
      handler(client, { segmentId: SegmentID.TRP_20 });
      nextTurn(client);

      // Player 2's turn - skip
      nextTurn(client2);

      // Round 2: 2x T20 = 120, total 300, remaining 1
      handler(client, { segmentId: SegmentID.TRP_20 });
      handler(client, { segmentId: SegmentID.TRP_20 });
      // Single 1 to win (remaining = 1)
      handler(client, { segmentId: SegmentID.INNER_1 });

      const broadcastMock = (
        winRoom as unknown as { broadcast: ReturnType<typeof vi.fn> }
      ).broadcast;
      const wonCalls = broadcastMock.mock.calls.filter(
        (c: unknown[]) =>
          c[0] === "game_event" &&
          (c[1] as { eventName: string }).eventName === "game_won",
      );
      expect(wonCalls.length).toBe(1);
      expect(wonCalls[0][1].data.playerName).toBe("Alice");
    });

    it("does not broadcast bust when not busted", () => {
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);
      const handler = getHandler(room, "dart_hit");
      handler(client, { segmentId: SegmentID.INNER_1 }); // Single 1 on 501

      const broadcastMock = (
        room as unknown as { broadcast: ReturnType<typeof vi.fn> }
      ).broadcast;
      const bustCalls = broadcastMock.mock.calls.filter(
        (c: unknown[]) =>
          c[0] === "game_event" &&
          (c[1] as { eventName: string }).eventName === "bust",
      );
      expect(bustCalls.length).toBe(0);
    });
  });

  describe("gameTypeName", () => {
    it("returns 'x01'", () => {
      const room = createRoom();
      expect((room as unknown as { gameTypeName: string }).gameTypeName).toBe(
        "x01",
      );
    });
  });

  describe("extractPlayerGameStats", () => {
    it("extracts stats from player state after darts", () => {
      const room = createRoom({ startingScore: 301 });
      const client1 = mockClient("client-1");
      const client2 = mockClient("client-2");
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client1);
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client2);

      const handler = getHandler(room, "dart_hit");
      const nextTurn = getHandler(room, "next_turn");

      // Round 1: 3x T20 = 180, total score = 180
      handler(client1, { segmentId: SegmentID.TRP_20 });
      handler(client1, { segmentId: SegmentID.TRP_20 });
      handler(client1, { segmentId: SegmentID.TRP_20 });
      nextTurn(client1);

      const state = (
        room as unknown as {
          gameState: {
            x01Options: X01Options;
            players: {
              totalDartsThrown: number;
              rounds: { score: number }[];
            }[];
          };
        }
      ).gameState;
      const extract = (
        room as unknown as {
          extractPlayerGameStats: (
            s: typeof state,
            i: number,
          ) => {
            totalDarts: number;
            totalScore: number;
            totalMarks: number;
            totalRounds: number;
          };
        }
      ).extractPlayerGameStats(state, 0);

      expect(extract.totalDarts).toBe(3);
      expect(extract.totalScore).toBe(180);
      expect(extract.totalMarks).toBe(0);
      expect(extract.totalRounds).toBe(1);
    });
  });

  describe("integration", () => {
    it("handleDartHit processes dart and broadcasts state", () => {
      const room = createRoom();
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);

      const handler = getHandler(room, "dart_hit");
      handler(client, { segmentId: SegmentID.TRP_20 });

      const broadcastMock = (
        room as unknown as { broadcast: ReturnType<typeof vi.fn> }
      ).broadcast;
      const stateUpdates = broadcastMock.mock.calls.filter(
        (c: unknown[]) => c[0] === "state_update",
      );
      expect(stateUpdates.length).toBeGreaterThanOrEqual(1);
    });

    it("handleDartHit ignores when wrong player's turn", () => {
      const room = createRoom();
      const client1 = mockClient("client-1");
      const client2 = mockClient("client-2");
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client1);
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client2);

      // Player 0's turn, but client-2 (player 1) sends dart
      const handler = getHandler(room, "dart_hit");
      const broadcastMock = (
        room as unknown as { broadcast: ReturnType<typeof vi.fn> }
      ).broadcast;
      broadcastMock.mockClear();

      handler(client2, { segmentId: SegmentID.TRP_20 });

      // Should not have broadcast any game_event
      const gameEvents = broadcastMock.mock.calls.filter(
        (c: unknown[]) => c[0] === "game_event",
      );
      expect(gameEvents.length).toBe(0);
    });

    it("handleNextTurn advances turn and broadcasts", () => {
      const room = createRoom();
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);

      const nextTurn = getHandler(room, "next_turn");
      const broadcastMock = (
        room as unknown as { broadcast: ReturnType<typeof vi.fn> }
      ).broadcast;
      broadcastMock.mockClear();

      nextTurn(client);

      // Should broadcast turn_delay, game_event (next_turn), and state_update
      const turnDelay = broadcastMock.mock.calls.filter(
        (c: unknown[]) => c[0] === "turn_delay",
      );
      expect(turnDelay.length).toBe(1);

      const nextTurnEvents = broadcastMock.mock.calls.filter(
        (c: unknown[]) =>
          c[0] === "game_event" &&
          (c[1] as { eventName: string }).eventName === "next_turn",
      );
      expect(nextTurnEvents.length).toBe(1);
    });
  });
});
