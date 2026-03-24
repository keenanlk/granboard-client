import { useState, useEffect } from "react";
import { getSetWinner } from "@nlc-darts/engine";
import type { BotSkill, SetProgress } from "@nlc-darts/engine";
import type { RematchState } from "../hooks/useOnlineRematch.ts";
import type { NextLegState } from "../hooks/useOnlineNextLeg.ts";
import { RobotModel } from "./RobotModel.tsx";

interface PlayerResult {
  name: string;
  isWinner: boolean;
  rank: number;
  stats: { label: string; value: string }[];
  botSkill?: BotSkill | null;
}

interface ResultsOverlayProps {
  playerResults: PlayerResult[];
  onExit: () => void;
  onRematch?: () => void;
  setProgress?: SetProgress;
  onNextLeg?: () => void;
  /** Online rematch state — when set, replaces the simple Rematch button */
  onlineRematch?: {
    state: RematchState;
    onRequest: () => void;
    onAccept: () => void;
    onDecline: () => void;
  };
  /** Online next-leg coordination — when set, replaces the simple Next Leg button */
  onlineNextLeg?: {
    state: NextLegState;
    onRequest: () => void;
  };
  /** When true, shows "Tournament Winner!" instead of "Set Winner!" */
  isTournament?: boolean;
}

function WinnerRobot({ skill }: { skill: BotSkill }) {
  const [animation, setAnimation] = useState("BasicAttack");
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    // Celebrate immediately, then cycle: idle for 3s → celebrate → repeat
    const interval = setInterval(() => {
      setAnimation("BasicAttack");
      setAnimKey((k) => k + 1);
      setTimeout(() => setAnimation("StaticIdle"), 1000);
    }, 4000);
    // After initial celebrate, go to idle
    const initial = setTimeout(() => setAnimation("StaticIdle"), 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(initial);
    };
  }, []);

  return (
    <RobotModel
      skill={skill}
      size="clamp(8rem, 20vh, 14rem)"
      animation={animation}
      animKey={animKey}
    />
  );
}

