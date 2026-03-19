import { useEffect, useState } from "react";
import { DEFAULT_X01_OPTIONS } from "../engine/x01.types.ts";
import type { X01Options } from "../engine/x01.types.ts";
import { DEFAULT_CRICKET_OPTIONS } from "../engine/cricket.types.ts";
import type { CricketOptions } from "../engine/cricket.types.ts";
import { useOnlineStore } from "../store/useOnlineStore.ts";
import type { OnlineGameType } from "../store/online.types.ts";

interface OnlineSetupScreenProps {
  gameType: OnlineGameType;
  hostName: string;
  guestName: string;
  isHost: boolean;
  onStart: (gameType: OnlineGameType, options: unknown) => void;
  onBack: () => void;
}

const STARTING_SCORES = [301, 501, 701] as const;

export function OnlineSetupScreen({
  gameType,
  hostName,
  guestName,
  isHost,
  onStart,
  onBack,
}: OnlineSetupScreenProps) {
  const [x01Options, setX01Options] = useState<X01Options>(DEFAULT_X01_OPTIONS);
  const [cricketOptions, setCricketOptions] = useState<CricketOptions>(
    DEFAULT_CRICKET_OPTIONS,
  );

  const setX01Option = <K extends keyof X01Options>(
    key: K,
    value: X01Options[K],
  ) =>
    setX01Options((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "doubleOut" && value) next.masterOut = false;
      if (key === "masterOut" && value) next.doubleOut = false;
      return next;
    });

  // Guest: listen for game_started from host
  useEffect(() => {
    if (isHost) return;
    const { roomChannel } = useOnlineStore.getState();
    if (!roomChannel) return;

    roomChannel.on(
      "broadcast",
      { event: "game_started" },
      ({
        payload,
      }: {
        payload: {
          gameType: OnlineGameType;
          options: unknown;
          playerNames: string[];
        };
      }) => {
        onStart(payload.gameType, payload.options);
      },
    );

    // Listen for host leaving while guest waits
    roomChannel.on("broadcast", { event: "player_left" }, () => {
      onBack();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost]);

  function handleStart() {
    if (gameType === "x01") {
      onStart("x01", x01Options);
    } else if (gameType === "cricket") {
      onStart("cricket", cricketOptions);
    } else {
      onStart("set", x01Options);
    }
  }

  // Guest: show waiting screen
  if (!isHost) {
    return (
      <div className="h-screen bg-zinc-950 text-white flex flex-col items-center justify-center gap-8 px-6">
        <button
          onClick={onBack}
          className="absolute top-6 left-6 text-zinc-500 hover:text-white transition-colors text-sm uppercase tracking-wider font-bold"
          style={{ top: "calc(var(--sat) + 1.5rem)" }}
        >
          Leave
        </button>

        <div className="flex items-center gap-6">
          <p className="text-xl font-black uppercase tracking-widest text-white">
            {hostName}
          </p>
          <span className="text-zinc-600 text-2xl font-black">vs</span>
          <p className="text-xl font-black uppercase tracking-widest text-amber-400">
            {guestName}
          </p>
        </div>

        {/* Pulsing animation */}
        <div className="relative size-16">
          <div className="absolute inset-0 rounded-full border-4 border-amber-500/30 animate-ping" />
          <div className="absolute inset-2 rounded-full border-4 border-amber-500/50 animate-pulse" />
        </div>

        <p className="text-zinc-400 text-lg uppercase tracking-widest font-bold">
          Host is configuring the game…
        </p>
      </div>
    );
  }

  // Host: game setup form
  return (
    <div
      className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden"
      style={{ paddingLeft: "var(--sal)" }}
    >
      <header
        className="flex items-center justify-between px-6 pb-3 shrink-0 bg-zinc-950"
        style={{ paddingTop: "calc(var(--sat) + 0.75rem)" }}
      >
        <button
          onClick={onBack}
          className="text-zinc-500 hover:text-white transition-colors text-sm uppercase tracking-wider font-bold"
        >
          Cancel
        </button>
        <h1
          className="text-2xl tracking-tight font-normal"
          style={{
            fontFamily: "Beon, sans-serif",
            color: "#f59e0b",
            textShadow:
              "0 0 10px rgba(245,158,11,0.5), 0 0 30px rgba(245,158,11,0.2)",
          }}
        >
          Game Setup
        </h1>
        <div style={{ width: 60 }} />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-6 px-6 overflow-y-auto">
        {/* Players */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">
              Host
            </p>
            <p className="text-xl font-black uppercase tracking-widest text-white">
              {hostName}
            </p>
          </div>
          <span className="text-zinc-600 text-2xl font-black">vs</span>
          <div className="text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-widest">
              Guest
            </p>
            <p className="text-xl font-black uppercase tracking-widest text-white">
              {guestName}
            </p>
          </div>
        </div>

        {/* Game-specific options */}
        {gameType === "x01" && (
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <div className="flex flex-col gap-2">
              <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">
                Starting Score
              </p>
              <div className="flex gap-2">
                {STARTING_SCORES.map((score) => (
                  <button
                    key={score}
                    onClick={() => setX01Option("startingScore", score)}
                    className={`flex-1 py-3 rounded-xl font-black text-lg uppercase tracking-widest transition-colors ${
                      x01Options.startingScore === score
                        ? "bg-red-600 text-white"
                        : "bg-zinc-900 text-zinc-400 border border-zinc-700"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>

            {(
              [
                ["doubleIn", "Double In"],
                ["doubleOut", "Double Out"],
                ["masterOut", "Master Out"],
                ["splitBull", "Split Bull"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setX01Option(key, !x01Options[key])}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-colors text-left flex items-center justify-between ${
                  x01Options[key]
                    ? "bg-red-950/40 border border-red-800 text-red-400"
                    : "bg-zinc-900 border border-zinc-700 text-zinc-500"
                }`}
              >
                {label}
                <span
                  className={`size-5 rounded-full border-2 transition-colors ${
                    x01Options[key]
                      ? "bg-red-500 border-red-500"
                      : "border-zinc-600"
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        {gameType === "cricket" && (
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <button
              onClick={() =>
                setCricketOptions((o) => ({ ...o, cutThroat: !o.cutThroat }))
              }
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-colors text-left flex items-center justify-between ${
                cricketOptions.cutThroat
                  ? "bg-green-950/40 border border-green-800 text-green-400"
                  : "bg-zinc-900 border border-zinc-700 text-zinc-500"
              }`}
            >
              Cut-Throat
              <span
                className={`size-5 rounded-full border-2 transition-colors ${
                  cricketOptions.cutThroat
                    ? "bg-green-500 border-green-500"
                    : "border-zinc-600"
                }`}
              />
            </button>
            <button
              onClick={() =>
                setCricketOptions((o) => ({
                  ...o,
                  singleBull: !o.singleBull,
                }))
              }
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-colors text-left flex items-center justify-between ${
                cricketOptions.singleBull
                  ? "bg-green-950/40 border border-green-800 text-green-400"
                  : "bg-zinc-900 border border-zinc-700 text-zinc-500"
              }`}
            >
              Split Bull
              <span
                className={`size-5 rounded-full border-2 transition-colors ${
                  cricketOptions.singleBull
                    ? "bg-green-500 border-green-500"
                    : "border-zinc-600"
                }`}
              />
            </button>
          </div>
        )}

        {gameType === "set" && (
          <p className="text-zinc-500 text-sm uppercase tracking-widest">
            Set match options configured after starting
          </p>
        )}

        <button
          onClick={handleStart}
          className="w-full max-w-sm py-4 rounded-xl font-black text-lg uppercase tracking-widest bg-amber-600 text-white active:bg-amber-700 transition-colors"
        >
          Start Game
        </button>
      </main>
    </div>
  );
}
