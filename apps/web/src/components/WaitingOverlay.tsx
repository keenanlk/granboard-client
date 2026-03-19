interface WaitingOverlayProps {
  message?: string;
  onCancel?: () => void;
}

export function WaitingOverlay({
  message = "Waiting for opponent…",
  onCancel,
}: WaitingOverlayProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        {/* Pulsing ring animation */}
        <div className="relative size-20">
          <div className="absolute inset-0 rounded-full border-4 border-amber-500/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border-4 border-amber-500/50 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-amber-500/20" />
        </div>
        <p className="text-white text-xl font-black uppercase tracking-widest">
          {message}
        </p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-zinc-500 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
