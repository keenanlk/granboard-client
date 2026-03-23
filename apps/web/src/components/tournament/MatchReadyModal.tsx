interface MatchReadyModalProps {
  opponentName: string;
  gameInfo: string;
  onGoToMatch: () => void;
  onDismiss: () => void;
}

export function MatchReadyModal({
  opponentName,
  gameInfo,
  onGoToMatch,
  onDismiss,
}: MatchReadyModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full mx-6 flex flex-col items-center gap-6">
        <h2 className="text-3xl font-black text-amber-400 uppercase tracking-widest text-center">
          YOUR MATCH IS READY
        </h2>

        <p className="text-2xl font-bold text-white text-center">
          vs {opponentName}
        </p>

        <span className="px-4 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-sm font-bold text-zinc-300">
          {gameInfo}
        </span>

        <button
          onClick={onGoToMatch}
          className="w-full py-5 rounded-2xl bg-green-600 text-white text-2xl font-black uppercase tracking-widest active:bg-green-500 transition-colors"
        >
          GO TO MATCH
        </button>

        <button
          onClick={onDismiss}
          className="px-6 py-2 rounded-xl text-zinc-500 text-sm font-medium"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
