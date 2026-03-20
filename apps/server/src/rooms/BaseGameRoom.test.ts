import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SegmentID } from "@nlc-darts/engine";
import type { X01Options } from "@nlc-darts/engine";

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
    allowReconnection = vi.fn(() => Promise.resolve());
  }
  return { Room: MockRoom };
});

const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) });
const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });
vi.mock("../supabaseAdmin.ts", () => ({ supabaseAdmin: null }));
import * as supaModule from "../supabaseAdmin.ts";
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

// Use X01Room as a concrete implementation of BaseGameRoom
import { X01Room } from "./X01Room.ts";

function createRoom(
  gameOptions: Partial<X01Options> = {},
  playerNames = ["Alice", "Bob"],
) {
  const room = new X01Room();
  room.onCreate({
    gameOptions,
    playerNames,
    playerIds: playerNames.map(() => "pid"),
    roomId: "supa-room-1",
  });
  return room;
}

function getHandler(room: unknown, type: string): Function {
  return (room as { _messageHandlers: Map<string, Function> })._messageHandlers.get(type)!;
}

function mockClient(sessionId = "client-1") {
  return { sessionId, send: vi.fn() };
}

function getBroadcast(room: unknown) {
  return (room as { broadcast: ReturnType<typeof vi.fn> }).broadcast;
}

