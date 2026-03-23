import type { Room } from "colyseus.js";

/** Google public STUN server for NAT traversal. */
const STUN_SERVERS: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

/** Interval between host offer retries (ms). */
const OFFER_RETRY_MS = 2000;
/** Maximum number of offer attempts before giving up. */
const OFFER_MAX_RETRIES = 10;

/** Connection lifecycle states exposed to consumers via {@link WebRTCStatusCallback}. */
export type WebRTCStatus =
  | "idle"
  | "requesting"
  | "connecting"
  | "streaming"
  | "denied"
  | "failed";

export type WebRTCStatusCallback = (status: WebRTCStatus) => void;
export type StreamCallback = (stream: MediaStream | null) => void;

/** Send a Colyseus message, silently swallowing errors if the WebSocket is already closed. */
function safeSend(room: Room, type: string, payload: unknown) {
  try {
    room.send(type, payload);
  } catch {
    // Room WebSocket already closed — ignore
  }
}

/**
 * Wait for ICE gathering to complete so `pc.localDescription` contains all
 * candidates baked into the SDP. Resolves immediately if already complete,
 * otherwise listens for the `icegatheringstatechange` event (with a 5 s timeout).
 *
 * Using "gathered ICE" (vs trickle ICE) keeps Colyseus signaling to 1–2
 * messages total, avoiding WebSocket payload flooding.
 */
function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, 5000);
    pc.addEventListener("icegatheringstatechange", function handler() {
      if (pc.iceGatheringState === "complete") {
        clearTimeout(timeout);
        pc.removeEventListener("icegatheringstatechange", handler);
        resolve();
      }
    });
  });
}

/**
 * Manages a single WebRTC peer connection for live camera streaming
 * between two online players, using the existing Colyseus WebSocket
 * connection for SDP signaling.
 *
 * ## Lifecycle
 * 1. `start(room, isHost)` — requests camera, creates the peer connection,
 *    and begins the offer/answer exchange.
 * 2. Callbacks fire as the connection progresses: `onStatus`, `onLocalStream`,
 *    `onRemoteStream`.
 * 3. `stop()` — tears down the connection and releases the camera.
 *
 * ## Signaling strategy
 * - Uses **gathered ICE**: after `setLocalDescription`, waits for all ICE
 *   candidates to be collected, then sends the full SDP in a single
 *   `webrtc_signal` Colyseus message. This avoids flooding the WebSocket
 *   with individual candidate messages.
 * - The **host** creates an offer and retries every {@link OFFER_RETRY_MS}
 *   until the guest answers (or {@link OFFER_MAX_RETRIES} is reached).
 * - The **guest** waits for the offer and responds with an answer.
 */
