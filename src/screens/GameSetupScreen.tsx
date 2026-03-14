import { useState } from "react";
import { DEFAULT_X01_OPTIONS, type X01Options } from "../store/useGameStore.ts";
import { DEFAULT_CRICKET_OPTIONS, type CricketOptions } from "../store/useCricketStore.ts";
import {
  DEFAULT_HIGHSCORE_OPTIONS,
  type HighScoreOptions,
} from "../store/useHighScoreStore.ts";
import { PlayerSelectStep, type RosterEntry } from "../components/PlayerSelectStep.tsx";

interface GameSetupScreenProps {
  game: "x01" | "cricket" | "highscore";
  onStart: (
    players: string[],
    playerIds: (string | null)[],
    x01Options?: X01Options,
    cricketOptions?: CricketOptions,
    highScoreOptions?: HighScoreOptions,
  ) => void;
  onBack: () => void;
}

const ROUND_OPTIONS = [8, 10, 15] as const;

export function GameSetupScreen({ game, onStart, onBack }: GameSetupScreenProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [roster, setRoster] = useState<RosterEntry[]>([
    { id: null, name: "Player 1" },
    { id: null, name: "Player 2" },
  ]);
  const [x01Options, setX01Options] = useState<X01Options>(DEFAULT_X01_OPTIONS);
  const [cricketOptions, setCricketOptions] = useState<CricketOptions>(DEFAULT_CRICKET_OPTIONS);
  const [highScoreOptions, setHighScoreOptions] = useState<HighScoreOptions>(DEFAULT_HIGHSCORE_OPTIONS);

  const setX01Option = <K extends keyof X01Options>(key: K, value: X01Options[K]) =>
    setX01Options((prev) => {
      const next = { ...prev, [key]: value };
      // doubleOut and masterOut are mutually exclusive
      if (key === "doubleOut" && value) next.masterOut = false;
      if (key === "masterOut" && value) next.doubleOut = false;
      return next;
    });

  const title = game === "x01" ? "X01" : game === "cricket" ? "Cricket" : "High Score";
  const accentClass =
    game === "x01" ? "text-red-500" : game === "cricket" ? "text-green-400" : "text-yellow-400";
  const btnClass =
    game === "x01"
      ? "bg-red-600 hover:bg-red-500 active:bg-red-700 text-white"
      : game === "cricket"
        ? "bg-green-600 hover:bg-green-500 active:bg-green-700 text-white"
        : "bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black";

  const handleBack = () => (step === 2 ? setStep(1) : onBack());

  return (
    <div
      className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden"
      style={{ paddingLeft: "var(--sal)", paddingRight: "var(--sar)" }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 pb-3 border-b border-zinc-800 shrink-0"
        style={{ paddingTop: "calc(var(--sat) + 0.75rem)" }}
      >
        <button
          onClick={handleBack}
          className="text-zinc-500 hover:text-white transition-colors text-sm uppercase tracking-wider w-14"
        >
          ← Back
        </button>
        <div className="flex flex-col items-center">
          <span className={`font-black text-xl tracking-widest ${accentClass}`}>
            {title}
          </span>
          <span className="text-zinc-600 text-xs uppercase tracking-widest">
            {step === 1 ? "Options" : "Players"}
          </span>
        </div>
        {/* Step dots */}
        <div className="flex items-center gap-1.5 w-14 justify-end">
          <span className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? (game === "x01" ? "bg-red-500" : game === "cricket" ? "bg-green-400" : "bg-yellow-400") : "bg-zinc-600"}`} />
          <span className={`w-2 h-2 rounded-full transition-colors ${step === 2 ? (game === "x01" ? "bg-red-500" : game === "cricket" ? "bg-green-400" : "bg-yellow-400") : "bg-zinc-600"}`} />
        </div>
      </header>

      {/* Step 1 — Options */}
      {step === 1 && (
        <>
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-5 py-4 gap-3 overflow-hidden">
            {game === "x01" && (
              <div className="grid grid-cols-3 gap-3 w-full" style={{ maxHeight: "min(100%, 320px)" }}>
                {(
                  [
                    { key: "splitBull" as const, label: "Split Bull", desc: "Outer bull scores 25" },
                    { key: "doubleOut" as const, label: "Double Out", desc: "Finish on a double" },
                    { key: "masterOut" as const, label: "Master Out", desc: "Finish on double, triple, or bull" },
                    { key: "doubleIn" as const, label: "Double In", desc: "Open on a double" },
                  ] as const
                ).map(({ key, label, desc }) => (
                  <button
                    key={key}
                    onClick={() => setX01Option(key, !x01Options[key])}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 transition-all duration-150 px-3 py-3 min-h-[80px] max-h-[160px] ${
                      x01Options[key]
                        ? "border-red-500 bg-red-950/30"
                        : "border-zinc-800 bg-zinc-900"
                    }`}
                  >
                    <span className={`text-xl font-black ${x01Options[key] ? "text-red-400" : "text-zinc-600"}`}>
                      {x01Options[key] ? "ON" : "OFF"}
                    </span>
                    <span className={`text-sm font-bold text-center leading-tight ${x01Options[key] ? "text-white" : "text-zinc-400"}`}>{label}</span>
                    <span className="text-xs text-zinc-500 text-center leading-tight">{desc}</span>
                  </button>
                ))}
              </div>
            )}

            {game === "cricket" && (
              <div className="grid grid-cols-2 gap-3 w-full" style={{ maxHeight: "min(100%, 200px)" }}>
                <button
                  onClick={() => setCricketOptions((prev) => ({ ...prev, singleBull: !prev.singleBull }))}
                  className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 transition-all duration-150 px-3 py-3 min-h-[80px] max-h-[160px] ${
                    cricketOptions.singleBull
                      ? "border-green-500 bg-green-950/30"
                      : "border-zinc-800 bg-zinc-900"
                  }`}
                >
                  <span className={`text-xl font-black ${cricketOptions.singleBull ? "text-green-400" : "text-zinc-600"}`}>
                    {cricketOptions.singleBull ? "ON" : "OFF"}
                  </span>
                  <span className={`text-sm font-bold text-center ${cricketOptions.singleBull ? "text-white" : "text-zinc-400"}`}>Split Bull</span>
                  <span className="text-xs text-zinc-500 text-center leading-tight">Both bull zones count as 1 mark</span>
                </button>
              </div>
            )}

            {game === "highscore" && (
              <div className="flex flex-col gap-3 w-full" style={{ maxHeight: "min(100%, 320px)" }}>
                <div className="flex gap-3">
                  {ROUND_OPTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setHighScoreOptions((prev) => ({ ...prev, rounds: r }))}
                      className={`flex-1 py-4 rounded-xl font-black text-2xl transition-colors border-2 ${
                        highScoreOptions.rounds === r
                          ? "border-yellow-500 bg-yellow-950/40 text-yellow-400"
                          : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() =>
                      setHighScoreOptions((prev) => ({
                        ...prev,
                        tieRule: prev.tieRule === "playoff" ? "stand" : "playoff",
                      }))
                    }
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 transition-all duration-150 px-3 py-3 min-h-[80px] max-h-[160px] ${
                      highScoreOptions.tieRule === "playoff"
                        ? "border-yellow-500 bg-yellow-950/30"
                        : "border-zinc-800 bg-zinc-900"
                    }`}
                  >
                    <span className={`text-xl font-black ${highScoreOptions.tieRule === "playoff" ? "text-yellow-400" : "text-zinc-600"}`}>
                      {highScoreOptions.tieRule === "playoff" ? "ON" : "OFF"}
                    </span>
                    <span className={`text-sm font-bold text-center ${highScoreOptions.tieRule === "playoff" ? "text-white" : "text-zinc-400"}`}>One-Dart Playoff</span>
                    <span className="text-xs text-zinc-500 text-center leading-tight">Throw 1 dart to break ties</span>
                  </button>
                  <button
                    onClick={() =>
                      setHighScoreOptions((prev) => ({
                        ...prev,
                        splitBull: !prev.splitBull,
                      }))
                    }
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 transition-all duration-150 px-3 py-3 min-h-[80px] max-h-[160px] ${
                      highScoreOptions.splitBull
                        ? "border-yellow-500 bg-yellow-950/30"
                        : "border-zinc-800 bg-zinc-900"
                    }`}
                  >
                    <span className={`text-xl font-black ${highScoreOptions.splitBull ? "text-yellow-400" : "text-zinc-600"}`}>
                      {highScoreOptions.splitBull ? "ON" : "OFF"}
                    </span>
                    <span className={`text-sm font-bold text-center ${highScoreOptions.splitBull ? "text-white" : "text-zinc-400"}`}>Split Bull</span>
                    <span className="text-xs text-zinc-500 text-center leading-tight">Outer bull scores 25</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            className="shrink-0 px-5 pt-3 border-t border-zinc-800 bg-black"
            style={{ paddingBottom: "calc(var(--sab) + 0.75rem)" }}
          >
            <button
              onClick={() => setStep(2)}
              className={`w-full py-4 rounded-2xl font-black text-2xl transition-colors ${btnClass}`}
            >
              Next →
            </button>
          </div>
        </>
      )}

      {/* Step 2 — Players */}
      {step === 2 && (
        <>
          <div className="flex-1 min-h-0 flex flex-col px-5 py-3 gap-2 overflow-hidden">
            <PlayerSelectStep
              roster={roster}
              onChange={setRoster}
              accentClass={accentClass}
              activeBg={game === "x01" ? "bg-red-950/50" : game === "cricket" ? "bg-green-950/50" : "bg-yellow-950/50"}
              activeBorder={game === "x01" ? "border-red-500" : game === "cricket" ? "border-green-500" : "border-yellow-500"}
            />
          </div>

          <div
            className="shrink-0 px-5 pt-3 border-t border-zinc-800 bg-black"
            style={{ paddingBottom: "calc(var(--sab) + 0.75rem)" }}
          >
            {game === "x01" ? (
              <div className="flex gap-3">
                {([301, 501, 701] as const).map((score) => (
                  <button
                    key={score}
                    onClick={() => onStart(roster.map(r => r.name), roster.map(r => r.id), { ...x01Options, startingScore: score })}
                    disabled={roster.length === 0}
                    className="flex-1 py-4 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-2xl transition-colors disabled:opacity-40"
                  >
                    {score}
                  </button>
                ))}
              </div>
            ) : game === "cricket" ? (
              <button
                onClick={() => onStart(roster.map(r => r.name), roster.map(r => r.id), undefined, cricketOptions)}
                disabled={roster.length === 0}
                className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-black text-2xl transition-colors disabled:opacity-40"
              >
                Start Cricket
              </button>
            ) : (
              <button
                onClick={() => onStart(roster.map(r => r.name), roster.map(r => r.id), undefined, undefined, highScoreOptions)}
                disabled={roster.length === 0}
                className="w-full py-4 rounded-2xl bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black font-black text-2xl transition-colors disabled:opacity-40"
              >
                Start — {highScoreOptions.rounds} Rounds
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
