import { useGranboardStore } from "../store/useGranboardStore.ts";

interface HomeScreenProps {
  onSelectGame: (game: "x01" | "cricket" | "highscore") => void;
  onPlayers: () => void;
}

const GAMES = [
  {
    id: "x01" as const,
    name: "X01",
    description: "301 · 501 · 701",
    accent: "red",
  },
  {
    id: "cricket" as const,
    name: "Cricket",
    description: "Standard cricket scoring",
    accent: "green",
  },
  {
    id: "highscore" as const,
    name: "High Score",
    description: "Most points wins",
    accent: "yellow",
  },
];

export function HomeScreen({ onSelectGame, onPlayers }: HomeScreenProps) {
  const { status, errorMessage, connect, disconnect } = useGranboardStore();

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden" style={{ paddingLeft: "var(--sal)", paddingRight: "var(--sar)" }}>
      {/* Header — padded for notch */}
      <header
        className="flex items-center justify-between px-6 pb-3 shrink-0 bg-zinc-950"
        style={{ paddingTop: "calc(var(--sat) + 0.75rem)" }}
      >
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-black tracking-tight">
            NLC <span className="text-red-500">Darts</span>
          </h1>
          <button
            onClick={onPlayers}
            className="text-zinc-500 hover:text-white transition-colors text-sm uppercase tracking-wider font-bold"
          >
            Players
          </button>
        </div>

        <button
          onClick={isConnected ? disconnect : isConnecting ? undefined : connect}
          disabled={isConnecting}
          className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
            isConnected
              ? "border-green-800 bg-green-950/40 text-green-400 hover:bg-red-950/40 hover:border-red-800 hover:text-red-400"
              : isConnecting
                ? "border-yellow-800 bg-yellow-950/40 text-yellow-400 cursor-default"
                : status === "error"
                  ? "border-red-800 bg-red-950/40 text-red-400 hover:bg-red-900/40"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-white"
          }`}
        >
          <span
            className={`size-2 rounded-full ${
              isConnected
                ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.7)]"
                : isConnecting
                  ? "bg-yellow-400 animate-pulse"
                  : status === "error"
                    ? "bg-red-500"
                    : "bg-zinc-600"
            }`}
          />
          <span className="text-sm font-bold capitalize">
            {isConnecting ? "Connecting…" : isConnected ? "Connected" : "Connect"}
          </span>
        </button>
      </header>

      {status === "error" && errorMessage && (
        <p className="px-6 pb-2 text-red-400 text-sm shrink-0">{errorMessage}</p>
      )}

      {/* Game list — tiles fill all remaining space equally */}
      <main
        className="flex-1 flex flex-col px-6 gap-3 min-h-0"
        style={{ paddingBottom: "calc(var(--sab) + 1rem)" }}
      >
        {!isConnected && (
          <p className="text-center text-zinc-600 text-sm uppercase tracking-widest pt-2 shrink-0">
            Connect to board to play
          </p>
        )}

        {GAMES.map((game) => (
          <button
            key={game.id}
            onClick={() => onSelectGame(game.id)}
            disabled={!isConnected}
            className={`flex-1 min-h-0 w-full rounded-2xl px-6 text-left transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed flex flex-col justify-center ${
              game.accent === "red"
                ? "bg-zinc-900 border-2 border-zinc-800 hover:border-red-700 hover:bg-red-950/20 active:bg-red-950/40"
                : game.accent === "green"
                  ? "bg-zinc-900 border-2 border-zinc-800 hover:border-green-700 hover:bg-green-950/20 active:bg-green-950/40"
                  : "bg-zinc-900 border-2 border-zinc-800 hover:border-yellow-700 hover:bg-yellow-950/20 active:bg-yellow-950/40"
            }`}
          >
            <p
              className={`text-4xl font-black tracking-tight ${
                game.accent === "red"
                  ? "text-red-500"
                  : game.accent === "green"
                    ? "text-green-400"
                    : "text-yellow-400"
              }`}
            >
              {game.name}
            </p>
            <p className="text-zinc-500 text-sm mt-1 font-medium">
              {game.description}
            </p>
          </button>
        ))}
      </main>
    </div>
  );
}
