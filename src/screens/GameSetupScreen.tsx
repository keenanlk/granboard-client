import { useState } from "react";
import { DEFAULT_X01_OPTIONS, type X01Options } from "../store/useGameStore.ts";
import {
  DEFAULT_CRICKET_OPTIONS,
  type CricketOptions,
} from "../store/useCricketStore.ts";
import {
  DEFAULT_HIGHSCORE_OPTIONS,
  type HighScoreOptions,
} from "../store/useHighScoreStore.ts";
import {
  PlayerSelectStep,
  BotSkill,
  type RosterEntry,
} from "../components/PlayerSelectStep.tsx";
import type { BotSkill as BotSkillType } from "../bot/Bot.ts";

export type { BotSkillType };

interface GameSetupScreenProps {
  game: "x01" | "cricket" | "highscore";
  onStart: (
    players: string[],
    playerIds: (string | null)[],
    botSkills: (BotSkillType | null)[],
    x01Options?: X01Options,
    cricketOptions?: CricketOptions,
    highScoreOptions?: HighScoreOptions,
  ) => void;
  onBack: () => void;
}

const ROUND_OPTIONS = [8, 10, 15] as const;
const CRICKET_ROUND_OPTIONS = [15, 20, 25, 0] as const;

export function GameSetupScreen({
  game,
  onStart,
  onBack,
}: GameSetupScreenProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [roster, setRoster] = useState<RosterEntry[]>([
    { id: null, name: "Player 1" },
    { id: null, name: "Player 2" },
  ]);
  const [x01Options, setX01Options] = useState<X01Options>(DEFAULT_X01_OPTIONS);
  const [cricketOptions, setCricketOptions] = useState<CricketOptions>(
    DEFAULT_CRICKET_OPTIONS,
  );
  const [highScoreOptions, setHighScoreOptions] = useState<HighScoreOptions>(
    DEFAULT_HIGHSCORE_OPTIONS,
  );

  const setX01Option = <K extends keyof X01Options>(
    key: K,
    value: X01Options[K],
  ) =>
    setX01Options((prev) => {
      const next = { ...prev, [key]: value };
      // doubleOut and masterOut are mutually exclusive
      if (key === "doubleOut" && value) next.masterOut = false;
      if (key === "masterOut" && value) next.doubleOut = false;
      return next;
    });


  const title =
    game === "x01" ? "X01" : game === "cricket" ? "Cricket" : "High Score";
  const gameClass =
    game === "x01"
      ? "game-x01"
      : game === "cricket"
        ? "game-cricket"
        : "game-highscore";

  const handleBack = () => (step === 2 ? setStep(1) : onBack());

  return (
    <div className={`screen-root ${gameClass}`}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 pb-3 border-b border-border-default shrink-0"
        style={{ paddingTop: "calc(var(--sat) + 0.75rem)" }}
      >
        <button onClick={handleBack} className="btn-ghost w-14">
          ← Back
        </button>
        <div className="flex flex-col items-center">
          <span className="font-black text-xl tracking-widest text-[var(--color-game-accent)]">
            {title}
          </span>
          <span className="text-content-faint text-xs uppercase tracking-widest">
            {step === 1 ? "Options" : "Players"}
          </span>
        </div>
        {/* Step dots */}
        <div className="flex items-center gap-1.5 w-14 justify-end">
          <span
            className="w-2 h-2 rounded-full transition-colors"
            style={{
              backgroundColor:
                step === 1
                  ? "var(--color-game-accent)"
                  : "var(--color-border-subtle)",
            }}
          />
          <span
            className="w-2 h-2 rounded-full transition-colors"
            style={{
              backgroundColor:
                step === 2
                  ? "var(--color-game-accent)"
                  : "var(--color-border-subtle)",
            }}
          />
        </div>
      </header>

      {/* Step 1 — Options */}
      {step === 1 && (
        <>
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center pr-5 py-4 gap-3 overflow-hidden"
              style={{ paddingLeft: "1.25rem" }}>
            {game === "x01" && (
              <div
                className="grid grid-cols-3 gap-3 w-full"
                style={{ maxHeight: "min(100%, 320px)" }}
              >
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
                    className="option-card min-h-[80px] max-h-[160px]"
                    data-active={String(x01Options[key])}
                  >
                    <span className={`text-xl font-black ${x01Options[key] ? "text-[var(--color-game-accent)]" : "text-content-faint"}`}>
                      {x01Options[key] ? "ON" : "OFF"}
                    </span>
                    <span className={`text-sm font-bold text-center leading-tight ${x01Options[key] ? "text-content-primary" : "text-zinc-400"}`}>
                      {label}
                    </span>
                    <span className="text-xs text-content-muted text-center leading-tight">
                      {desc}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {game === "cricket" && (
              <div
                className="flex gap-3 w-full justify-center"
                style={{ maxHeight: "min(100%, 320px)" }}
              >
                {/* Round limit — cycles through options */}
                <button
                  onClick={() => {
                    const idx = CRICKET_ROUND_OPTIONS.indexOf(cricketOptions.roundLimit as typeof CRICKET_ROUND_OPTIONS[number]);
                    const next = CRICKET_ROUND_OPTIONS[(idx + 1) % CRICKET_ROUND_OPTIONS.length];
                    setCricketOptions((prev) => ({ ...prev, roundLimit: next }));
                  }}
                  className="option-card min-h-[80px] max-h-[160px] flex-1 max-w-xs"
                  data-active="true"
                >
                  <span className="font-black text-2xl text-[var(--color-game-accent)]">
                    {cricketOptions.roundLimit === 0 ? "∞" : cricketOptions.roundLimit}
                  </span>
                  <span className="text-sm font-bold text-center text-content-primary">
                    {cricketOptions.roundLimit === 0 ? "No Limit" : "Round Limit"}
                  </span>
                  <span className="text-xs text-content-muted text-center leading-tight">
                    Tap to change
                  </span>
                </button>
                {/* Cut-Throat toggle */}
                <button
                  onClick={() => setCricketOptions((prev) => ({ ...prev, cutThroat: !prev.cutThroat }))}
                  className="option-card min-h-[80px] max-h-[160px] flex-1 max-w-xs"
                  data-active={String(cricketOptions.cutThroat)}
                >
                  <span className={`text-xl font-black ${cricketOptions.cutThroat ? "text-[var(--color-game-accent)]" : "text-content-faint"}`}>
                    {cricketOptions.cutThroat ? "ON" : "OFF"}
                  </span>
                  <span className={`text-sm font-bold text-center leading-tight ${cricketOptions.cutThroat ? "text-content-primary" : "text-zinc-400"}`}>
                    Cut-Throat
                  </span>
                  <span className="text-xs text-content-muted text-center leading-tight">
                    Points go to opponents
                  </span>
                </button>
              </div>
            )}

            {game === "highscore" && (
              <div
                className="grid grid-cols-3 gap-3 w-full"
                style={{ maxHeight: "min(100%, 320px)" }}
              >
                {/* Rounds — cycles through options */}
                <button
                  onClick={() => {
                    const idx = ROUND_OPTIONS.indexOf(highScoreOptions.rounds as typeof ROUND_OPTIONS[number]);
                    const next = ROUND_OPTIONS[(idx + 1) % ROUND_OPTIONS.length];
                    setHighScoreOptions((prev) => ({ ...prev, rounds: next }));
                  }}
                  className="option-card min-h-[80px] max-h-[160px]"
                  data-active="true"
                >
                  <span className="font-black text-2xl text-[var(--color-game-accent)]">
                    {highScoreOptions.rounds}
                  </span>
                  <span className="text-sm font-bold text-center text-content-primary">
                    Rounds
                  </span>
                  <span className="text-xs text-content-muted text-center leading-tight">
                    Tap to change
                  </span>
                </button>

                {/* Playoff toggle */}
                <button
                  onClick={() =>
                    setHighScoreOptions((prev) => ({
                      ...prev,
                      tieRule: prev.tieRule === "playoff" ? "stand" : "playoff",
                    }))
                  }
                  className="option-card min-h-[80px] max-h-[160px]"
                  data-active={String(highScoreOptions.tieRule === "playoff")}
                >
                  <span className={`text-xl font-black ${highScoreOptions.tieRule === "playoff" ? "text-[var(--color-game-accent)]" : "text-content-faint"}`}>
                    {highScoreOptions.tieRule === "playoff" ? "ON" : "OFF"}
                  </span>
                  <span className={`text-sm font-bold text-center ${highScoreOptions.tieRule === "playoff" ? "text-content-primary" : "text-zinc-400"}`}>
                    One-Dart Playoff
                  </span>
                  <span className="text-xs text-content-muted text-center leading-tight">
                    Throw 1 dart to break ties
                  </span>
                </button>

                {/* Split Bull toggle */}
                <button
                  onClick={() =>
                    setHighScoreOptions((prev) => ({
                      ...prev,
                      splitBull: !prev.splitBull,
                    }))
                  }
                  className="option-card min-h-[80px] max-h-[160px]"
                  data-active={String(highScoreOptions.splitBull)}
                >
                  <span className={`text-xl font-black ${highScoreOptions.splitBull ? "text-[var(--color-game-accent)]" : "text-content-faint"}`}>
                    {highScoreOptions.splitBull ? "ON" : "OFF"}
                  </span>
                  <span className={`text-sm font-bold text-center ${highScoreOptions.splitBull ? "text-content-primary" : "text-zinc-400"}`}>
                    Split Bull
                  </span>
                  <span className="text-xs text-content-muted text-center leading-tight">
                    Outer bull scores 25
                  </span>
                </button>
              </div>
            )}
          </div>

          <div
            className="shrink-0 px-5 pt-3 border-t border-border-default bg-surface-sunken"
            style={{ paddingBottom: "calc(var(--sab) + 0.75rem)" }}
          >
            <button
              onClick={() => setStep(2)}
              className="btn-primary rounded-2xl text-2xl"
            >
              Next →
            </button>
          </div>
        </>
      )}

      {/* Step 2 — Players */}
      {step === 2 && (
        <>
          <div className="flex-1 min-h-0 flex flex-col pr-5 py-3 gap-2 overflow-hidden"
              style={{ paddingLeft: "1.25rem" }}>
            <PlayerSelectStep roster={roster} onChange={setRoster} />
          </div>

          <div
            className="shrink-0 px-5 pt-3 border-t border-border-default bg-surface-sunken"
            style={{ paddingBottom: "calc(var(--sab) + 0.75rem)" }}
          >
            {game === "x01" ? (
              <div className="flex gap-3">
                {([301, 501, 701] as const).map((score) => (
                  <button
                    key={score}
                    onClick={() =>
                      onStart(
                        roster.map((r) => r.name),
                        roster.map((r) => r.id),
                        roster.map((r) =>
                          r.isBot
                            ? (r.botSkill ?? BotSkill.Intermediate)
                            : null,
                        ),
                        { ...x01Options, startingScore: score },
                      )
                    }
                    disabled={roster.length === 0}
                    className="btn-primary flex-1 rounded-2xl text-2xl"
                    style={{ width: "auto" }}
                  >
                    {score}
                  </button>
                ))}
              </div>
            ) : game === "cricket" ? (
              <button
                onClick={() =>
                  onStart(
                    roster.map((r) => r.name),
                    roster.map((r) => r.id),
                    roster.map((r) =>
                      r.isBot ? (r.botSkill ?? BotSkill.Intermediate) : null,
                    ),
                    undefined,
                    cricketOptions,
                  )
                }
                disabled={roster.length === 0}
                className="btn-primary rounded-2xl text-2xl"
              >
                {cricketOptions.cutThroat ? "Start Cut-Throat" : "Start Cricket"}
              </button>
            ) : (
              <button
                onClick={() =>
                  onStart(
                    roster.map((r) => r.name),
                    roster.map((r) => r.id),
                    roster.map((r) =>
                      r.isBot ? (r.botSkill ?? BotSkill.Intermediate) : null,
                    ),
                    undefined,
                    undefined,
                    highScoreOptions,
                  )
                }
                disabled={roster.length === 0}
                className="btn-primary rounded-2xl text-2xl"
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
