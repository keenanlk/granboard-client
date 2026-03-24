import { useEffect, useRef, useState } from "react";
import { SwitchCamera, Loader2 } from "lucide-react";
import {
  requestCamera,
  enumerateVideoDevices,
  stopAllTracks,
  isNativePlatform,
} from "../lib/cameraUtils.ts";
import type { CameraSelection } from "../lib/cameraUtils.ts";

interface CameraPreviewProps {
  /** Called with the confirmed MediaStream when the user taps Confirm. */
  onConfirm: (stream: MediaStream) => void;
}

/**
 * Full-screen modal shown once at online game start.
 * Auto-starts the camera and lets the user switch/flip before confirming.
 * Camera is mandatory for online play — there is no skip option.
 */
export function CameraPreview({ onConfirm }: CameraPreviewProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  streamRef.current = stream;

  // Bind stream to video element
  useEffect(() => {
    const el = videoRef.current;
    if (el && stream) {
      try {
        el.srcObject = stream;
        el.play().catch(() => {});
      } catch {
        // srcObject assignment can fail with mock streams in test environments
      }
    }
  }, [stream]);

  // Cleanup on unmount — stop preview stream if still active
  useEffect(() => {
    return () => {
      if (streamRef.current) stopAllTracks(streamRef.current);
    };
  }, []);

  // Auto-start camera on mount — camera is mandatory for online play
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const s = await requestCamera({
          kind: "facingMode",
          facingMode: "user",
        });
        if (cancelled) {
          stopAllTracks(s);
          return;
        }
        setStream(s);
        setFacingMode("user");

        // Enumerate devices after permission grant (labels are available now)
        if (!isNativePlatform()) {
          const videoDevices = await enumerateVideoDevices();
          if (cancelled) return;
          setDevices(videoDevices);
          const activeTrack = s.getVideoTracks()[0];
          const activeSettings = activeTrack?.getSettings();
          if (activeSettings?.deviceId) {
            setSelectedDeviceId(activeSettings.deviceId);
          } else if (videoDevices.length > 0) {
            setSelectedDeviceId(videoDevices[0].deviceId);
          }
        }
      } catch (err) {
        if (cancelled) return;
        console.error("[CameraPreview] getUserMedia failed:", err);
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Camera error: ${msg}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Switch camera — stop old, request new. */
  async function switchCamera(selection: CameraSelection) {
    setLoading(true);
    setError(null);
    if (stream) stopAllTracks(stream);
    setStream(null);
    try {
      const s = await requestCamera(selection);
      setStream(s);

      if (selection.kind === "deviceId") {
        setSelectedDeviceId(selection.deviceId);
      }
    } catch {
      setError("Could not switch camera. The device may be in use.");
    } finally {
      setLoading(false);
    }
  }

  function handleFlip() {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    switchCamera({ kind: "facingMode", facingMode: next });
  }

  function handleDeviceChange(deviceId: string) {
    switchCamera({ kind: "deviceId", deviceId });
  }

  function handleConfirm() {
    if (stream) {
      // Transfer ownership — clear ref so unmount cleanup won't stop tracks
      streamRef.current = null;
      setStream(null);
      onConfirm(stream);
    }
  }

  // ── Preview ──────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 max-w-3xl w-full mx-4 flex gap-5 max-h-[calc(100dvh-2rem)]">
        {/* Left: video preview */}
        <div className="relative flex-1 min-w-0 bg-black rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
          )}
        </div>

        {/* Right: controls */}
        <div className="flex flex-col gap-3 justify-center w-48 shrink-0">
          <h2 className="text-xl font-black text-white tracking-wide text-center">
            Camera Preview
          </h2>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          {/* Camera switching controls */}
          {isNativePlatform() ? (
            <button
              onClick={handleFlip}
              disabled={loading}
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-zinc-800 text-zinc-200 font-bold uppercase tracking-widest text-sm transition-colors hover:bg-zinc-700 disabled:opacity-50"
            >
              <SwitchCamera className="w-4 h-4" />
              Flip
            </button>
          ) : devices.length > 1 ? (
            <select
              value={selectedDeviceId}
              onChange={(e) => handleDeviceChange(e.target.value)}
              disabled={loading}
              className="py-2 px-3 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-bold border border-zinc-600 disabled:opacity-50 w-full"
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${devices.indexOf(d) + 1}`}
                </option>
              ))}
            </select>
          ) : null}

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={!stream || loading}
            className="w-full py-3 rounded-xl font-bold uppercase tracking-widest text-base transition-colors disabled:opacity-50"
            style={{
              backgroundColor: "var(--color-game-accent)",
              color: "var(--color-game-accent-text)",
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
