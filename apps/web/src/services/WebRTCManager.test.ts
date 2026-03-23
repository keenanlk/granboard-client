import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WebRTCManager } from "./WebRTCManager.ts";
import type { WebRTCStatus } from "./WebRTCManager.ts";
import type { Room } from "colyseus.js";

// ── Mocks ────────────────────────────────────────────────────────────────

/** Structural subset of Colyseus Room used by WebRTCManager for signaling. */
interface MockRoomHandle {
  send: ReturnType<typeof vi.fn>;
  onMessage: ReturnType<typeof vi.fn>;
  _handlers: Map<string, (...args: unknown[]) => void>;
  _receive(type: string, payload: unknown): void;
  /** Cast to Room for passing into WebRTCManager methods. */
  asRoom(): Room;
}

/** Minimal mock of a Colyseus Room for signaling. */
function mockRoom(): MockRoomHandle {
  const handlers = new Map<string, (...args: unknown[]) => void>();
  const room = {
    send: vi.fn(),
    onMessage: vi.fn((type: string, handler: (...args: unknown[]) => void) => {
      handlers.set(type, handler);
    }),
    _handlers: handlers,
    /** Simulate receiving a message from the server. */
    _receive(type: string, payload: unknown) {
      handlers.get(type)?.(payload);
    },
    asRoom() {
      return room as unknown as Room;
    },
  };
  return room;
}

/** Minimal mock of a MediaStream. */
function mockMediaStream() {
  const track = { stop: vi.fn(), kind: "video" };
  return {
    getTracks: () => [track],
    _track: track,
  } as unknown as MediaStream;
}

/** Stub RTCPeerConnection — enough to exercise WebRTCManager logic. */
class MockRTCPeerConnection {
  ontrack: ((event: unknown) => void) | null = null;
  oniceconnectionstatechange: (() => void) | null = null;
  iceGatheringState = "complete";
  iceConnectionState = "new";
  localDescription = { toJSON: () => ({ type: "offer", sdp: "mock-sdp" }) };

  addTrack = vi.fn();
  createOffer = vi.fn().mockResolvedValue({ type: "offer", sdp: "mock-sdp" });
  createAnswer = vi
    .fn()
    .mockResolvedValue({ type: "answer", sdp: "mock-answer" });
  setLocalDescription = vi.fn().mockResolvedValue(undefined);
  setRemoteDescription = vi.fn().mockResolvedValue(undefined);
  restartIce = vi.fn();
  close = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}

let originalRTC: typeof globalThis.RTCPeerConnection;
let originalRTCSessionDescription: typeof globalThis.RTCSessionDescription;
let originalMediaDevices: MediaDevices;

beforeEach(() => {
  originalRTC = globalThis.RTCPeerConnection;
  originalRTCSessionDescription = globalThis.RTCSessionDescription;
  originalMediaDevices = navigator.mediaDevices;

  globalThis.RTCPeerConnection =
    MockRTCPeerConnection as unknown as typeof RTCPeerConnection;
  globalThis.RTCSessionDescription = class {
    init: RTCSessionDescriptionInit;
    constructor(init: RTCSessionDescriptionInit) {
      this.init = init;
    }
  } as unknown as typeof RTCSessionDescription;

  Object.defineProperty(navigator, "mediaDevices", {
    value: {
      getUserMedia: vi.fn().mockResolvedValue(mockMediaStream()),
    },
    configurable: true,
  });
});

