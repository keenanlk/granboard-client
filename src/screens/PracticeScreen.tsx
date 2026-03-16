interface PracticeScreenProps {
  onBack: () => void;
  onSelectGame: (game: "highscore") => void;
}

const PRACTICE_GAMES = [
  {
    id: "highscore" as const,
    name: "High Score",
    description: "Most points wins",
    color: "#facc15",
    glow: "rgba(250, 204, 21, 0.5)",
  },
];

export function PracticeScreen({ onBack, onSelectGame }: PracticeScreenProps) {
  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden" style={{ paddingLeft: "var(--sal)" }}>
      <header
        className="flex items-center justify-between px-6 pb-3 shrink-0 bg-zinc-950"
        style={{ paddingTop: "calc(var(--sat) + 0.75rem)" }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-zinc-500 hover:text-white transition-colors text-sm uppercase tracking-wider font-bold"
          >
            ← Back
          </button>
          <h1
            className="text-3xl tracking-tight font-normal"
            style={{
              fontFamily: "Beon, sans-serif",
              color: "#a78bfa",
              textShadow: "0 0 15px #a78bfa, 0 0 40px rgba(167,139,250,0.5)",
            }}
          >
            Practice
          </h1>
        </div>
      </header>

      <main
        className="flex-1 flex flex-col px-6 gap-3 min-h-0"
        style={{ paddingBottom: "calc(var(--sab) + 1rem)" }}
      >
        <div className="flex-1 min-h-0 grid grid-cols-2 grid-rows-2 gap-3">
          {PRACTICE_GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className="w-full rounded-2xl px-6 text-left transition-all duration-150 flex flex-col justify-center bg-zinc-900 border-2 border-zinc-800"
              style={{ borderColor: undefined }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = game.color; e.currentTarget.style.boxShadow = `0 0 12px ${game.glow}`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              <p
                className="text-4xl tracking-tight font-normal"
                style={{
                  fontFamily: "Beon, sans-serif",
                  color: game.color,
                  textShadow: `0 0 20px ${game.color}, 0 0 60px ${game.color}, 0 0 100px ${game.glow}`,
                }}
              >
                {game.name}
              </p>
              <p className="text-zinc-500 text-sm mt-1 font-medium">
                {game.description}
              </p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
