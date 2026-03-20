import { useCallback, useEffect, useRef, useState } from "react";
import type { Room } from "colyseus.js";
import { WebRTCManager } from "../services/WebRTCManager.ts";
import type { WebRTCStatus } from "../services/WebRTCManager.ts";

interface UseWebRTCOptions {
  /** Active Colyseus room used for WebRTC signaling. */
  room: Room | null;
  /** Whether this player is the room host (determines who creates the offer). */
  isHost: boolean;
  /** When true, starts camera and WebRTC connection. When false, tears down. */
  enabled: boolean;
}

interface UseWebRTCReturn {
  /** Local camera stream (available once the user grants permission). */
  localStream: MediaStream | null;
  /** Remote peer's camera stream (available once P2P connection establishes). */
  remoteStream: MediaStream | null;
  /** Current connection lifecycle status. */
  status: WebRTCStatus;
}

/**
 * React hook that manages a WebRTC camera connection for online multiplayer.
 *
 * Creates a {@link WebRTCManager} when `enabled` flips to true, tears it down
 * on disable or unmount. The manager uses the Colyseus room for SDP signaling
 * and exposes local/remote MediaStreams for rendering in {@link CameraBackground}.
 */
export function useWebRTC({
  room,
  isHost,
  enabled,
}: UseWebRTCOptions): UseWebRTCReturn {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<WebRTCStatus>("idle");
  const managerRef = useRef<WebRTCManager | null>(null);

  const cleanup = useCallback(() => {
    managerRef.current?.stop();
    managerRef.current = null;
  }, []);

  useEffect(() => {
    if (!room || !enabled) {
      cleanup();
      return;
    }

    const manager = new WebRTCManager({
      onStatus: setStatus,
      onLocalStream: setLocalStream,
      onRemoteStream: setRemoteStream,
    });
    managerRef.current = manager;
    manager.start(room, isHost);

    return cleanup;
  }, [room, isHost, enabled, cleanup]);

  return { localStream, remoteStream, status };
}