afterEach(() => {
  globalThis.RTCPeerConnection = originalRTC;
  globalThis.RTCSessionDescription = originalRTCSessionDescription;
  Object.defineProperty(navigator, "mediaDevices", {
    value: originalMediaDevices,
    configurable: true,
  });
  vi.restoreAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────────

describe("WebRTCManager", () => {
  it("reports 'denied' when getUserMedia is not available", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: undefined,
      configurable: true,
    });

    const statuses: WebRTCStatus[] = [];
    const manager = new WebRTCManager({
      onStatus: (s) => statuses.push(s),
      onLocalStream: vi.fn(),
      onRemoteStream: vi.fn(),
    });

    await manager.start(mockRoom().asRoom(), true);
    expect(statuses).toEqual(["denied"]);
  });

  it("reports 'denied' when getUserMedia throws", async () => {
    (
      navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>
    ).mockRejectedValue(new Error("NotAllowedError"));

    const statuses: WebRTCStatus[] = [];
    const manager = new WebRTCManager({
      onStatus: (s) => statuses.push(s),
      onLocalStream: vi.fn(),
      onRemoteStream: vi.fn(),
    });

    await manager.start(mockRoom().asRoom(), true);
    expect(statuses).toContain("denied");
  });

  it("exposes localStream after getUserMedia succeeds", async () => {
    const onLocalStream = vi.fn();
    const manager = new WebRTCManager({
      onStatus: vi.fn(),
      onLocalStream,
      onRemoteStream: vi.fn(),
    });

    await manager.start(mockRoom().asRoom(), true);
    expect(onLocalStream).toHaveBeenCalledWith(expect.any(Object));
    expect(onLocalStream.mock.calls[0][0].getTracks).toBeDefined();
  });

  it("host creates an offer and sends it via Colyseus", async () => {
    const room = mockRoom();
    const manager = new WebRTCManager({
      onStatus: vi.fn(),
      onLocalStream: vi.fn(),
      onRemoteStream: vi.fn(),
    });

    await manager.start(room.asRoom(), true);

    // Allow the async offer creation to resolve
    await vi.waitFor(() => {
      expect(room.send).toHaveBeenCalledWith(
        "webrtc_signal",
        expect.objectContaining({ type: "offer" }),
      );
    });
  });

  it("guest does NOT create an offer", async () => {
    const room = mockRoom();
    const manager = new WebRTCManager({
      onStatus: vi.fn(),
      onLocalStream: vi.fn(),
      onRemoteStream: vi.fn(),
    });

    await manager.start(room.asRoom(), false);
    await new Promise((r) => setTimeout(r, 10));

    const signalCalls = room.send.mock.calls.filter(
      (args: unknown[]) => args[0] === "webrtc_signal",
    );
    expect(signalCalls).toHaveLength(0);
  });

  it("guest responds to an offer with an answer", async () => {
    const room = mockRoom();
    const manager = new WebRTCManager({
      onStatus: vi.fn(),
      onLocalStream: vi.fn(),
      onRemoteStream: vi.fn(),
    });

    await manager.start(room.asRoom(), false);

    // Simulate receiving an offer
    room._receive("webrtc_signal", {
      type: "offer",
      sdp: { type: "offer", sdp: "remote-offer" },
    });

    await vi.waitFor(() => {
      expect(room.send).toHaveBeenCalledWith(
        "webrtc_signal",
        expect.objectContaining({ type: "answer" }),
      );
    });
  });

  it("stop() releases camera tracks and closes peer connection", async () => {
    const stream = mockMediaStream();
    (
      navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>
    ).mockResolvedValue(stream);

    const onLocalStream = vi.fn();
    const onRemoteStream = vi.fn();
    const manager = new WebRTCManager({
      onStatus: vi.fn(),
      onLocalStream,
      onRemoteStream,
    });

    await manager.start(mockRoom().asRoom(), true);
    manager.stop();

    expect(
      (stream as unknown as { _track: { stop: ReturnType<typeof vi.fn> } })
        ._track.stop,
    ).toHaveBeenCalled();
    expect(onLocalStream).toHaveBeenLastCalledWith(null);
    expect(onRemoteStream).toHaveBeenLastCalledWith(null);
  });

  it("stop() before getUserMedia resolves prevents setup", async () => {
    let resolveMedia!: (s: MediaStream) => void;
    (
      navigator.mediaDevices.getUserMedia as ReturnType<typeof vi.fn>
    ).mockReturnValue(
      new Promise((r) => {
        resolveMedia = r;
      }),
    );

    const onLocalStream = vi.fn();
    const manager = new WebRTCManager({
      onStatus: vi.fn(),
      onLocalStream,
      onRemoteStream: vi.fn(),
    });

    const room = mockRoom();
    const started = manager.start(room.asRoom(), true);

    // Stop before getUserMedia resolves
    manager.stop();

    // Now resolve getUserMedia
    const stream = mockMediaStream();
    resolveMedia(stream);
    await started;

    // Tracks should be stopped, localStream callback should only have received null (from stop)
    expect(
      (stream as unknown as { _track: { stop: ReturnType<typeof vi.fn> } })
        ._track.stop,
    ).toHaveBeenCalled();
    const nonNullCalls = onLocalStream.mock.calls.filter(
      (args: unknown[]) => args[0] !== null,
    );
    expect(nonNullCalls).toHaveLength(0);
  });

  it("registers webrtc_signal handler on the room", async () => {
    const room = mockRoom();
    const manager = new WebRTCManager({
      onStatus: vi.fn(),
      onLocalStream: vi.fn(),
      onRemoteStream: vi.fn(),
    });

    await manager.start(room.asRoom(), false);

    expect(room.onMessage).toHaveBeenCalledWith(
      "webrtc_signal",
      expect.any(Function),
    );
  });

  it("verifies Colyseus connection after getUserMedia", async () => {
    const room = mockRoom();
    const manager = new WebRTCManager({
      onStatus: vi.fn(),
      onLocalStream: vi.fn(),
      onRemoteStream: vi.fn(),
    });

    await manager.start(room.asRoom(), true);

    // request_state is sent as a health check
    expect(room.send).toHaveBeenCalledWith("request_state", {});
  });

  it("aborts if Colyseus health check fails", async () => {
    const room = mockRoom();
    room.send.mockImplementation(() => {
      throw new Error("WebSocket closed");
    });

    const statuses: WebRTCStatus[] = [];
    const manager = new WebRTCManager({
      onStatus: (s) => statuses.push(s),
      onLocalStream: vi.fn(),
      onRemoteStream: vi.fn(),
    });

    await manager.start(room.asRoom(), true);
    expect(statuses).toContain("denied");
  });

  it("fires onRemoteStream when remote track arrives", async () => {
    const room = mockRoom();
    const onRemoteStream = vi.fn();
    const statuses: WebRTCStatus[] = [];
    const manager = new WebRTCManager({
      onStatus: (s) => statuses.push(s),
      onLocalStream: vi.fn(),
      onRemoteStream,
    });

    await manager.start(room.asRoom(), false);

    // Access the PC instance stored internally by the manager
    const lastPC = (manager as unknown as { pc: MockRTCPeerConnection }).pc;
    expect(lastPC).toBeDefined();

    const fakeRemoteStream = mockMediaStream();
    lastPC.ontrack!({ streams: [fakeRemoteStream] });

    expect(onRemoteStream).toHaveBeenCalledWith(fakeRemoteStream);
    expect(statuses).toContain("streaming");
  });

  it("reports 'failed' when ICE connection state is failed", async () => {
    const room = mockRoom();
    const statuses: WebRTCStatus[] = [];
    const manager = new WebRTCManager({
      onStatus: (s) => statuses.push(s),
      onLocalStream: vi.fn(),
      onRemoteStream: vi.fn(),
    });

    await manager.start(room.asRoom(), false);

    const lastPC = (manager as unknown as { pc: MockRTCPeerConnection }).pc;
    lastPC.iceConnectionState = "failed";
    lastPC.oniceconnectionstatechange!();

    expect(statuses).toContain("failed");
  });

  it("calls restartIce on host when ICE disconnects", async () => {
    const room = mockRoom();
    const manager = new WebRTCManager({
      onStatus: vi.fn(),
      onLocalStream: vi.fn(),
      onRemoteStream: vi.fn(),
    });

    await manager.start(room.asRoom(), true);
    // Wait for offer send
    await vi.waitFor(() => {
      expect(room.send).toHaveBeenCalledWith(
        "webrtc_signal",
        expect.objectContaining({ type: "offer" }),
      );
    });

    const lastPC = (manager as unknown as { pc: MockRTCPeerConnection }).pc;
    lastPC.iceConnectionState = "disconnected";
    lastPC.oniceconnectionstatechange!();

    expect(lastPC.restartIce).toHaveBeenCalled();
  });

  it("host stops retrying offers after receiving answer", async () => {
    vi.useFakeTimers();
    const room = mockRoom();
    const manager = new WebRTCManager({
      onStatus: vi.fn(),
      onLocalStream: vi.fn(),
      onRemoteStream: vi.fn(),
    });

    await manager.start(room.asRoom(), true);
    // Let the initial offer resolve
    await vi.advanceTimersByTimeAsync(0);

    // Simulate receiving answer
    room._receive("webrtc_signal", {
      type: "answer",
      sdp: { type: "answer", sdp: "remote-answer" },
    });
    await vi.advanceTimersByTimeAsync(0);

    // Clear the send mock and advance past retry interval
    room.send.mockClear();
    await vi.advanceTimersByTimeAsync(3000);

    // Should NOT have sent another offer (retry was cancelled)
    const offerCalls = room.send.mock.calls.filter(
      (args: unknown[]) =>
        args[0] === "webrtc_signal" &&
        (args[1] as { type: string }).type === "offer",
    );
    expect(offerCalls).toHaveLength(0);

    vi.useRealTimers();
  });

  it("stop() clears offer retry timer when active", async () => {
    vi.useFakeTimers();
    const room = mockRoom();
    const onStatus = vi.fn();
    const manager = new WebRTCManager({
      onStatus,
      onLocalStream: vi.fn(),
      onRemoteStream: vi.fn(),
    });

    await manager.start(room.asRoom(), true);
    await vi.advanceTimersByTimeAsync(0);

    // Stop while retry timer is pending
    manager.stop();

    // Advance past retry — should NOT create another offer or throw
    room.send.mockClear();
    await vi.advanceTimersByTimeAsync(5000);

    const offerCalls = room.send.mock.calls.filter(
      (args: unknown[]) => args[0] === "webrtc_signal",
    );
    expect(offerCalls).toHaveLength(0);
    expect(onStatus).toHaveBeenLastCalledWith("idle");

    vi.useRealTimers();
  });

  it("ontrack is ignored after stop()", async () => {
    const room = mockRoom();
    const onRemoteStream = vi.fn();
    const manager = new WebRTCManager({
      onStatus: vi.fn(),
      onLocalStream: vi.fn(),
      onRemoteStream,
    });

    await manager.start(room.asRoom(), false);
    const lastPC = (manager as unknown as { pc: MockRTCPeerConnection }).pc;

    manager.stop();
    // ontrack is now null after stop(), but test the guard in the handler
    // The stop() sets pc.ontrack = null, so this verifies cleanup
    expect(lastPC.ontrack).toBeNull();
  });

  it("signal handling ignores messages after stop()", async () => {
    const room = mockRoom();
    const manager = new WebRTCManager({
      onStatus: vi.fn(),
      onLocalStream: vi.fn(),
      onRemoteStream: vi.fn(),
    });

    await manager.start(room.asRoom(), false);
    manager.stop();

    // Simulate receiving an offer after stop — should not throw or send answer
    room.send.mockClear();
    room._receive("webrtc_signal", {
      type: "offer",
      sdp: { type: "offer", sdp: "late-offer" },
    });
    await new Promise((r) => setTimeout(r, 10));

    const answerCalls = room.send.mock.calls.filter(
      (args: unknown[]) =>
        args[0] === "webrtc_signal" &&
        (args[1] as { type: string }).type === "answer",
    );
    expect(answerCalls).toHaveLength(0);
  });

  describe("startWithStream", () => {
    it("skips getUserMedia and uses provided stream", async () => {
      const stream = mockMediaStream();
      const onLocalStream = vi.fn();
      const manager = new WebRTCManager({
        onStatus: vi.fn(),
        onLocalStream,
        onRemoteStream: vi.fn(),
      });

      const room = mockRoom();
      await manager.startWithStream(room.asRoom(), false, stream);

      expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
      expect(onLocalStream).toHaveBeenCalledWith(stream);
    });

    it("sets up peer connection and signaling with pre-acquired stream", async () => {
      const stream = mockMediaStream();
      const room = mockRoom();
      const manager = new WebRTCManager({
        onStatus: vi.fn(),
        onLocalStream: vi.fn(),
        onRemoteStream: vi.fn(),
      });

      await manager.startWithStream(room.asRoom(), true, stream);

      expect(room.send).toHaveBeenCalledWith("request_state", {});
      expect(room.onMessage).toHaveBeenCalledWith(
        "webrtc_signal",
        expect.any(Function),
      );

      // Host should send offer
      await vi.waitFor(() => {
        expect(room.send).toHaveBeenCalledWith(
          "webrtc_signal",
          expect.objectContaining({ type: "offer" }),
        );
      });
    });

    it("stop() after startWithStream stops the provided stream tracks", async () => {
      const stream = mockMediaStream();
      const room = mockRoom();
      const manager = new WebRTCManager({
        onStatus: vi.fn(),
        onLocalStream: vi.fn(),
        onRemoteStream: vi.fn(),
      });

      await manager.startWithStream(room.asRoom(), false, stream);
      manager.stop();

      expect(
        (stream as unknown as { _track: { stop: ReturnType<typeof vi.fn> } })
          ._track.stop,
      ).toHaveBeenCalled();
    });

    it("stops provided stream tracks if already stopped", async () => {
      const stream = mockMediaStream();
      const manager = new WebRTCManager({
        onStatus: vi.fn(),
        onLocalStream: vi.fn(),
        onRemoteStream: vi.fn(),
      });

      manager.stop();
      const room = mockRoom();
      await manager.startWithStream(room.asRoom(), false, stream);

      expect(
        (stream as unknown as { _track: { stop: ReturnType<typeof vi.fn> } })
          ._track.stop,
      ).toHaveBeenCalled();
    });
  });
});
