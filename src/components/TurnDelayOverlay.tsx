interface TurnDelayOverlayProps {
  countdown: number;
  nextPlayerName?: string;
}

export function TurnDelayOverlay({
  countdown,
  nextPlayerName,
}: TurnDelayOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 bg-zinc-950/95 flex flex-col items-center justify-center gap-4">
      {countdown > 0 && (
        <p
          className="text-sm uppercase tracking-[0.3em] font-normal shrink-0"
          style={{
            fontFamily: "Beon, sans-serif",
            color: "var(--color-game-accent)",
            textShadow:
              "0 0 10px var(--color-game-accent), 0 0 30px var(--color-game-accent-glow)",
          }}
        >
          Remove Darts
        </p>
      )}
      {countdown > 0 && (
        <p
          className="text-[min(14rem,35vh)] font-normal leading-none tabular-nums shrink-0"
          style={{
            fontFamily: "Beon, sans-serif",
            color: "var(--color-game-accent)",
            textShadow:
              "0 0 20px var(--color-game-accent), 0 0 60px var(--color-game-accent), 0 0 100px var(--color-game-accent-glow)",
          }}
        >
          {countdown}
        </p>
      )}
      {nextPlayerName && (
        <p
          className={`font-normal shrink-0 ${countdown > 0 ? "text-2xl" : "text-[min(6rem,15vh)]"}`}
          style={{
            fontFamily: "Beon, sans-serif",
            color: "var(--color-game-accent)",
            textShadow:
              "0 0 15px var(--color-game-accent), 0 0 40px var(--color-game-accent-glow)",
          }}
        >
          {nextPlayerName} up next
        </p>
      )}
    </div>
  );
}