function SetScoreline({ setProgress }: { setProgress: SetProgress }) {
  const wins = new Map<string, number>();
  for (const r of setProgress.legResults) {
    wins.set(r.winnerName, (wins.get(r.winnerName) ?? 0) + 1);
  }

  return (
    <div className="flex items-center justify-center gap-6">
      {setProgress.playerNames.map((name, i) => (
        <div key={name} className="flex items-center gap-3">
          {i > 0 && (
            <span
              className="text-zinc-700 font-bold"
              style={{ fontSize: "clamp(1rem, 3vh, 2rem)" }}
            >
              –
            </span>
          )}
          <div className="flex flex-col items-center">
            <span
              className="font-black tabular-nums text-white"
              style={{ fontSize: "clamp(1.5rem, 5vh, 3.5rem)" }}
            >
              {wins.get(name) ?? 0}
            </span>
            <span
              className="text-zinc-500 font-bold uppercase tracking-wider truncate max-w-28"
              style={{ fontSize: "clamp(0.55rem, 1.2vh, 0.85rem)" }}
            >
              {name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResultsOverlay({
  playerResults,
  onExit,
  onRematch,
  setProgress,
  onNextLeg,
  onlineRematch,
  onlineNextLeg,
  isTournament,
}: ResultsOverlayProps) {
  const winners = playerResults.filter((p) => p.isWinner);
  const losers = playerResults.filter((p) => !p.isWinner);
  const isTie = winners.length > 1;

  const isInSet = !!setProgress;

  // Include the current leg's winner in the set progress for scoreline + winner calculation
  const effectiveSetProgress =
    isInSet && winners.length === 1
      ? {
          ...setProgress,
          legResults: [
            ...setProgress.legResults,
            {
              winnerName: winners[0].name,
              winnerIndex: setProgress.playerNames.indexOf(winners[0].name),
            },
          ],
        }
      : setProgress;

  const format = isInSet
    ? setProgress.totalLegs === 3
      ? ("bo3" as const)
      : ("bo5" as const)
    : ("bo3" as const);
  const setWinner = effectiveSetProgress
    ? getSetWinner(effectiveSetProgress.legResults, format)
    : null;
  const isSetComplete = !!setWinner;

  const headline = isSetComplete
    ? isTournament
      ? "Tournament Winner!"
      : "Set Winner!"
    : winners.length === 0
      ? "Cat's Game"
      : isTie
        ? "It's a Tie!"
        : isInSet
          ? "Leg Winner"
          : "Winner";

  return (
    <div className="absolute inset-0 z-20 bg-zinc-950 flex flex-col overflow-hidden">
      {/* Content — vertically centered */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 gap-2">
        {/* Subtitle: leg info or "Game Over" */}
        <p
          className="uppercase tracking-[0.3em] font-normal"
          style={{
            fontFamily: "Beon, sans-serif",
            fontSize: "clamp(0.6rem, 1.6vh, 1rem)",
            color:
              isInSet && !isSetComplete
                ? "#60a5fa"
                : "var(--color-content-muted)",
            textShadow:
              isInSet && !isSetComplete
                ? "0 0 10px rgba(96,165,250,0.5)"
                : "0 0 8px rgba(255,255,255,0.1)",
          }}
        >
          {isInSet && !isSetComplete
            ? `Leg ${setProgress.currentLeg} of ${setProgress.totalLegs}`
            : isSetComplete
              ? isTournament
                ? "Tournament Complete"
                : "Set Complete"
              : "Game Over"}
        </p>

        {/* Headline */}
        <p
          className="font-normal uppercase tracking-widest"
          style={{
            fontFamily: "Beon, sans-serif",
            fontSize: "clamp(1.25rem, 4.5vh, 3rem)",
            color: "var(--color-game-accent)",
            textShadow:
              "0 0 15px var(--color-game-accent), 0 0 40px var(--color-game-accent-glow)",
          }}
        >
          {headline}
        </p>

        {/* Set scoreline (compact, inline) */}
        {isInSet && effectiveSetProgress && (
          <SetScoreline setProgress={effectiveSetProgress} />
        )}

        {/* Winner name + robot */}
        {winners.map((p) => (
          <div key={p.name} className="flex flex-col items-center gap-2">
            {p.botSkill != null && <WinnerRobot skill={p.botSkill} />}
            <p
              className="font-normal leading-none"
              style={{
                fontFamily: "Beon, sans-serif",
                fontSize: "clamp(2rem, 8vh, 5rem)",
                color: "#fff",
                textShadow:
                  "0 0 15px var(--color-game-accent), 0 0 40px var(--color-game-accent), 0 0 80px var(--color-game-accent-glow)",
              }}
            >
              {p.name}
            </p>
            {/* Winner stats — horizontal row */}
            <div
              className="flex items-baseline justify-center"
              style={{ gap: "clamp(1.5rem, 3vw, 3rem)" }}
            >
              {p.stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center">
                  <span
                    className="font-normal tabular-nums leading-none"
                    style={{
                      fontFamily: "Beon, sans-serif",
                      fontSize: "clamp(1rem, 3.5vh, 2.5rem)",
                      color: "var(--color-game-accent)",
                      textShadow:
                        "0 0 10px var(--color-game-accent), 0 0 30px var(--color-game-accent-glow)",
                    }}
                  >
                    {s.value}
                  </span>
                  <span
                    className="uppercase tracking-wider"
                    style={{
                      fontSize: "clamp(0.45rem, 1vh, 0.75rem)",
                      color: "var(--color-content-faint)",
                      marginTop: "2px",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Losers — compact inline below a thin divider */}
        {losers.length > 0 && (
          <div className="w-full max-w-md flex flex-col items-center gap-2 mt-2">
            <div className="w-full border-t border-zinc-800" />
            {losers.map((p) => (
              <div key={p.name} className="flex items-center gap-3">
                {p.botSkill != null && (
                  <RobotModel
                    skill={p.botSkill}
                    size="clamp(3rem, 6vh, 5rem)"
                    animation="Death"
                  />
                )}
                <span
                  className="text-zinc-400 font-bold uppercase tracking-wide"
                  style={{ fontSize: "clamp(0.7rem, 1.6vh, 1.1rem)" }}
                >
                  {p.name}
                </span>
                {p.stats.map((s) => (
                  <span
                    key={s.label}
                    className="text-zinc-600 tabular-nums"
                    style={{ fontSize: "clamp(0.6rem, 1.3vh, 0.9rem)" }}
                  >
                    {s.value} <span className="text-zinc-700">{s.label}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions — pinned to bottom */}
      <div
        className="shrink-0 px-6 py-4 flex gap-3"
        style={{ paddingBottom: "calc(var(--sab) + 1rem)" }}
      >
        <button
          onClick={onExit}
          className="btn-primary flex-1 tracking-widest bg-zinc-800 text-zinc-300 border border-zinc-700"
          style={{ fontFamily: "Beon, sans-serif", fontWeight: "normal" }}
        >
          Menu
        </button>
        {isInSet && !isSetComplete && onNextLeg && !onlineNextLeg && (
          <button
            onClick={onNextLeg}
            className="btn-primary flex-1 tracking-widest"
            style={{ fontFamily: "Beon, sans-serif", fontWeight: "normal" }}
          >
            Next Leg
          </button>
        )}
        {isInSet &&
          !isSetComplete &&
          onlineNextLeg &&
          onlineNextLeg.state !== "sent" && (
            <button
              onClick={onlineNextLeg.onRequest}
              className="btn-primary flex-1 tracking-widest"
              style={{ fontFamily: "Beon, sans-serif", fontWeight: "normal" }}
            >
              Next Leg
            </button>
          )}
        {isInSet &&
          !isSetComplete &&
          onlineNextLeg &&
          onlineNextLeg.state === "sent" && (
            <button
              disabled
              className="btn-primary flex-1 tracking-widest opacity-60 cursor-default"
              style={{ fontFamily: "Beon, sans-serif", fontWeight: "normal" }}
            >
              Waiting…
            </button>
          )}
        {!isInSet && onlineRematch && onlineRematch.state === "idle" && (
          <button
            onClick={onlineRematch.onRequest}
            className="btn-primary flex-1 tracking-widest"
            style={{ fontFamily: "Beon, sans-serif", fontWeight: "normal" }}
          >
            Rematch
          </button>
        )}
        {!isInSet && onlineRematch && onlineRematch.state === "sent" && (
          <button
            disabled
            className="btn-primary flex-1 tracking-widest opacity-60 cursor-default"
            style={{ fontFamily: "Beon, sans-serif", fontWeight: "normal" }}
          >
            Waiting…
          </button>
        )}
        {!isInSet && onlineRematch && onlineRematch.state === "received" && (
          <>
            <button
              onClick={onlineRematch.onAccept}
              className="btn-primary flex-1 tracking-widest bg-emerald-600 text-white"
              style={{ fontFamily: "Beon, sans-serif", fontWeight: "normal" }}
            >
              Accept
            </button>
            <button
              onClick={onlineRematch.onDecline}
              className="btn-primary flex-1 tracking-widest bg-zinc-800 text-zinc-400 border border-zinc-700"
              style={{ fontFamily: "Beon, sans-serif", fontWeight: "normal" }}
            >
              Decline
            </button>
          </>
        )}
        {!isInSet && !onlineRematch && onRematch && (
          <button
            onClick={onRematch}
            className="btn-primary flex-1 tracking-widest"
            style={{ fontFamily: "Beon, sans-serif", fontWeight: "normal" }}
          >
            Rematch
          </button>
        )}
      </div>
    </div>
  );
}
