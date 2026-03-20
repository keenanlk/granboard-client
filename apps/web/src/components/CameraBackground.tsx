import { useEffect, useRef, useState } from "react";

interface CameraBackgroundProps {
  /** Local camera MediaStream (from getUserMedia). */
  localStream: MediaStream | null;
  /** Remote peer's camera MediaStream (from WebRTC). */
  remoteStream: MediaStream | null;
  /** Index of the player whose turn it currently is. */
  currentPlayerIndex: number;
  /** Index of the local player (0 for host, 1 for guest). */
  localPlayerIndex: number;
}

/**
 * Renders a single `<video>` element that fades in/out based on `visible`.
 * Binds the given MediaStream to the video element and auto-plays it.
 */
function VideoLayer({
  stream,
  visible,
}: {
  stream: MediaStream | null;
  visible: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && stream) {
      el.srcObject = stream;
      // iOS WKWebView requires explicit play() even with autoplay attribute
      el.play().catch(() => {});
    }
  }, [stream]);

  if (!stream) return null;

  return (
    <video
      ref={ref}
      autoPlay
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    />
  );
}

/**
 * Renders the active thrower's camera feed as a background layer.
 *
 * When it's the local player's turn, shows the local camera.
 * When it's the remote player's turn, shows the remote camera.
 * Streams crossfade with a ~300 ms opacity transition.
 *
 * Includes a dark overlay (60% black) and a radial vignette to ensure
 * the neon score text remains legible over the video.
 *
 * This component should be placed inside a `relative overflow-hidden` container
 * (e.g. the score panel in GameScreen). All content above it needs `relative z-10`.
 */
export function CameraBackground({
  localStream,
  remoteStream,
  currentPlayerIndex,
  localPlayerIndex,
}: CameraBackgroundProps) {
  const [activeIndex, setActiveIndex] = useState(currentPlayerIndex);

  // Debounce the swap slightly to sync with the opacity transition
  useEffect(() => {
    const t = setTimeout(() => setActiveIndex(currentPlayerIndex), 50);
    return () => clearTimeout(t);
  }, [currentPlayerIndex]);

  const showLocal = activeIndex === localPlayerIndex;
  const hasAnyStream = localStream || remoteStream;

  if (!hasAnyStream) return null;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden rounded-lg">
      <VideoLayer stream={localStream} visible={showLocal} />
      <VideoLayer stream={remoteStream} visible={!showLocal} />
      {/* Dark overlay + vignette for readability */}
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </div>
  );
}
