import { describe, it, expect, vi, beforeEach } from "vitest";
import { SegmentID, CRICKET_TARGETS } from "@nlc-darts/engine";
import type { CricketOptions, CricketState } from "@nlc-darts/engine";

vi.mock("@colyseus/core", () => {
  class MockRoom {
    roomId = "test-room";
    maxClients = 0;
    clients: unknown[] = [];
    _messageHandlers = new Map<string, Function>();

    onMessage(type: string, handler: Function) {
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

import { CricketRoom } from "./CricketRoom.ts";

function createRoom(gameOptions: unknown = {}, playerNames = ["Alice", "Bob"]) {
  const room = new CricketRoom();
  room.onCreate({
    gameOptions,
    playerNames,
    playerIds: playerNames.map(() => null),
  });
  return room;
}

function getHandler(room: unknown, type: string): Function {
  return (
    room as { _messageHandlers: Map<string, Function> }
  )._messageHandlers.get(type)!;
}

function mockClient(sessionId = "client-1") {
  return { sessionId, send: vi.fn() };
}

function getState(room: CricketRoom): CricketState {
  return (room as unknown as { gameState: CricketState }).gameState;
}

function getBroadcast(room: CricketRoom) {
  return (room as unknown as { broadcast: ReturnType<typeof vi.fn> }).broadcast;
}

describe("CricketRoom", () => {
  describe("parseOptions", () => {
    it("returns default options when raw is null", () => {
      const room = createRoom(null);
      const state = getState(room);
      expect(state.options.singleBull).toBe(false);
      expect(state.options.roundLimit).toBe(20);
      expect(state.options.cutThroat).toBe(false);
    });

    it("returns default options when raw is undefined", () => {
      const room = createRoom(undefined);
      const state = getState(room);
      expect(state.options.roundLimit).toBe(20);
    });

    it("merges partial options with defaults", () => {
      const room = createRoom({ cutThroat: true });
      const state = getState(room);
      expect(state.options.cutThroat).toBe(true);
      expect(state.options.roundLimit).toBe(20);
    });

    it("full custom options override defaults", () => {
      const opts: CricketOptions = {
        singleBull: true,
        roundLimit: 10,
        cutThroat: true,
      };
      const room = createRoom(opts);
      const state = getState(room);
      expect(state.options.singleBull).toBe(true);
      expect(state.options.roundLimit).toBe(10);
      expect(state.options.cutThroat).toBe(true);
    });
  });

  describe("emitGameEvents", () => {
    let room: CricketRoom;

    beforeEach(() => {
      room = createRoom();
    });

    it("broadcasts dart_hit with segment and effectiveMarks", () => {
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);
      const handler = getHandler(room, "dart_hit");
      handler(client, { segmentId: SegmentID.TRP_20 });

      const broadcastMock = getBroadcast(room);
      const dartHitCall = broadcastMock.mock.calls.find(
        (c: unknown[]) =>
          c[0] === "game_event" &&
          (c[1] as { eventName: string }).eventName === "dart_hit",
      );
      expect(dartHitCall).toBeDefined();
      expect(dartHitCall![1].data.segment).toBeDefined();
      expect(dartHitCall![1].data).toHaveProperty("effectiveMarks");
    });

    it("broadcasts open_numbers after dart", () => {
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);
      const handler = getHandler(room, "dart_hit");
      handler(client, { segmentId: SegmentID.TRP_20 });

      const broadcastMock = getBroadcast(room);
      const openCalls = broadcastMock.mock.calls.filter(
        (c: unknown[]) =>
          c[0] === "game_event" &&
          (c[1] as { eventName: string }).eventName === "open_numbers",
      );
      expect(openCalls.length).toBeGreaterThanOrEqual(1);
    });

    it("broadcasts game_won when winner is set", () => {
      // Close all targets for player 1 to win
      const winRoom = createRoom();
      const client1 = mockClient("client-1");
      const client2 = mockClient("client-2");
      (winRoom as unknown as { onJoin: (c: unknown) => void }).onJoin(client1);
      (winRoom as unknown as { onJoin: (c: unknown) => void }).onJoin(client2);

      const handler = getHandler(winRoom, "dart_hit");
      const nextTurn = getHandler(winRoom, "next_turn");

      // Close all targets for Alice (player 0) - each target needs 3 marks
      // T20 closes 20, T19 closes 19, T18 closes 18
      handler(client1, { segmentId: SegmentID.TRP_20 });
      handler(client1, { segmentId: SegmentID.TRP_19 });
      handler(client1, { segmentId: SegmentID.TRP_18 });
      nextTurn(client1);
      nextTurn(client2);

      // T17 closes 17, T16 closes 16, T15 closes 15
      handler(client1, { segmentId: SegmentID.TRP_17 });
      handler(client1, { segmentId: SegmentID.TRP_16 });
      handler(client1, { segmentId: SegmentID.TRP_15 });
      nextTurn(client1);
      nextTurn(client2);

      // Close bull: need 3 marks on bull. DBL_BULL = 2 marks, BULL = 1 mark
      handler(client1, { segmentId: SegmentID.DBL_BULL });
      handler(client1, { segmentId: SegmentID.BULL });

      const broadcastMock = getBroadcast(winRoom);
      const wonCalls = broadcastMock.mock.calls.filter(
        (c: unknown[]) =>
          c[0] === "game_event" &&
          (c[1] as { eventName: string }).eventName === "game_won",
      );
      expect(wonCalls.length).toBe(1);
      expect(wonCalls[0][1].data.playerName).toBe("Alice");
    });

    it("effectiveMarks comes from last dart in currentRoundDarts", () => {
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);
      const handler = getHandler(room, "dart_hit");

      // Triple 20 = 3 marks on a cricket target
      handler(client, { segmentId: SegmentID.TRP_20 });

      const broadcastMock = getBroadcast(room);
      const dartHitCall = broadcastMock.mock.calls.find(
        (c: unknown[]) =>
          c[0] === "game_event" &&
          (c[1] as { eventName: string }).eventName === "dart_hit",
      );
      expect(dartHitCall![1].data.effectiveMarks).toBe(3);
    });
  });

  describe("emitOpenNumbers", () => {
    it("returns all targets when none are closed", () => {
      const room = createRoom();
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);

      // Throw a miss so we get an open_numbers emission without closing anything
      const handler = getHandler(room, "dart_hit");
      handler(client, { segmentId: SegmentID.MISS });

      const broadcastMock = getBroadcast(room);
      const openCall = broadcastMock.mock.calls.find(
        (c: unknown[]) =>
          c[0] === "game_event" &&
          (c[1] as { eventName: string }).eventName === "open_numbers",
      );
      expect(openCall).toBeDefined();
      expect(openCall![1].data.numbers).toEqual([...CRICKET_TARGETS]);
    });

    it("filters out targets closed by all players", () => {
      const room = createRoom();
      const client1 = mockClient("client-1");
      const client2 = mockClient("client-2");
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client1);
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client2);

      const handler = getHandler(room, "dart_hit");
      const nextTurn = getHandler(room, "next_turn");

      // Player 1 closes 20 (T20 = 3 marks)
      handler(client1, { segmentId: SegmentID.TRP_20 });
      nextTurn(client1);

      // Player 2 closes 20 (T20 = 3 marks)
      handler(client2, { segmentId: SegmentID.TRP_20 });

      const broadcastMock = getBroadcast(room);
      // Find the last open_numbers emission
      const openCalls = broadcastMock.mock.calls.filter(
        (c: unknown[]) =>
          c[0] === "game_event" &&
          (c[1] as { eventName: string }).eventName === "open_numbers",
      );
      const lastOpen = openCalls[openCalls.length - 1];
      expect(lastOpen![1].data.numbers).not.toContain(20);
      // Other targets should still be open
      expect(lastOpen![1].data.numbers).toContain(19);
      expect(lastOpen![1].data.numbers).toContain(25);
    });

    it("multiple targets closed by both players are all filtered out", () => {
      const room = createRoom();
      const client1 = mockClient("client-1");
      const client2 = mockClient("client-2");
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client1);
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client2);

      const handler = getHandler(room, "dart_hit");
      const nextTurn = getHandler(room, "next_turn");

      // Player 1 closes 20, 19, 18
      handler(client1, { segmentId: SegmentID.TRP_20 });
      handler(client1, { segmentId: SegmentID.TRP_19 });
      handler(client1, { segmentId: SegmentID.TRP_18 });
      nextTurn(client1);

      // Player 2 closes 20, 19, 18
      handler(client2, { segmentId: SegmentID.TRP_20 });
      handler(client2, { segmentId: SegmentID.TRP_19 });
      handler(client2, { segmentId: SegmentID.TRP_18 });

      const broadcastMock = getBroadcast(room);
      const openCalls = broadcastMock.mock.calls.filter(
        (c: unknown[]) =>
          c[0] === "game_event" &&
          (c[1] as { eventName: string }).eventName === "open_numbers",
      );
      const lastOpen = openCalls[openCalls.length - 1];
      // 20, 19, 18 should be filtered out
      expect(lastOpen![1].data.numbers).not.toContain(20);
      expect(lastOpen![1].data.numbers).not.toContain(19);
      expect(lastOpen![1].data.numbers).not.toContain(18);
      // Remaining targets should still be open
      expect(lastOpen![1].data.numbers).toContain(17);
      expect(lastOpen![1].data.numbers).toContain(16);
      expect(lastOpen![1].data.numbers).toContain(15);
      expect(lastOpen![1].data.numbers).toContain(25);
    });
  });

  describe("onTurnChanged", () => {
    it("calls emitOpenNumbers on turn change", () => {
      const room = createRoom();
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);

      const nextTurn = getHandler(room, "next_turn");
      const broadcastMock = getBroadcast(room);
      broadcastMock.mockClear();

      nextTurn(client);

      const openCalls = broadcastMock.mock.calls.filter(
        (c: unknown[]) =>
          c[0] === "game_event" &&
          (c[1] as { eventName: string }).eventName === "open_numbers",
      );
      expect(openCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("integration", () => {
    it("handleDartHit processes dart and broadcasts state", () => {
      const room = createRoom();
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);

      const handler = getHandler(room, "dart_hit");
      handler(client, { segmentId: SegmentID.TRP_20 });

      const broadcastMock = getBroadcast(room);
      const stateUpdates = broadcastMock.mock.calls.filter(
        (c: unknown[]) => c[0] === "state_update",
      );
      expect(stateUpdates.length).toBeGreaterThanOrEqual(1);
    });

    it("handleDartHit ignores wrong player", () => {
      const room = createRoom();
      const client1 = mockClient("client-1");
      const client2 = mockClient("client-2");
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client1);
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client2);

      const handler = getHandler(room, "dart_hit");
      const broadcastMock = getBroadcast(room);
      broadcastMock.mockClear();

      // Player 0's turn, client2 is player 1
      handler(client2, { segmentId: SegmentID.TRP_20 });

      const gameEvents = broadcastMock.mock.calls.filter(
        (c: unknown[]) => c[0] === "game_event",
      );
      expect(gameEvents.length).toBe(0);
    });

    it("handleNextTurn advances turn", () => {
      const room = createRoom();
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);

      const nextTurn = getHandler(room, "next_turn");
      nextTurn(client);

      const state = getState(room);
      expect(state.currentPlayerIndex).toBe(1);
    });

    it("handleUndo reverts last dart", () => {
      const room = createRoom();
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);

      const handler = getHandler(room, "dart_hit");
      handler(client, { segmentId: SegmentID.TRP_20 });

      // Player should have 3 marks on 20
      let state = getState(room);
      expect(state.players[0].marks[20]).toBe(3);

      const undoHandler = getHandler(room, "undo");
      undoHandler(client);

      state = getState(room);
      // After undo, marks on 20 should be reduced
      expect(state.players[0].marks[20]).toBeLessThan(3);
    });
  });
});
