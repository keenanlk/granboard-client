import { useRef, useCallback } from "react";
import { useGranboardStore } from "../store/useGranboardStore.ts";

interface HomeScreenProps {
  onSelectGame: (game: "x01" | "cricket") => void;
  onSetMatch: () => void;
  onPractice: () => void;
  onPlayers: () => void;
  onOnline: () => void;
}

const GAMES = [
  {
    id: "x01" as const,
    name: "X01",
    description: "301 · 501 · 701",
    accent: "red",
    color: "#ef4444",
    glow: "rgba(239, 68, 68, 0.5)",
  },
  {
    id: "cricket" as const,
    name: "Cricket",
    description: "Standard cricket scoring",
    accent: "green",
    color: "#4ade80",
    glow: "rgba(74, 222, 128, 0.5)",
  },
];

const LONG_PRESS_MS = 7000;

export function HomeScreen({
  onSelectGame,
  onSetMatch,
  onPractice,
  onPlayers,
  onOnline,
}: HomeScreenProps) {
  const { status, errorMessage, connect, disconnect, connectMock } =
    useGranboardStore();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const startLongPress = useCallback(() => {
    clearLongPress();
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      connectMock();
    }, LONG_PRESS_MS);
  }, [clearLongPress, connectMock]);

  const handleClick = useCallback(() => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    if (isConnected) disconnect();
    else if (!isConnecting) connect();
  }, [isConnected, isConnecting, connect, disconnect]);

  return (
    <div
      className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden"
      style={{ paddingLeft: "var(--sal)" }}
    >
      {/* Header — padded for notch */}
      <header
        className="flex items-center justify-between px-6 pb-3 shrink-0 bg-zinc-950"
        style={{ paddingTop: "calc(var(--sat) + 0.75rem)" }}
      >
        <div className="flex items-center gap-4">
          <h1
            className="text-3xl tracking-tight font-normal"
            style={{
              fontFamily: "Beon, sans-serif",
              color: "#fff",
              textShadow:
                "0 0 10px rgba(255,255,255,0.5), 0 0 30px rgba(255,255,255,0.2)",
            }}
          >
            NLC{" "}
            <span
              style={{
                color: "#ef4444",
                textShadow: "0 0 15px #ef4444, 0 0 40px rgba(239,68,68,0.5)",
              }}
            >
              Darts
            </span>
          </h1>
          <button
            onClick={onPlayers}
            className="text-zinc-500 hover:text-white transition-colors text-sm uppercase tracking-wider font-bold"
          >
            Players
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClick}
            disabled={isConnecting}
            onMouseDown={
              !isConnected && !isConnecting ? startLongPress : undefined
            }
            onMouseUp={clearLongPress}
            onMouseLeave={clearLongPress}
            onTouchStart={
              !isConnected && !isConnecting ? startLongPress : undefined
            }
            onTouchEnd={clearLongPress}
            onTouchCancel={clearLongPress}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors select-none ${
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
              {isConnecting
                ? "Connecting…"
                : isConnected
                  ? "Connected"
                  : "Connect"}
            </span>
          </button>
        </div>
      </header>

      {status === "error" && errorMessage && (
        <p className="px-6 pb-2 text-red-400 text-sm shrink-0">
          {errorMessage}
        </p>
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

        <div className="flex-1 min-h-0 grid grid-cols-3 grid-rows-2 gap-3">
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              disabled={!isConnected}
              className="w-full rounded-2xl px-6 text-left transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed flex flex-col justify-center bg-zinc-900 border-2 border-zinc-800"
              style={{ borderColor: undefined }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = game.color;
                e.currentTarget.style.boxShadow = `0 0 12px ${game.glow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.boxShadow = "";
              }}
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

          <button
            onClick={onSetMatch}
            disabled={!isConnected}
            className="w-full rounded-2xl px-6 text-left transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed flex flex-col justify-center bg-zinc-900 border-2 border-zinc-800 hover:border-blue-500"
            style={{ borderColor: undefined }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#60a5fa";
              e.currentTarget.style.boxShadow = "0 0 12px rgba(96,165,250,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "";
              e.currentTarget.style.boxShadow = "";
            }}
          >
            <p
              className="text-4xl tracking-tight font-normal"
              style={{
                fontFamily: "Beon, sans-serif",
                color: "#60a5fa",
                textShadow:
                  "0 0 20px #60a5fa, 0 0 60px #60a5fa, 0 0 100px rgba(96, 165, 250, 0.5)",
              }}
            >
              Set Match
            </p>
            <p className="text-zinc-500 text-sm mt-1 font-medium">
              Best of 3 or 5 · Mix games
            </p>
          </button>

          <button
            onClick={onPractice}
            disabled={!isConnected}
            className="w-full rounded-2xl px-6 text-left transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed flex flex-col justify-center bg-zinc-900 border-2 border-zinc-800"
            style={{ borderColor: undefined }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#a78bfa";
              e.currentTarget.style.boxShadow =
                "0 0 12px rgba(167,139,250,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "";
              e.currentTarget.style.boxShadow = "";
            }}
          >
            <p
              className="text-4xl tracking-tight font-normal"
              style={{
                fontFamily: "Beon, sans-serif",
                color: "#a78bfa",
                textShadow:
                  "0 0 20px #a78bfa, 0 0 60px #a78bfa, 0 0 100px rgba(167,139,250,0.5)",
              }}
            >
              Practice
            </p>
            <p className="text-zinc-500 text-sm mt-1 font-medium">
              Solo practice games
            </p>
          </button>

          <button
            onClick={onOnline}
            className="w-full rounded-2xl px-6 text-left transition-all duration-150 flex flex-col justify-center bg-zinc-900 border-2 border-zinc-800"
            style={{ borderColor: undefined }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#f59e0b";
              e.currentTarget.style.boxShadow = "0 0 12px rgba(245,158,11,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "";
              e.currentTarget.style.boxShadow = "";
            }}
          >
            <p
              className="text-4xl tracking-tight font-normal"
              style={{
                fontFamily: "Beon, sans-serif",
                color: "#f59e0b",
                textShadow:
                  "0 0 20px #f59e0b, 0 0 60px #f59e0b, 0 0 100px rgba(245,158,11,0.5)",
              }}
            >
              Online
            </p>
            <p className="text-zinc-500 text-sm mt-1 font-medium">
              Play against others
            </p>
          </button>
        </div>
      </main>
    </div>
  );
}
