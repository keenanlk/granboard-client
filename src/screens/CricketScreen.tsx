import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useCricketStore,
  CRICKET_TARGETS,
  type CricketOptions,
  type CricketTarget,
} from "../store/useCricketStore.ts";
import { AwardOverlay } from "../components/AwardOverlay.tsx";
import { ResultsOverlay } from "../components/ResultsOverlay.tsx";
import { detectCricketAward } from "../lib/awards.ts";
import type { AwardType } from "../lib/awards.ts";
import { CricketMarksOverlay } from "../components/CricketMarksOverlay.tsx";
import { CricketController } from "../controllers/CricketController.ts";
import { gameEventBus } from "../events/gameEventBus.ts";
import { useGameSession } from "../hooks/useGameSession.ts";
import { useBotTurn } from "../hooks/useBotTurn.ts";
import { GameShell } from "../components/GameShell.tsx";
import { Bot } from "../bot/Bot.ts";
import type { BotSkill } from "../bot/Bot.ts";
import { CreateSegment } from "../board/Dartboard.ts";
import { gameLogger } from "../lib/GameLogger.ts";

interface CricketScreenProps {
  options: CricketOptions;
  playerNames: string[];
  playerIds: (string | null)[];
  botSkills: (BotSkill | null)[];
  onExit: () => void;
}

function targetLabel(t: CricketTarget) {
  return t === 25 ? "BULL" : String(t);
}

function isNumberClosedByAll(
  players: ReturnType<typeof useCricketStore.getState>["players"],
  target: CricketTarget,
) {
  return players.every((p) => p.marks[target] >= 3);
}

function marksIconSize(n: number) {
  if (n <= 2) return "w-8 h-8";
  if (n <= 4) return "w-6 h-6";
  return "w-5 h-5";
}