describe("BaseGameRoom", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("onCreate", () => {
    it("sets maxClients to 2", () => {
      const room = createRoom();
      expect(room.maxClients).toBe(2);
    });

    it("registers all message handlers", () => {
      const room = createRoom();
      const handlers = (room as unknown as { _messageHandlers: Map<string, Function> })._messageHandlers;
      expect(handlers.has("dart_hit")).toBe(true);
      expect(handlers.has("next_turn")).toBe(true);
      expect(handlers.has("undo")).toBe(true);
      expect(handlers.has("request_state")).toBe(true);
      expect(handlers.has("rematch_request")).toBe(true);
      expect(handlers.has("rematch_accept")).toBe(true);
      expect(handlers.has("rematch_decline")).toBe(true);
      expect(handlers.has("webrtc_signal")).toBe(true);
      expect(handlers.has("camera_status")).toBe(true);
    });
  });

  describe("onJoin", () => {
    it("assigns playerIndex from playerMap size", () => {
      const room = createRoom();
      const client1 = mockClient("c1");
      const client2 = mockClient("c2");
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client1);
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client2);

      // Both clients should have received STATE_UPDATE
      expect(client1.send).toHaveBeenCalledWith("state_update", expect.any(Object));
      expect(client2.send).toHaveBeenCalledWith("state_update", expect.any(Object));
    });

    it("sends current state to joining client", () => {
      const room = createRoom();
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);
      expect(client.send).toHaveBeenCalledWith("state_update", expect.objectContaining({
        seq: expect.any(Number),
        state: expect.any(Object),
      }));
    });
  });

  describe("request_state", () => {
    it("sends current state to requesting client", () => {
      const room = createRoom();
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);

      const handler = getHandler(room, "request_state");
      client.send.mockClear();
      handler(client);

      expect(client.send).toHaveBeenCalledWith("state_update", expect.objectContaining({
        state: expect.any(Object),
        seq: expect.any(Number),
      }));
    });
  });

  describe("rematch passthrough", () => {
    it("broadcasts rematch_request to other clients", () => {
      const room = createRoom();
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);

      const handler = getHandler(room, "rematch_request");
      handler(client);

      const broadcast = getBroadcast(room);
      const calls = broadcast.mock.calls.filter((c: unknown[]) => c[0] === "rematch_request");
      expect(calls.length).toBe(1);
      expect(calls[0][2]).toEqual({ except: client });
    });

    it("broadcasts rematch_accept to other clients", () => {
      const room = createRoom();
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);

      const handler = getHandler(room, "rematch_accept");
      handler(client);

      const broadcast = getBroadcast(room);
      const calls = broadcast.mock.calls.filter((c: unknown[]) => c[0] === "rematch_accept");
      expect(calls.length).toBe(1);
    });

    it("broadcasts rematch_decline to other clients", () => {
      const room = createRoom();
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);

      const handler = getHandler(room, "rematch_decline");
      handler(client);

      const broadcast = getBroadcast(room);
      const calls = broadcast.mock.calls.filter((c: unknown[]) => c[0] === "rematch_decline");
      expect(calls.length).toBe(1);
    });
  });

  describe("WebRTC signaling passthrough", () => {
    it("broadcasts webrtc_signal to other clients with payload", () => {
      const room = createRoom();
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);

      const handler = getHandler(room, "webrtc_signal");
      const payload = { type: "offer", sdp: { type: "offer", sdp: "v=0..." } };
      handler(client, payload);

      const broadcast = getBroadcast(room);
      const calls = broadcast.mock.calls.filter((c: unknown[]) => c[0] === "webrtc_signal");
      expect(calls.length).toBe(1);
      expect(calls[0][1]).toEqual(payload);
      expect(calls[0][2]).toEqual({ except: client });
    });

    it("broadcasts camera_status to other clients with payload", () => {
      const room = createRoom();
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);

      const handler = getHandler(room, "camera_status");
      const payload = { enabled: true };
      handler(client, payload);

      const broadcast = getBroadcast(room);
      const calls = broadcast.mock.calls.filter((c: unknown[]) => c[0] === "camera_status");
      expect(calls.length).toBe(1);
      expect(calls[0][1]).toEqual(payload);
      expect(calls[0][2]).toEqual({ except: client });
    });
  });

  describe("onLeave", () => {
    it("consented leave (code 4000) removes player and broadcasts PLAYER_LEFT", async () => {
      const room = createRoom();
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);

      const broadcast = getBroadcast(room);
      broadcast.mockClear();

      await (room as unknown as { onLeave: (c: unknown, code?: number) => Promise<void> }).onLeave(client, 4000);

      const leftCalls = broadcast.mock.calls.filter((c: unknown[]) => c[0] === "player_left");
      expect(leftCalls.length).toBe(1);
      expect(leftCalls[0][1]).toEqual(expect.objectContaining({ playerIndex: 0 }));
    });

    it("non-consented leave attempts reconnection", async () => {
      const room = createRoom();
      const client = mockClient();
      const allowReconnection = (room as unknown as { allowReconnection: ReturnType<typeof vi.fn> }).allowReconnection;
      allowReconnection.mockResolvedValue(undefined);

      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);

      await (room as unknown as { onLeave: (c: unknown, code?: number) => Promise<void> }).onLeave(client);

      expect(allowReconnection).toHaveBeenCalledWith(client, 30);
    });

    it("reconnection success sends state update", async () => {
      const room = createRoom();
      const client = mockClient();
      const allowReconnection = (room as unknown as { allowReconnection: ReturnType<typeof vi.fn> }).allowReconnection;
      allowReconnection.mockResolvedValue(undefined);

      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);
      client.send.mockClear();

      await (room as unknown as { onLeave: (c: unknown, code?: number) => Promise<void> }).onLeave(client);

      expect(client.send).toHaveBeenCalledWith("state_update", expect.any(Object));
    });

    it("reconnection timeout removes player and broadcasts PLAYER_LEFT", async () => {
      const room = createRoom();
      const client = mockClient();
      const allowReconnection = (room as unknown as { allowReconnection: ReturnType<typeof vi.fn> }).allowReconnection;
      allowReconnection.mockRejectedValue(new Error("timeout"));

      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);
      const broadcast = getBroadcast(room);
      broadcast.mockClear();

      await (room as unknown as { onLeave: (c: unknown, code?: number) => Promise<void> }).onLeave(client);

      const leftCalls = broadcast.mock.calls.filter((c: unknown[]) => c[0] === "player_left");
      expect(leftCalls.length).toBe(1);
    });
  });

  describe("handleUndo", () => {
    it("reverts last dart on undo", () => {
      const room = createRoom();
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);

      const dartHandler = getHandler(room, "dart_hit");
      const undoHandler = getHandler(room, "undo");

      dartHandler(client, { segmentId: SegmentID.TRP_20 });

      const broadcast = getBroadcast(room);
      broadcast.mockClear();

      undoHandler(client);

      // Should broadcast state_update after undo
      const stateUpdates = broadcast.mock.calls.filter((c: unknown[]) => c[0] === "state_update");
      expect(stateUpdates.length).toBe(1);
    });

    it("undo ignores wrong player", () => {
      const room = createRoom();
      const client1 = mockClient("c1");
      const client2 = mockClient("c2");
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client1);
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client2);

      const dartHandler = getHandler(room, "dart_hit");
      const undoHandler = getHandler(room, "undo");

      dartHandler(client1, { segmentId: SegmentID.TRP_20 });

      const broadcast = getBroadcast(room);
      broadcast.mockClear();

      // Player 2 tries to undo player 1's dart
      undoHandler(client2);

      const stateUpdates = broadcast.mock.calls.filter((c: unknown[]) => c[0] === "state_update");
      expect(stateUpdates.length).toBe(0);
    });

    it("undo ignores when game is won", () => {
      const room = createRoom({ startingScore: 301 });
      const client1 = mockClient("c1");
      const client2 = mockClient("c2");
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client1);
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client2);

      const dartHandler = getHandler(room, "dart_hit");
      const nextTurn = getHandler(room, "next_turn");
      const undoHandler = getHandler(room, "undo");

      // Round 1: 3x T20 = 180
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      nextTurn(client1);
      nextTurn(client2);

      // Round 2: T20(60) + T20(60) + S1(1) = 121 → total 301 → winner
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.INNER_1 });

      const broadcast = getBroadcast(room);
      broadcast.mockClear();

      undoHandler(client1);

      const stateUpdates = broadcast.mock.calls.filter((c: unknown[]) => c[0] === "state_update");
      expect(stateUpdates.length).toBe(0);
    });
  });

  describe("undo stack", () => {
    it("pushes undo snapshot on dart hit", () => {
      const room = createRoom();
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);

      const dartHandler = getHandler(room, "dart_hit");
      dartHandler(client, { segmentId: SegmentID.INNER_1 });

      const broadcast = getBroadcast(room);
      const lastStateUpdate = broadcast.mock.calls.filter((c: unknown[]) => c[0] === "state_update").pop();
      expect(lastStateUpdate).toBeDefined();
      expect(lastStateUpdate![1].state.undoStack.length).toBe(1);
    });

    it("undo stack caps at 12", () => {
      const room = createRoom();
      const client1 = mockClient("c1");
      const client2 = mockClient("c2");
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client1);
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client2);

      const dartHandler = getHandler(room, "dart_hit");
      const nextTurn = getHandler(room, "next_turn");

      // 15 actions (darts + nextTurns)
      for (let i = 0; i < 5; i++) {
        dartHandler(client1, { segmentId: SegmentID.INNER_1 });
        dartHandler(client1, { segmentId: SegmentID.INNER_1 });
        dartHandler(client1, { segmentId: SegmentID.INNER_1 });
        nextTurn(client1);
        nextTurn(client2);
      }

      const broadcast = getBroadcast(room);
      const stateUpdates = broadcast.mock.calls.filter((c: unknown[]) => c[0] === "state_update");
      const lastState = stateUpdates[stateUpdates.length - 1][1].state;
      expect(lastState.undoStack.length).toBeLessThanOrEqual(12);
    });
  });

  describe("seq counter", () => {
    it("increments on each broadcast", () => {
      const room = createRoom();
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);

      const dartHandler = getHandler(room, "dart_hit");
      dartHandler(client, { segmentId: SegmentID.INNER_1 });
      dartHandler(client, { segmentId: SegmentID.INNER_2 });

      const broadcast = getBroadcast(room);
      const stateUpdates = broadcast.mock.calls.filter((c: unknown[]) => c[0] === "state_update");
      const seqs = stateUpdates.map((c: unknown[]) => (c[1] as { seq: number }).seq);
      // Each dart should increment seq
      for (let i = 1; i < seqs.length; i++) {
        expect(seqs[i]).toBeGreaterThan(seqs[i - 1]);
      }
    });
  });

  describe("inactivity timer", () => {
    it("disconnects room after 10 minutes of inactivity", () => {
      const room = createRoom();
      const disconnectFn = (room as unknown as { disconnect: ReturnType<typeof vi.fn> }).disconnect;

      vi.advanceTimersByTime(10 * 60 * 1000);

      expect(disconnectFn).toHaveBeenCalled();
    });

    it("resets timer on dart hit", () => {
      const room = createRoom();
      const client = mockClient();
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client);
      const disconnectFn = (room as unknown as { disconnect: ReturnType<typeof vi.fn> }).disconnect;

      // Advance 9 minutes
      vi.advanceTimersByTime(9 * 60 * 1000);

      // Send a dart (resets timer)
      const dartHandler = getHandler(room, "dart_hit");
      dartHandler(client, { segmentId: SegmentID.INNER_1 });

      // Advance another 9 minutes — should NOT have disconnected
      vi.advanceTimersByTime(9 * 60 * 1000);
      expect(disconnectFn).not.toHaveBeenCalled();

      // 1 more minute — now 10 min since last action — should disconnect
      vi.advanceTimersByTime(1 * 60 * 1000);
      expect(disconnectFn).toHaveBeenCalled();
    });
  });

  describe("onDispose", () => {
    it("clears inactivity timer", () => {
      const room = createRoom();
      (room as unknown as { onDispose: () => void }).onDispose();
      // Should not throw and timer should be cleared
      // Advancing time should NOT call disconnect
      const disconnectFn = (room as unknown as { disconnect: ReturnType<typeof vi.fn> }).disconnect;
      vi.advanceTimersByTime(15 * 60 * 1000);
      expect(disconnectFn).not.toHaveBeenCalled();
    });
  });

  describe("handleDartHit guards", () => {
    it("ignores dart after game is won", () => {
      const room = createRoom({ startingScore: 301 });
      const client1 = mockClient("c1");
      const client2 = mockClient("c2");
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client1);
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client2);

      const dartHandler = getHandler(room, "dart_hit");
      const nextTurn = getHandler(room, "next_turn");

      // Win the game: T20*3=180, skip P2, T20*2+S1=121, total=301
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      nextTurn(client1);
      nextTurn(client2);
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.INNER_1 });

      const broadcast = getBroadcast(room);
      broadcast.mockClear();

      // Try another dart after win
      dartHandler(client1, { segmentId: SegmentID.INNER_1 });

      const gameEvents = broadcast.mock.calls.filter((c: unknown[]) => c[0] === "game_event");
      expect(gameEvents.length).toBe(0);
    });
  });

  describe("handleNextTurn guards", () => {
    it("ignores next turn from wrong player", () => {
      const room = createRoom();
      const client1 = mockClient("c1");
      const client2 = mockClient("c2");
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client1);
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client2);

      const nextTurn = getHandler(room, "next_turn");
      const broadcast = getBroadcast(room);
      broadcast.mockClear();

      // Client 2 tries to end client 1's turn
      nextTurn(client2);

      const turnDelays = broadcast.mock.calls.filter((c: unknown[]) => c[0] === "turn_delay");
      expect(turnDelays.length).toBe(0);
    });

    it("ignores next turn after game is won", () => {
      const room = createRoom({ startingScore: 301 });
      const client1 = mockClient("c1");
      const client2 = mockClient("c2");
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client1);
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client2);

      const dartHandler = getHandler(room, "dart_hit");
      const nextTurn = getHandler(room, "next_turn");

      // Win the game
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      nextTurn(client1);
      nextTurn(client2);
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.INNER_1 });

      const broadcast = getBroadcast(room);
      broadcast.mockClear();

      nextTurn(client1);

      const turnDelays = broadcast.mock.calls.filter((c: unknown[]) => c[0] === "turn_delay");
      expect(turnDelays.length).toBe(0);
    });
  });

  describe("recordResult", () => {
    it("calls supabase when configured and game is won", () => {
      // Temporarily set supabaseAdmin to a mock client
      Object.defineProperty(supaModule, "supabaseAdmin", {
        value: { from: mockFrom },
        writable: true,
        configurable: true,
      });

      const room = createRoom({ startingScore: 301 });
      const client1 = mockClient("c1");
      const client2 = mockClient("c2");
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client1);
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client2);

      const dartHandler = getHandler(room, "dart_hit");
      const nextTurn = getHandler(room, "next_turn");

      // Win: T20*3=180, skip P2, T20*2+S1=121, total=301
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      nextTurn(client1);
      nextTurn(client2);
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.INNER_1 });

      expect(mockFrom).toHaveBeenCalledWith("rooms");
      expect(mockUpdate).toHaveBeenCalledWith({ status: "finished" });

      // Reset
      Object.defineProperty(supaModule, "supabaseAdmin", {
        value: null,
        writable: true,
        configurable: true,
      });
    });

    it("skips recording when supabaseAdmin is null", () => {
      mockFrom.mockClear();
      const room = createRoom({ startingScore: 301 });
      const client1 = mockClient("c1");
      const client2 = mockClient("c2");
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client1);
      (room as unknown as { onJoin: (c: unknown) => void }).onJoin(client2);

      const dartHandler = getHandler(room, "dart_hit");
      const nextTurn = getHandler(room, "next_turn");

      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      nextTurn(client1);
      nextTurn(client2);
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.TRP_20 });
      dartHandler(client1, { segmentId: SegmentID.INNER_1 });

      expect(mockFrom).not.toHaveBeenCalled();
    });
  });
});