export class WebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private stopped = false;
  private gotAnswer = false;
  private offerRetryTimer: ReturnType<typeof setTimeout> | null = null;

  private onStatus: WebRTCStatusCallback;
  private onLocalStream: StreamCallback;
  private onRemoteStream: StreamCallback;

  constructor(callbacks: {
    onStatus: WebRTCStatusCallback;
    onLocalStream: StreamCallback;
    onRemoteStream: StreamCallback;
  }) {
    this.onStatus = callbacks.onStatus;
    this.onLocalStream = callbacks.onLocalStream;
    this.onRemoteStream = callbacks.onRemoteStream;
  }

  /**
   * Begin the WebRTC flow: request camera → create peer connection → exchange SDP.
   *
   * @param room  - Active Colyseus room used for signaling.
   * @param isHost - Whether this player is the room host (creates offers).
   */
  async start(room: Room, isHost: boolean): Promise<void> {
    // getUserMedia requires a secure context (HTTPS, localhost, or capacitor://).
    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn(
        "[WebRTC] getUserMedia not available — likely insecure context (HTTP). Camera disabled.",
      );
      this.onStatus("denied");
      return;
    }

    this.onStatus("requesting");

    // 1. Get camera first — no Colyseus messages until camera is ready
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (err) {
      console.warn("[WebRTC] getUserMedia failed:", err);
      this.onStatus("denied");
      return;
    }

    // Guard: stop() may have been called while awaiting getUserMedia
    if (this.stopped) {
      for (const track of stream.getTracks()) track.stop();
      return;
    }

    this.localStream = stream;
    this.onLocalStream(stream);
    this.setupPeerConnection(room, isHost, stream);
  }

  /**
   * Begin the WebRTC flow with a pre-acquired camera stream, skipping getUserMedia.
   *
   * Use this when the stream has already been obtained (e.g. from a camera preview).
   * Ownership of the stream transfers to this manager — `stop()` will stop its tracks.
   *
   * @param room   - Active Colyseus room used for signaling.
   * @param isHost - Whether this player is the room host (creates offers).
   * @param stream - Pre-acquired MediaStream from getUserMedia.
   */
  async startWithStream(
    room: Room,
    isHost: boolean,
    stream: MediaStream,
  ): Promise<void> {
    if (this.stopped) {
      for (const track of stream.getTracks()) track.stop();
      return;
    }

    this.localStream = stream;
    this.onLocalStream(stream);
    this.setupPeerConnection(room, isHost, stream);
  }

  /**
   * Create the RTCPeerConnection, add tracks, register signaling, and begin
   * the offer/answer exchange. Shared by both `start` and `startWithStream`.
   */
  private setupPeerConnection(
    room: Room,
    isHost: boolean,
    stream: MediaStream,
  ): void {
    // Verify Colyseus connection is still alive before proceeding
    try {
      room.send("request_state", {});
    } catch {
      console.warn(
        "[WebRTC] Colyseus connection dead after getUserMedia — skipping WebRTC setup",
      );
      this.onStatus("denied");
      return;
    }

    this.onStatus("connecting");

    // Create peer connection and set up signaling
    const pc = new RTCPeerConnection(STUN_SERVERS);
    this.pc = pc;

    for (const track of stream.getTracks()) {
      pc.addTrack(track, stream);
    }

    // When the remote peer's track arrives, surface it
    pc.ontrack = (event) => {
      if (this.stopped) return;
      const [remoteStream] = event.streams;
      if (remoteStream) {
        this.onRemoteStream(remoteStream);
        this.onStatus("streaming");
      }
    };

    // Handle ICE connection state changes (disconnect / failure)
    pc.oniceconnectionstatechange = () => {
      if (this.stopped) return;
      if (pc.iceConnectionState === "disconnected") {
        if (isHost && pc.restartIce) pc.restartIce();
      } else if (pc.iceConnectionState === "failed") {
        this.onStatus("failed");
      }
    };

    // Register signaling handler — receives offers/answers from the other player
    room.onMessage(
      "webrtc_signal",
      (payload: { type: string; sdp?: RTCSessionDescriptionInit }) => {
        if (this.stopped) return;
        this.handleSignal(pc, room, payload, isHost);
      },
    );

    // Host creates offer with retry; guest just waits for the offer
    if (isHost) {
      this.sendOfferWithRetry(pc, room, 0);
    }
  }

  /**
   * Repeatedly send an offer until the guest answers or retries are exhausted.
   * This handles the race where the guest hasn't registered its handler yet.
   */
  private sendOfferWithRetry(
    pc: RTCPeerConnection,
    room: Room,
    attempt: number,
  ): void {
    if (this.stopped || this.gotAnswer || attempt >= OFFER_MAX_RETRIES) return;

    this.createAndSendOffer(pc, room).then(() => {
      if (this.stopped || this.gotAnswer) return;
      this.offerRetryTimer = setTimeout(
        () => this.sendOfferWithRetry(pc, room, attempt + 1),
        OFFER_RETRY_MS,
      );
    });
  }

  /** Create an SDP offer, wait for ICE gathering, then send via Colyseus. */
  private async createAndSendOffer(
    pc: RTCPeerConnection,
    room: Room,
  ): Promise<void> {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIceGathering(pc);
      if (this.stopped) return;
      safeSend(room, "webrtc_signal", {
        type: "offer",
        sdp: pc.localDescription!.toJSON(),
      });
    } catch {
      // Offer creation failed — retry will handle it
    }
  }

  /** Process an incoming SDP offer or answer relayed via Colyseus. */
  private async handleSignal(
    pc: RTCPeerConnection,
    room: Room,
    payload: { type: string; sdp?: RTCSessionDescriptionInit },
    isHost: boolean,
  ): Promise<void> {
    try {
      if (payload.type === "offer" && !isHost && payload.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await waitForIceGathering(pc);
        if (this.stopped) return;
        safeSend(room, "webrtc_signal", {
          type: "answer",
          sdp: pc.localDescription!.toJSON(),
        });
      } else if (payload.type === "answer" && isHost && payload.sdp) {
        this.gotAnswer = true;
        if (this.offerRetryTimer) {
          clearTimeout(this.offerRetryTimer);
          this.offerRetryTimer = null;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      }
    } catch {
      // Silently handle signal processing errors — connection may still succeed
    }
  }

  /** Tear down the peer connection, stop camera tracks, and reset state. */
  stop(): void {
    this.stopped = true;

    if (this.offerRetryTimer) {
      clearTimeout(this.offerRetryTimer);
      this.offerRetryTimer = null;
    }

    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        track.stop();
      }
      this.localStream = null;
    }
    this.onLocalStream(null);
    this.onRemoteStream(null);

    if (this.pc) {
      this.pc.ontrack = null;
      this.pc.oniceconnectionstatechange = null;
      this.pc.close();
      this.pc = null;
    }

    this.onStatus("idle");
  }
}
