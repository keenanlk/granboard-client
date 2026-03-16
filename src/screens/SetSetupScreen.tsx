import { useState } from "react";
import { DEFAULT_X01_OPTIONS, type X01Options } from "../engine/x01Engine.ts";
import { DEFAULT_CRICKET_OPTIONS } from "../engine/cricketEngine.ts";
import { PlayerSelectStep, BotSkill, type RosterEntry } from "../components/PlayerSelectStep.tsx";
import type { BotSkill as BotSkillType } from "../bot/Bot.ts";
import type { SetConfig, SetFormat, LegConfig, ThrowOrder } from "../lib/setTypes.ts";
import { legCount } from "../lib/setTypes.ts";

interface SetSetupScreenProps {
  onStart: (
    config: SetConfig,
    playerNames: string[],
    playerIds: (string | null)[],
    botSkills: (BotSkillType | null)[],
  ) => void;
  onBack: () => void;
}

const CRICKET_ROUND_OPTIONS = [15, 20, 25, 0] as const;

function defaultLeg(): LegConfig {
  return { gameType: "x01", x01Options: { ...DEFAULT_X01_OPTIONS } };
}

function legSummary(leg: LegConfig): string {
  if (leg.gameType === "cricket") {
    const opts = leg.cricketOptions ?? DEFAULT_CRICKET_OPTIONS;
    const parts: string[] = [];
    if (opts.cutThroat) parts.push("Cut-Throat");
    if (opts.roundLimit > 0) parts.push(`${opts.roundLimit} Rnd`);
    else parts.push("No Limit");
    if (opts.singleBull) parts.push("Split Bull");
    return parts.join(" · ");
  }
  const opts = leg.x01Options ?? DEFAULT_X01_OPTIONS;
  const parts: string[] = [String(opts.startingScore)];
  if (opts.splitBull) parts.push("Split Bull");
  if (opts.doubleIn) parts.push("Dbl In");
  if (opts.doubleOut) parts.push("Dbl Out");
  if (opts.masterOut) parts.push("Master Out");
  if (parts.length === 1) parts.push("Straight Out");
  return parts.join(" · ");
}