function MarksIcon({
  marks,
  isActive,
  sizeClass,
}: {
  marks: number;
  isActive: boolean;
  sizeClass: string;
}) {
  const color =
    marks >= 3
      ? "text-[var(--color-game-accent)] drop-shadow-[0_0_6px_var(--color-game-accent-glow)]"
      : isActive
        ? "text-white"
        : "text-zinc-500";

  if (marks === 0) {
    return (
      <span
        className={`font-black leading-none select-none transition-colors duration-200 ${color} ${sizeClass.includes("w-5") ? "text-base" : "text-xl"}`}
      >
        —
      </span>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      stroke="currentColor"
      fill="none"
      strokeWidth="3"
      className={`select-none transition-colors duration-200 ${color} ${sizeClass}`}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      {marks >= 2 && <line x1="6" y1="6" x2="18" y2="18" />}
      {marks >= 3 && <circle cx="12" cy="12" r="9" />}
    </svg>
  );
}

function playerTextSizes(n: number) {
  if (n <= 2) return { name: "text-sm", score: "text-2xl", mpr: "text-xs" };
  if (n <= 4) return { name: "text-xs", score: "text-xl", mpr: "text-xs" };
  if (n <= 6) return { name: "text-[10px]", score: "text-base", mpr: "text-[9px]" };
  return { name: "text-[9px]", score: "text-sm", mpr: "text-[8px]" };
}

export function CricketScreen({
  options,
  playerNames,
  playerIds,
  botSkills,
  onExit,
}: CricketScreenProps) {
  const {
    players,
    currentPlayerIndex,
    currentRoundDarts,
    winner,
    startGame,
    undoLastDart,
  } = useCricketStore();

  const { handleNextTurn, isTransitioning, countdown } = useGameSession({
    gameType: "cricket",
    playerNames,
    playerIds,
    botSkills,
    options,
    createController: () => new CricketController(),
    extractRound: () => {
      const { currentPlayerIndex, currentRoundDarts } = useCricketStore.getState();
      const roundScore = currentRoundDarts.reduce((sum, d) => sum + d.pointsScored, 0);
      return {
        playerIndex: currentPlayerIndex,
        darts: currentRoundDarts.map((d) => ({
          value: d.segment.Value,
          shortName: d.segment.ShortName,
          marksEarned: d.marksEarned,
        })),
        roundScore,
      };
    },
    winner: winner ? [winner] : null,
    getFinalScores: () => useCricketStore.getState().players.map((p) => p.score),
    onInit: () => {
      startGame(options, playerNames);
      gameEventBus.emit("open_numbers", { numbers: [...CRICKET_TARGETS] });
    },
  });

  const bots = useMemo(() => {
    const map = new Map<number, Bot>();
    botSkills.forEach((skill, i) => {
      if (skill !== null) map.set(i, new Bot(playerNames[i], skill));
    });
    return map;
  }, [botSkills, playerNames]);

  const isCurrentBot = bots.has(currentPlayerIndex);

  const getThrow = useCallback((bot: Bot) => {
    const { players: ps, currentPlayerIndex: ci } = useCricketStore.getState();
    return CreateSegment(bot.throwCricket(ps[ci].marks, ps, ci, (target, actual) => {
      gameLogger.logDart(bot.name, target, actual, {
        players: ps.map((p) => ({ name: p.name, score: p.score, marks: p.marks })),
      });
    }));
  }, []);

  useBotTurn({
    bots,
    currentPlayerIndex,
    dartsThrown: currentRoundDarts.length,
    isBust: false,
    hasWinner: !!winner,
    isTransitioning,
    onNextTurn: handleNextTurn,
    getThrow,
  });

  const [pendingAward, setPendingAward] = useState<AwardType | null>(null);
  const [showMarksAnimation, setShowMarksAnimation] = useState(false);

  useEffect(() => {
    if (currentRoundDarts.length !== 3) return;
    const award = detectCricketAward(currentRoundDarts);
    if (award) {
      setPendingAward(award);
    } else {
      const totalMarks = currentRoundDarts.reduce(
        (sum, d) => sum + d.effectiveMarks,
        0,
      );
      if (totalMarks >= 5) setShowMarksAnimation(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoundDarts.length]);

  const n = players.length;
  const readyToSwitch = currentRoundDarts.length === 3;
  const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
  const nextPlayer = players[nextPlayerIndex];
  const currentPlayer = players[currentPlayerIndex];
  const isTwoPlayer = n === 2;
  const iconSize = marksIconSize(n);
  const textSizes = playerTextSizes(n);

  // Number label column width — slightly narrower on small player counts
  const numColWidth = n <= 4 ? "2.5rem" : "2rem";

  return (
    <GameShell
      gameClass="game-cricket"
      title={
        <>
          <span className="font-black text-[var(--color-game-accent)] text-2xl tracking-widest">
            Cricket
          </span>
          {options.singleBull && (
            <span className="text-zinc-600 text-xs uppercase tracking-widest">
              Split Bull
            </span>
          )}
        </>
      }
      onExit={onExit}
      onUndo={undoLastDart}
      undoDisabled={currentRoundDarts.length === 0 || !!winner || isCurrentBot}
      isTransitioning={isTransitioning}
      countdown={countdown}
      nextPlayerName={nextPlayer?.name}
      overlays={
        <>
          {winner && (
            <ResultsOverlay
              onExit={onExit}
              playerResults={players
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((p, rank) => {
                  const mpr =
                    p.totalDartsThrown === 0
                      ? "0.00"
                      : ((p.totalMarksEarned * 3) / p.totalDartsThrown).toFixed(2);
                  return {
                    name: p.name,
                    isWinner: p.name === winner,
                    rank: rank + 1,
                    stats: [
                      { label: "points", value: String(p.score) },
                      { label: "darts", value: String(p.totalDartsThrown) },
                      { label: "mpr", value: mpr },
                    ],
                  };
                })}
            />
          )}
          {pendingAward && (
            <AwardOverlay
              award={pendingAward}
              onDismiss={() => setPendingAward(null)}
            />
          )}
          {showMarksAnimation && !pendingAward && (
            <CricketMarksOverlay
              darts={currentRoundDarts}
              onDismiss={() => setShowMarksAnimation(false)}
            />
          )}
        </>
      }
    >
      {/* Main area */}
      <div className="flex-1 flex min-h-0" style={{ paddingLeft: "var(--sal)" }}>

        {/* Left: marks scoreboard */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 px-2 py-1">
          <div className="flex-1 flex flex-col justify-around min-h-0">
            {CRICKET_TARGETS.map((target) => {
              const allClosed = isNumberClosedByAll(players, target);
              const openForCurrent =
                !allClosed && (currentPlayer?.marks[target] ?? 0) >= 3;

              return (
                <div
                  key={target}
                  className={`grid items-center transition-opacity duration-200 ${allClosed ? "opacity-25" : ""}`}
                  style={
                    isTwoPlayer
                      ? { gridTemplateColumns: `1fr ${numColWidth} 1fr` }
                      : { gridTemplateColumns: `${numColWidth} repeat(${n}, 1fr)` }
                  }
                >
                  {isTwoPlayer ? (
                    <>
                      {/* Player 0 marks */}
                      <div className="flex justify-end pr-2 border-r border-border-default">
                        <MarksIcon
                          marks={players[0]?.marks[target] ?? 0}
                          isActive={currentPlayerIndex === 0}
                          sizeClass={iconSize}
                        />
                      </div>
                      {/* Target label */}
                      <div className="flex justify-center">
                        <span
                          className={`font-black tabular-nums leading-none text-xl transition-colors duration-200 ${
                            allClosed
                              ? "text-content-faint"
                              : openForCurrent
                                ? "text-[var(--color-game-accent)] drop-shadow-[0_0_8px_var(--color-game-accent-glow)]"
                                : "text-zinc-200"
                          }`}
                        >
                          {targetLabel(target)}
                        </span>
                      </div>
                      {/* Player 1 marks */}
                      <div className="flex justify-start pl-2 border-l border-border-default">
                        <MarksIcon
                          marks={players[1]?.marks[target] ?? 0}
                          isActive={currentPlayerIndex === 1}
                          sizeClass={iconSize}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Target label */}
                      <span
                        className={`font-black tabular-nums text-sm text-right pr-2 transition-colors duration-200 ${
                          allClosed
                            ? "text-content-faint"
                            : openForCurrent
                              ? "text-[var(--color-game-accent)] drop-shadow-[0_0_8px_var(--color-game-accent-glow)]"
                              : "text-content-secondary"
                        }`}
                      >
                        {targetLabel(target)}
                      </span>
                      {/* Per-player columns with left border */}
                      {players.map((p, pi) => (
                        <div
                          key={pi}
                          className="flex justify-center border-l transition-colors duration-200"
                          style={{
                            borderColor: pi === currentPlayerIndex
                              ? "color-mix(in oklch, var(--color-game-accent) 70%, transparent)"
                              : "var(--color-border-default)",
                          }}
                        >
                          <MarksIcon
                            marks={p.marks[target]}
                            isActive={pi === currentPlayerIndex}
                            sizeClass={iconSize}
                          />
                        </div>
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: dart slots + Next Turn button */}
        <div className="flex flex-col shrink-0 w-24 border-l border-border-default min-h-0">

          {/* Compact dart slots */}
          <div className="flex flex-col gap-1 p-2 shrink-0">
            {[0, 1, 2].map((j) => {
              const thrown = currentRoundDarts[j];
              const isNext = j === currentRoundDarts.length && !readyToSwitch;
              const scored = thrown && thrown.pointsScored > 0;
              const state = thrown
                ? scored
                  ? "scored"
                  : "miss"
                : isNext
                  ? "next"
                  : "empty";
              return (
                <div key={j} className="dart-slot" data-state={state}>
                  {thrown ? (
                    <>
                      <span
                        className={`text-xs font-black leading-none ${scored ? "text-[var(--color-game-accent)]" : thrown.target !== null ? "text-white" : "text-zinc-600"}`}
                      >
                        {thrown.target !== null
                          ? thrown.marksEarned > 0
                            ? `+${thrown.marksEarned}`
                            : "0"
                          : "0"}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">
                        {thrown.target !== null
                          ? targetLabel(thrown.target)
                          : thrown.segment.ShortName}
                      </span>
                    </>
                  ) : isNext ? (
                    <span className="text-[var(--color-game-accent)] text-xs font-black opacity-60">{j + 1}</span>
                  ) : (
                    <span className="text-content-faint text-xs">·</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Next Turn button — fills remaining space */}
          <div className="relative flex-1 min-h-0 p-2">
            {readyToSwitch && !winner && (
              <span
                className="absolute inset-2 rounded-xl opacity-20 animate-ping"
                style={{ backgroundColor: "var(--color-game-accent)" }}
              />
            )}
            {isCurrentBot && !readyToSwitch ? (
              <div className="w-full h-full rounded-xl bg-surface-raised border-2 border-purple-900 flex flex-col items-center justify-center gap-1 opacity-70">
                <span className="text-state-bot text-[10px] uppercase tracking-widest font-black">CPU</span>
                <span className="text-purple-600 text-base animate-pulse">···</span>
              </div>
            ) : (
              <button
                onClick={handleNextTurn}
                disabled={!!winner}
                className={`relative w-full h-full rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                  readyToSwitch
                    ? "text-[var(--color-game-accent-text)]"
                    : "bg-surface-raised border-2 border-border-default text-content-faint"
                }`}
                style={readyToSwitch ? {
                  backgroundColor: "var(--color-game-accent)",
                  boxShadow: "var(--shadow-glow-md)",
                } : undefined}
              >
                <span className="text-center leading-tight px-1">
                  {readyToSwitch && nextPlayer ? nextPlayer.name : "Next"}
                </span>
                <span className="text-base">→</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Player strip — always single row */}
      <div
        className="shrink-0 grid border-t-2 bg-surface-sunken transition-all duration-300"
        style={{
          borderColor: readyToSwitch ? "var(--color-game-accent)" : "var(--color-border-default)",
          gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
        }}
      >
        {players.map((player, i) => {
          const isActive = i === currentPlayerIndex;
          const mpr =
            player.totalDartsThrown === 0
              ? "0.00"
              : ((player.totalMarksEarned * 3) / player.totalDartsThrown).toFixed(2);
          return (
            <div
              key={i}
              className="player-strip-cell border-r border-border-default last:border-r-0"
              data-active={String(isActive)}
              style={i === 0 ? { paddingLeft: "var(--sal)" } : undefined}
            >
              <span
                className={`font-black uppercase tracking-wide truncate max-w-full transition-colors duration-300 ${isActive ? "text-[var(--color-game-accent)]" : "text-content-faint"} ${textSizes.name}`}
              >
                {player.name}
              </span>
              <span
                className={`font-black tabular-nums leading-tight transition-colors duration-300 ${isActive ? "text-content-primary" : "text-content-muted"} ${textSizes.score}`}
              >
                {player.score}
              </span>
              <span
                className={`tabular-nums transition-colors duration-300 ${isActive ? "text-content-secondary" : "text-content-faint"} ${textSizes.mpr}`}
              >
                {mpr} mpr
              </span>
            </div>
          );
        })}
      </div>
    </GameShell>
  );
}
