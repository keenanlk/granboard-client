import { useEffect, useRef, useState } from "react";
import { SwitchCamera, Loader2 } from "lucide-react";
import {
  requestCamera,
  enumerateVideoDevices,
  stopAllTracks,
  isNativePlatform,
} from "../lib/cameraUtils.ts";
import type { CameraSelection } from "../lib/cameraUtils.ts";

type Step = "ask" | "preview";

interface CameraPreviewProps {
  /** Called with the confirmed MediaStream when the user taps Confirm. */
  onConfirm: (stream: MediaStream) => void;
  /** Called when the user taps Skip (either step). */
  onSkip: () => void;
}

/**
 * Full-screen modal shown once at online game start. Replaces CameraPrompt
 * with a two-step flow: ask → preview with camera switching.
 */
export function CameraPreview({ onConfirm, onSkip }: CameraPreviewProps) {
  const [step, setStep] = useState<Step>("ask");
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

  /** Acquire camera and transition to preview. */
  async function handleEnable() {
    setLoading(true);
    setError(null);
    try {
      const s = await requestCamera({ kind: "facingMode", facingMode: "user" });
      setStream(s);
      setFacingMode("user");
      setStep("preview");

      // Enumerate devices after permission grant (labels are available now)
      if (!isNativePlatform()) {
        const videoDevices = await enumerateVideoDevices();
        setDevices(videoDevices);
        // Try to find the active device
        const activeTrack = s.getVideoTracks()[0];
        const activeSettings = activeTrack?.getSettings();
        if (activeSettings?.deviceId) {
          setSelectedDeviceId(activeSettings.deviceId);
        } else if (videoDevices.length > 0) {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      }
    } catch (err) {
      console.error("[CameraPreview] getUserMedia failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Camera error: ${msg}`);
    } finally {
      setLoading(false);
    }
  }

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

  function handleBack() {
    if (stream) stopAllTracks(stream);
    setStream(null);
    setStep("ask");
    setError(null);
  }

  // ── Ask step ──────────────────────────────────────────────────────
  if (step === "ask") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-sm mx-4 text-center space-y-6">
          <h2 className="text-3xl font-black text-white tracking-wide">
            Enable Camera?
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Your opponent will see your camera feed during their turn.
          </p>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <div className="flex gap-4">
            <button
              onClick={onSkip}
              className="flex-1 py-4 px-4 rounded-xl bg-zinc-800 text-zinc-300 font-bold uppercase tracking-widest text-lg transition-colors hover:bg-zinc-700"
            >
              Skip
            </button>
            <button
              onClick={handleEnable}
              disabled={loading}
              className="flex-1 py-4 px-4 rounded-xl font-bold uppercase tracking-widest text-lg transition-colors disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-game-accent)",
                color: "var(--color-game-accent-text)",
              }}
            >
              {loading ? "Starting…" : "Enable"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Preview step ──────────────────────────────────────────────────
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

          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}

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

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
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
            <button
              onClick={handleBack}
              className="w-full py-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold uppercase tracking-widest text-base transition-colors hover:bg-zinc-700"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