function LegOptionsEditor({
  leg,
  onChange,
  onDone,
}: {
  leg: LegConfig;
  onChange: (leg: LegConfig) => void;
  onDone: () => void;
}) {
  const setGameType = (gameType: "x01" | "cricket") => {
    if (gameType === "x01") {
      onChange({ gameType: "x01", x01Options: { ...DEFAULT_X01_OPTIONS } });
    } else {
      onChange({ gameType: "cricket", cricketOptions: { ...DEFAULT_CRICKET_OPTIONS } });
    }
  };

  const setX01Option = <K extends keyof X01Options>(key: K, value: X01Options[K]) => {
    const prev = leg.x01Options ?? DEFAULT_X01_OPTIONS;
    const next = { ...prev, [key]: value };
    if (key === "doubleOut" && value) next.masterOut = false;
    if (key === "masterOut" && value) next.doubleOut = false;
    onChange({ ...leg, x01Options: next });
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Game type + score in one row */}
      <div className="flex gap-2">
        <button
          onClick={() => setGameType("x01")}
          className="option-card flex-1 py-2"
          data-active={String(leg.gameType === "x01")}
        >
          <span className={`font-black text-lg ${leg.gameType === "x01" ? "text-red-500" : "text-content-muted"}`}>X01</span>
        </button>
        <button
          onClick={() => setGameType("cricket")}
          className="option-card flex-1 py-2"
          data-active={String(leg.gameType === "cricket")}
        >
          <span className={`font-black text-lg ${leg.gameType === "cricket" ? "text-green-400" : "text-content-muted"}`}>Cricket</span>
        </button>
      </div>

      {/* Game-specific options */}
      {leg.gameType === "x01" && (
        <>
          <div className="flex gap-2">
            {([301, 501, 701] as const).map((score) => (
              <button
                key={score}
                onClick={() => onChange({ ...leg, x01Options: { ...(leg.x01Options ?? DEFAULT_X01_OPTIONS), startingScore: score } })}
                className="option-card flex-1 py-2"
                data-active={String((leg.x01Options ?? DEFAULT_X01_OPTIONS).startingScore === score)}
              >
                <span className={`font-black text-xl ${(leg.x01Options ?? DEFAULT_X01_OPTIONS).startingScore === score ? "text-red-500" : "text-content-muted"}`}>
                  {score}
                </span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {([
              { key: "splitBull" as const, label: "Split Bull" },
              { key: "doubleOut" as const, label: "Dbl Out" },
              { key: "masterOut" as const, label: "Master Out" },
              { key: "doubleIn" as const, label: "Dbl In" },
            ]).map(({ key, label }) => {
              const opts = leg.x01Options ?? DEFAULT_X01_OPTIONS;
              return (
                <button
                  key={key}
                  onClick={() => setX01Option(key, !opts[key])}
                  className="option-card py-2"
                  data-active={String(opts[key])}
                >
                  <span className={`text-sm font-black ${opts[key] ? "text-red-500" : "text-content-faint"}`}>
                    {opts[key] ? "ON" : "OFF"}
                  </span>
                  <span className={`text-[11px] font-bold ${opts[key] ? "text-content-primary" : "text-zinc-400"}`}>{label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {leg.gameType === "cricket" && (
        <>
          <div className="flex gap-2">
            {CRICKET_ROUND_OPTIONS.map((r) => {
              const opts = leg.cricketOptions ?? DEFAULT_CRICKET_OPTIONS;
              return (
                <button
                  key={r}
                  onClick={() => onChange({ ...leg, cricketOptions: { ...opts, roundLimit: r } })}
                  className="option-card flex-1 py-2"
                  data-active={String(opts.roundLimit === r)}
                >
                  <span className={`font-black text-lg ${opts.roundLimit === r ? "text-green-400" : "text-content-muted"}`}>
                    {r === 0 ? "\u221E" : r}
                  </span>
                  <span className={`text-[10px] font-bold ${opts.roundLimit === r ? "text-content-primary" : "text-zinc-500"}`}>
                    {r === 0 ? "No Limit" : "Rounds"}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const opts = leg.cricketOptions ?? DEFAULT_CRICKET_OPTIONS;
                onChange({ ...leg, cricketOptions: { ...opts, singleBull: !opts.singleBull } });
              }}
              className="option-card py-2"
              data-active={String((leg.cricketOptions ?? DEFAULT_CRICKET_OPTIONS).singleBull)}
            >
              <span className={`text-sm font-black ${(leg.cricketOptions ?? DEFAULT_CRICKET_OPTIONS).singleBull ? "text-green-400" : "text-content-faint"}`}>
                {(leg.cricketOptions ?? DEFAULT_CRICKET_OPTIONS).singleBull ? "ON" : "OFF"}
              </span>
              <span className={`text-xs font-bold ${(leg.cricketOptions ?? DEFAULT_CRICKET_OPTIONS).singleBull ? "text-content-primary" : "text-zinc-400"}`}>
                Split Bull
              </span>
            </button>
            <button
              onClick={() => {
                const opts = leg.cricketOptions ?? DEFAULT_CRICKET_OPTIONS;
                onChange({ ...leg, cricketOptions: { ...opts, cutThroat: !opts.cutThroat } });
              }}
              className="option-card py-2"
              data-active={String((leg.cricketOptions ?? DEFAULT_CRICKET_OPTIONS).cutThroat)}
            >
              <span className={`text-sm font-black ${(leg.cricketOptions ?? DEFAULT_CRICKET_OPTIONS).cutThroat ? "text-green-400" : "text-content-faint"}`}>
                {(leg.cricketOptions ?? DEFAULT_CRICKET_OPTIONS).cutThroat ? "ON" : "OFF"}
              </span>
              <span className={`text-xs font-bold ${(leg.cricketOptions ?? DEFAULT_CRICKET_OPTIONS).cutThroat ? "text-content-primary" : "text-zinc-400"}`}>
                Cut-Throat
              </span>
            </button>
          </div>
        </>
      )}

      <button onClick={onDone} className="btn-primary rounded-xl text-lg">
        Done
      </button>
    </div>
  );
}

export function SetSetupScreen({ onStart, onBack }: SetSetupScreenProps) {
  const [step, setStep] = useState<"legs" | "editLeg" | "players">("legs");
  const [format, setFormat] = useState<SetFormat>("bo3");
  const [throwOrder, setThrowOrder] = useState<ThrowOrder>("loser");
  const [legs, setLegs] = useState<LegConfig[]>(() =>
    Array.from({ length: 3 }, defaultLeg),
  );
  const [editingLegIndex, setEditingLegIndex] = useState<number | null>(null);
  const [roster, setRoster] = useState<RosterEntry[]>([
    { id: null, name: "Player 1" },
    { id: null, name: "Player 2" },
  ]);

  const handleFormatChange = (f: SetFormat) => {
    setFormat(f);
    const count = legCount(f);
    setLegs((prev) => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        return [...prev, ...Array.from({ length: count - prev.length }, defaultLeg)];
      }
      return prev.slice(0, count);
    });
  };

  const handleLegChange = (index: number, leg: LegConfig) => {
    setLegs((prev) => prev.map((l, i) => (i === index ? leg : l)));
  };

  const handleBack = () => {
    if (step === "editLeg") {
      setStep("legs");
      setEditingLegIndex(null);
    } else if (step === "players") {
      setStep("legs");
    } else {
      onBack();
    }
  };

  const handleStart = () => {
    onStart(
      { format, legs, throwOrder },
      roster.map((r) => r.name),
      roster.map((r) => r.id),
      roster.map((r) => (r.isBot ? (r.botSkill ?? BotSkill.Intermediate) : null)),
    );
  };

  const stepLabel = step === "legs" ? "Legs" : step === "editLeg" ? `Leg ${(editingLegIndex ?? 0) + 1}` : "Players";

  return (
    <div className="screen-root game-x01" style={{ "--color-game-accent": "oklch(0.65 0.2 260)", "--color-game-accent-dim": "oklch(0.25 0.1 260)", "--color-game-accent-glow": "rgba(96, 130, 255, 0.5)" } as React.CSSProperties}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 pb-3 border-b border-border-default shrink-0"
        style={{ paddingTop: "calc(var(--sat) + 0.75rem)" }}
      >
        <button onClick={handleBack} className="btn-ghost w-14">
          ← Back
        </button>
        <div className="flex flex-col items-center">
          <span className="font-black text-xl tracking-widest text-blue-400">
            Set Match
          </span>
          <span className="text-content-faint text-xs uppercase tracking-widest">
            {stepLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5 w-14 justify-end">
          {["legs", "players"].map((s, i) => (
            <span
              key={s}
              className="w-2 h-2 rounded-full transition-colors"
              style={{
                backgroundColor:
                  (step === "legs" || step === "editLeg") && i === 0
                    ? "oklch(0.65 0.2 260)"
                    : step === "players" && i === 1
                      ? "oklch(0.65 0.2 260)"
                      : "var(--color-border-subtle)",
              }}
            />
          ))}
        </div>
      </header>

      {/* Step: Legs */}
      {step === "legs" && (
        <>
          <div className="flex-1 min-h-0 flex flex-col pr-5 py-3 gap-2 overflow-hidden"
              style={{ paddingLeft: "1.25rem" }}>
            {/* Format + throw order */}
            <div className="flex gap-2 shrink-0">
              {(["bo3", "bo5"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => handleFormatChange(f)}
                  className="option-card flex-1 py-2"
                  data-active={String(format === f)}
                >
                  <span className={`font-black text-xl ${format === f ? "text-blue-400" : "text-content-muted"}`}>
                    Best of {f === "bo3" ? 3 : 5}
                  </span>
                </button>
              ))}
              <button
                onClick={() => setThrowOrder(throwOrder === "loser" ? "alternate" : "loser")}
                className="option-card flex-1 py-2"
                data-active="true"
              >
                <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider">Throw Order</span>
                <span className="font-black text-base text-blue-400">
                  {throwOrder === "loser" ? "Loser First" : "Alternate"}
                </span>
              </button>
            </div>

            {/* Leg cards — horizontal row */}
            <div className="flex-1 min-h-0 flex gap-2">
              {legs.map((leg, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setEditingLegIndex(i);
                    setStep("editLeg");
                  }}
                  className="flex-1 min-w-0 rounded-xl bg-zinc-900 border-2 border-zinc-800 hover:border-blue-700 px-3 flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <span className="text-blue-400 font-black text-sm">
                    Leg {i + 1}
                  </span>
                  <span className={`font-black text-3xl ${leg.gameType === "x01" ? "text-red-500" : "text-green-400"}`}>
                    {leg.gameType === "x01" ? (leg.x01Options ?? DEFAULT_X01_OPTIONS).startingScore : "Cricket"}
                  </span>
                  <p className="text-zinc-500 text-xs text-center truncate w-full">{legSummary(leg)}</p>
                </button>
              ))}
            </div>
          </div>

          <div
            className="shrink-0 px-5 pt-3 border-t border-border-default bg-surface-sunken"
            style={{ paddingBottom: "calc(var(--sab) + 0.75rem)" }}
          >
            <button onClick={() => setStep("players")} className="btn-primary rounded-2xl text-2xl">
              Next →
            </button>
          </div>
        </>
      )}

      {/* Step: Edit single leg */}
      {step === "editLeg" && editingLegIndex !== null && (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center pr-5 py-4 overflow-y-auto"
            style={{ paddingLeft: "1.25rem" }}>
          <div className="w-full max-w-md">
            <LegOptionsEditor
              leg={legs[editingLegIndex]}
              onChange={(leg) => handleLegChange(editingLegIndex, leg)}
              onDone={() => {
                setStep("legs");
                setEditingLegIndex(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Step: Players */}
      {step === "players" && (
        <>
          <div className="flex-1 min-h-0 flex flex-col pr-5 py-3 gap-2 overflow-hidden"
              style={{ paddingLeft: "1.25rem" }}>
            <PlayerSelectStep roster={roster} onChange={setRoster} />
          </div>

          <div
            className="shrink-0 px-5 pt-3 border-t border-border-default bg-surface-sunken"
            style={{ paddingBottom: "calc(var(--sab) + 0.75rem)" }}
          >
            <button
              onClick={handleStart}
              disabled={roster.length === 0}
              className="btn-primary rounded-2xl text-2xl"
            >
              Start Set
            </button>
          </div>
        </>
      )}
    </div>
  );
}
