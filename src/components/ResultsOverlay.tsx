interface PlayerResult {
  name: string;
  isWinner: boolean;
  rank: number;
  stats: { label: string; value: string }[];
}

interface ResultsOverlayProps {
  playerResults: PlayerResult[];
  onExit: () => void;
}

const RANK_MEDAL = ["🥇", "🥈", "🥉"];

export function ResultsOverlay({ playerResults, onExit }: ResultsOverlayProps) {
  const winners = playerResults.filter((p) => p.isWinner);
  const losers = playerResults.filter((p) => !p.isWinner);
  const isTie = winners.length > 1;

  return (
    <div className="absolute inset-0 z-10 bg-zinc-950/97 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 pt-10 pb-4 flex flex-col items-center gap-1">
        <p className="text-zinc-500 text-xs uppercase tracking-[0.25em]">Game Over</p>
        <p className="font-black text-sm uppercase tracking-widest text-[var(--color-game-accent)]">
          {isTie ? "It's a Tie!" : "Winner"}
        </p>
      </div>

      {/* Winner(s) */}
      <div className="shrink-0 flex flex-col items-center px-6 pb-6 gap-3">
        {winners.map((p) => (
          <div key={p.name} className="flex flex-col items-center gap-2 w-full">
            <p className="text-5xl font-black text-white leading-none">{p.name}</p>
            <div className="flex gap-3 flex-wrap justify-center">
              {p.stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center">
                  <span className="font-black text-xl tabular-nums leading-none text-[var(--color-game-accent)]">
                    {s.value}
                  </span>
                  <span className="text-zinc-600 text-[10px] uppercase tracking-wider">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      {losers.length > 0 && (
        <div className="shrink-0 mx-6 border-t border-zinc-800" />
      )}

      {/* Losers */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3 min-h-0">
        {losers.map((p) => (
          <div key={p.name} className="flex items-center gap-3">
            <span className="text-xl shrink-0 w-8 text-center">
              {RANK_MEDAL[p.rank - 1] ?? `${p.rank}.`}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-300 font-black text-base uppercase tracking-wide truncate">
                {p.name}
              </p>
              <div className="flex gap-3 flex-wrap mt-0.5">
                {p.stats.map((s) => (
                  <span key={s.label} className="text-zinc-500 text-xs tabular-nums">
                    {s.value} <span className="text-zinc-700">{s.label}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Back to Menu */}
      <div
        className="shrink-0 px-6 py-6"
        style={{ paddingBottom: "calc(var(--sab) + 1.5rem)" }}
      >
        <button onClick={onExit} className="btn-primary tracking-widest">
          Back to Menu
        </button>
      </div>
    </div>
  );
}
