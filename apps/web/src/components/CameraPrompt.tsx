interface CameraPromptProps {
  /** Called when the user taps "Enable" — starts the camera and WebRTC flow. */
  onAccept: () => void;
  /** Called when the user taps "Skip" — game proceeds without camera. */
  onSkip: () => void;
}

/**
 * Full-screen modal shown once at online game start, asking the player
 * whether to share their camera feed with their opponent.
 *
 * Camera is fully opt-in: skipping has no effect on gameplay.
 */
export function CameraPrompt({ onAccept, onSkip }: CameraPromptProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-sm mx-4 text-center space-y-6">
        <h2 className="text-2xl font-black text-white tracking-wide">
          Enable Camera?
        </h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Your opponent will see your camera feed during their turn.
        </p>
        <div className="flex gap-4">
          <button
            onClick={onSkip}
            className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 text-zinc-300 font-bold uppercase tracking-widest text-sm transition-colors hover:bg-zinc-700"
          >
            Skip
          </button>
          <button
            onClick={onAccept}
            className="flex-1 py-3 px-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-colors"
            style={{
              backgroundColor: "var(--color-game-accent)",
              color: "var(--color-game-accent-text)",
            }}
          >
            Enable
          </button>
        </div>
      </div>
    </div>
  );
}
