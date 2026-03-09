import { useState } from "react";
import { useGranboardStore } from "../store/useGranboardStore.ts";
import { DEFAULT_X01_OPTIONS, type X01Options } from "../store/useGameStore.ts";
import { DEFAULT_CRICKET_OPTIONS, type CricketOptions } from "../store/useCricketStore.ts";

interface HomeScreenProps {
  onStartGame: (x01Options: X01Options, playerNames: string[]) => void;
  onStartCricket: (options: CricketOptions, playerNames: string[]) => void;
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
        checked ? "bg-red-600" : "bg-zinc-700"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

const MAX_PLAYERS = 8;

export function HomeScreen({ onStartGame, onStartCricket }: HomeScreenProps) {
  const { status, errorMessage, connect, disconnect } = useGranboardStore();
  const [x01Options, setX01Options] = useState<X01Options>(DEFAULT_X01_OPTIONS);
  const [cricketOptions, setCricketOptions] = useState<CricketOptions>(DEFAULT_CRICKET_OPTIONS);
  const [playerNames, setPlayerNames] = useState(["Player 1", "Player 2"]);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  const setOption = <K extends keyof X01Options>(
    key: K,
    value: X01Options[K],
  ) => setX01Options((prev) => ({ ...prev, [key]: value }));

  const addPlayer = () => {
    if (playerNames.length >= MAX_PLAYERS) return;
    setPlayerNames((prev) => [...prev, `Player ${prev.length + 1}`]);
  };

  const removePlayer = (i: number) =>
    setPlayerNames((prev) => prev.filter((_, idx) => idx !== i));

  const renamePlayer = (i: number, name: string) =>
    setPlayerNames((prev) => prev.map((n, idx) => (idx === i ? name : n)));

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-8 p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-6xl font-black tracking-tight text-white">
          NLC <span className="text-red-500">Darts</span>
        </h1>
        <p className="mt-2 text-zinc-500 text-sm tracking-widest uppercase">
          Granboard Controller
        </p>
      </div>

      {/* Connection status */}
      <div className="flex items-center gap-2">
        <span
          className={`size-2.5 rounded-full ${
            isConnected
              ? "bg-green-500 shadow-[0_0_8px_2px_rgba(34,197,94,0.5)]"
              : isConnecting
                ? "bg-yellow-400 animate-pulse"
                : status === "error"
                  ? "bg-red-500"
                  : "bg-zinc-600"
          }`}
        />
        <span className="text-sm text-zinc-400 capitalize">
          {isConnecting ? "Connecting…" : status}
        </span>
      </div>

      {status === "error" && errorMessage && (
        <p className="text-red-400 text-sm text-center max-w-xs">
          {errorMessage}
        </p>
      )}

      {isConnected ? (
        <div className="flex flex-col items-center gap-5 w-full max-w-sm">
          {/* Players */}
          <div className="flex flex-col gap-2 w-full">
            <p className="text-zinc-500 text-xs uppercase tracking-widest">
              Players
            </p>
            <div className="flex flex-col gap-1.5">
              {playerNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-zinc-600 text-sm w-5 text-right shrink-0">
                    {i + 1}
                  </span>
                  <input
                    value={name}
                    onChange={(e) => renamePlayer(i, e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-white text-sm font-medium focus:outline-none focus:border-zinc-600"
                  />
                  {playerNames.length > 1 && (
                    <button
                      onClick={() => removePlayer(i)}
                      className="text-zinc-700 hover:text-red-400 transition-colors text-lg leading-none px-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {playerNames.length < MAX_PLAYERS && (
              <button
                onClick={addPlayer}
                className="w-full py-2 rounded-lg border border-dashed border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 text-sm transition-colors"
              >
                + Add Player
              </button>
            )}
          </div>

          {/* Game selection */}
          <div className="flex flex-col gap-3 w-full">
            <p className="text-zinc-500 text-xs uppercase tracking-widest">
              x01
            </p>
            <div className="flex gap-3 w-full">
              {([301, 501, 701] as const).map((score) => (
                <button
                  key={score}
                  onClick={() =>
                    onStartGame({ ...x01Options, startingScore: score }, playerNames)
                  }
                  className="flex-1 py-4 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-lg transition-colors"
                >
                  {score}
                </button>
              ))}
            </div>

            {/* x01 options */}
            <div className="flex flex-col gap-1 rounded-xl border border-zinc-800 overflow-hidden">
              <label className="flex items-center justify-between px-4 py-3 bg-zinc-900">
                <div>
                  <p className="text-sm font-medium text-white">
                    Bulls Not Split
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Entire bull zone scores 50
                  </p>
                </div>
                <Toggle
                  checked={x01Options.bullsNotSplit}
                  onChange={(v) => setOption("bullsNotSplit", v)}
                />
              </label>
              <label className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-t border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-white">Double Out</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Final dart must be a double or bull
                  </p>
                </div>
                <Toggle
                  checked={x01Options.doubleOut}
                  onChange={(v) => setOption("doubleOut", v)}
                />
              </label>
              <label className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-t border-zinc-800">
                <div>
                  <p className="text-sm font-medium text-white">Double In</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Must hit a double or bull to start scoring
                  </p>
                </div>
                <Toggle
                  checked={x01Options.doubleIn}
                  onChange={(v) => setOption("doubleIn", v)}
                />
              </label>
            </div>
          </div>

          {/* Cricket */}
          <div className="flex flex-col gap-3 w-full">
            <p className="text-zinc-500 text-xs uppercase tracking-widest">
              Cricket
            </p>
            <button
              onClick={() => onStartCricket(cricketOptions, playerNames)}
              className="w-full py-4 rounded-xl bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-800 text-white font-bold text-lg transition-colors"
            >
              Start Cricket
            </button>
            <div className="flex flex-col gap-1 rounded-xl border border-zinc-800 overflow-hidden">
              <label className="flex items-center justify-between px-4 py-3 bg-zinc-900">
                <div>
                  <p className="text-sm font-medium text-white">Single Bull</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Both bull zones count as 1 mark
                  </p>
                </div>
                <Toggle
                  checked={cricketOptions.singleBull}
                  onChange={(v) => setCricketOptions((prev) => ({ ...prev, singleBull: v }))}
                />
              </label>
            </div>
          </div>

          <button
            onClick={disconnect}
            className="text-zinc-600 hover:text-zinc-400 text-xs underline transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          disabled={isConnecting}
          className="px-10 py-4 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold text-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {isConnecting ? "Connecting…" : "Connect to Granboard"}
        </button>
      )}
    </div>
  );
}
