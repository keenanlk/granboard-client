interface TurnDelayOverlayProps {
  countdown: number;
  nextPlayerName?: string;
}

export function TurnDelayOverlay({ countdown, nextPlayerName }: TurnDelayOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 bg-zinc-950/95 flex flex-col items-center justify-center gap-4">
      <p className="text-zinc-500 text-sm uppercase tracking-[0.3em] font-bold shrink-0">
        Remove Darts
      </p>
      <p className="text-[min(14rem,35vh)] font-black text-white leading-none tabular-nums shrink-0">
        {countdown}
      </p>
      {nextPlayerName && (
        <p className="text-zinc-300 text-2xl font-bold shrink-0">
          {nextPlayerName} up next
        </p>
      )}
    </div>
  );
}
