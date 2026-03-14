import { useCallback, useEffect, useMemo, useState } from "react";
import { useHighScoreStore, type HighScoreOptions } from "../store/useHighScoreStore.ts";
import { HighScoreController } from "../controllers/HighScoreController.ts";
import { useGameSession } from "../hooks/useGameSession.ts";
import { useBotTurn } from "../hooks/useBotTurn.ts";
import { GameShell } from "../components/GameShell.tsx";
import { Bot } from "../bot/Bot.ts";
import type { BotSkill } from "../bot/Bot.ts";
import { CreateSegment } from "../board/Dartboard.ts";
import { gameLogger } from "../lib/GameLogger.ts";
import { AwardOverlay } from "../components/AwardOverlay.tsx";
import { ResultsOverlay } from "../components/ResultsOverlay.tsx";
import { detectAward } from "../lib/awards.ts";
import type { AwardType } from "../lib/awards.ts";

function playerTextSizes(n: number) {
  if (n <= 2) return { name: "text-sm", score: "text-2xl", stat: "text-xs" };
  if (n <= 4) return { name: "text-xs", score: "text-xl", stat: "text-xs" };
  if (n <= 6) return { name: "text-[10px]", score: "text-base", stat: "text-[9px]" };
  return { name: "text-[9px]", score: "text-sm", stat: "text-[8px]" };
}

interface HighScoreScreenProps {
  options: HighScoreOptions;
  playerNames: string[];
  playerIds: (string | null)[];
  botSkills: (BotSkill | null)[];
  onExit: () => void;
}

export function HighScoreScreen({
  options,
  playerNames,
  playerIds,
  botSkills,
  onExit,
}: HighScoreScreenProps) {
  const {
    players,
    currentPlayerIndex,
    currentRound,
    currentRoundDarts,
    winners,
    inPlayoff,
    startGame,
    undoLastDart,
  } = useHighScoreStore();

  const { handleNextTurn, isTransitioning, countdown } = useGameSession({
    gameType: "highscore",
    playerNames,
    playerIds,
    botSkills,
    options,
    createController: () => new HighScoreController(),
    extractRound: () => {
      const { currentPlayerIndex, currentRoundDarts } = useHighScoreStore.getState();
      const roundTotal = currentRoundDarts.reduce((sum, d) => sum + d.value, 0);
      return {
        playerIndex: currentPlayerIndex,
        darts: currentRoundDarts.map((d) => ({
          value: d.value,
          shortName: d.segment.ShortName,
        })),
        roundScore: roundTotal,
      };
    },
    winner: winners,
    getFinalScores: () => useHighScoreStore.getState().players.map((p) => p.score),
    onInit: () => startGame(options, playerNames),
  });

  const n = players.length;
  const currentPlayer = players[currentPlayerIndex];
  const readyToSwitch = currentRoundDarts.length === 3;
  const roundTotal = currentRoundDarts.reduce((sum, d) => sum + d.value, 0);
  const nextPlayerIndex = (currentPlayerIndex + 1) % n;
  const nextPlayer = players[nextPlayerIndex];
  const isLastPlayerOfRound = currentPlayerIndex === n - 1;
  const isLastRound = currentRound === options.rounds;
  const textSizes = playerTextSizes(n);

  const bots = useMemo(() => {
    const map = new Map<number, Bot>();
    botSkills.forEach((skill, i) => {
      if (skill !== null) map.set(i, new Bot(playerNames[i], skill));
    });
    return map;
  }, [botSkills, playerNames]);

  const isCurrentBot = bots.has(currentPlayerIndex);

  const getThrow = useCallback((bot: Bot) => {
    return CreateSegment(bot.throwHighScore(options.splitBull, (target, actual) => {
      gameLogger.logDart(bot.name, target, actual, {});
    }));
  }, [options.splitBull]);

  useBotTurn({
    bots,
    currentPlayerIndex,
    dartsThrown: currentRoundDarts.length,
    isBust: false,
    hasWinner: !!winners,
    isTransitioning,
    onNextTurn: handleNextTurn,
    getThrow,
  });

  const [pendingAward, setPendingAward] = useState<AwardType | null>(null);
  useEffect(() => {
    if (!readyToSwitch) return;
    const award = detectAward(currentRoundDarts);
    if (award) setPendingAward(award);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToSwitch]);

  function nextLabel() {
    if (!readyToSwitch) return "Next";
    if (!isLastPlayerOfRound) return nextPlayer?.name ?? "Next";
    if (!isLastRound) return `Round ${currentRound + 1}`;
    return "Results";
  }

  return (
    <GameShell
      gameClass="game-highscore"
      title={
        <>
          <span className="font-black text-[var(--color-game-accent)] text-2xl tracking-widest">
            High Score
          </span>
          <span className="text-zinc-500 text-xs uppercase tracking-widest">
            Round {currentRound} of {options.rounds}
          </span>
        </>
      }
      onExit={onExit}
      onUndo={undoLastDart}
      undoDisabled={currentRoundDarts.length === 0 || !!winners || isCurrentBot}
      isTransitioning={isTransitioning}
      countdown={countdown}
      nextPlayerName={n > 1 ? nextPlayer?.name : undefined}
      overlays={
        <>
          {winners && (
            <ResultsOverlay
              onExit={onExit}
              playerResults={players
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((p, rank) => {
                  const avg =
                    p.rounds.length > 0
                      ? Math.round(
                          p.rounds.reduce((a, r) => a + r.score, 0) / p.rounds.length,
                        )
                      : 0;
                  return {
                    name: p.name,
                    isWinner: winners.includes(p.name),
                    rank: rank + 1,
                    stats: [
                      { label: "total", value: String(p.score) },
                      { label: "avg", value: String(avg) },
                      { label: "rounds", value: String(p.rounds.length) },
                    ],
                  };
                })}
            />
          )}
          {pendingAward && (
            <AwardOverlay award={pendingAward} onDismiss={() => setPendingAward(null)} />
          )}
          {inPlayoff && !winners && (
            <div className="absolute top-0 inset-x-0 z-10 bg-[var(--color-game-accent)] text-[var(--color-game-accent-text)] text-center py-2 font-black text-sm uppercase tracking-widest">
              Playoff — throw 1 dart
            </div>
          )}
        </>
      }
    >
      {/* Main area */}
      <div className="flex-1 flex min-h-0" style={{ paddingLeft: "var(--sal)" }}>

        {/* Left: active player score */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 px-4 py-2">
          <div className="flex items-center gap-3 shrink-0">
            <span className="glow-dot" />
            <span className="text-[var(--color-game-accent)] font-black uppercase tracking-widest text-lg">
              {currentPlayer?.name}
            </span>
          </div>
          <div className="flex-1 flex items-center min-h-0 gap-2">
            {/* Big score */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-0">
              <p className="text-[min(6rem,20vh)] font-black tabular-nums leading-none text-white">
                {(currentPlayer?.score ?? 0) + roundTotal}
              </p>
              {roundTotal > 0 && (
                <p className="text-[var(--color-game-accent)] font-black text-2xl tabular-nums">+{roundTotal}</p>
              )}
            </div>
            {/* Round history */}
            <div className="flex flex-col justify-center gap-1 shrink-0 w-20 overflow-hidden min-h-0">
              {[...(currentPlayer?.rounds ?? [])].reverse().slice(0, 7).map((r, i, arr) => {
                const round = (currentPlayer?.rounds.length ?? 0) - i;
                const opacity = 1 - i * (0.8 / Math.max(arr.length, 1));
                return (
                  <div key={i} className="flex flex-col" style={{ opacity: Math.max(opacity, 0.15) }}>
                    <div className="flex items-baseline gap-1">
                      <span className="text-zinc-600 text-[9px] font-bold w-5 shrink-0">R{round}</span>
                      <span className="text-xs font-black tabular-nums text-zinc-300">{r.score}</span>
                    </div>
                    <div className="flex gap-0.5 pl-5 flex-wrap">
                      {r.darts.map((d, di) => (
                        <span key={di} className="text-[9px] tabular-nums text-zinc-500">
                          {d.shortName}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: dart slots + Next Turn button */}
        <div className="flex flex-col shrink-0 w-24 border-l border-border-default min-h-0">

          {/* Compact dart slots */}
          <div className="flex flex-col gap-1 p-2 shrink-0">
            {[0, 1, 2].map((j) => {
              const dart = currentRoundDarts[j];
              const isNext = j === currentRoundDarts.length && !readyToSwitch;
              const state = dart
                ? dart.value > 0
                  ? "scored"
                  : "miss"
                : isNext
                  ? "next"
                  : "empty";
              return (
                <div key={j} className="dart-slot" data-state={state}>
                  {dart ? (
                    <>
                      <span className={`text-xs font-black leading-none ${dart.value > 0 ? "text-[var(--color-game-accent)]" : "text-zinc-600"}`}>
                        {dart.value}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">
                        {dart.segment.ShortName}
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

          {/* Next Turn button */}
          <div className="relative flex-1 min-h-0 p-2">
            {readyToSwitch && !winners && (
              <span
                className="absolute inset-2 rounded-xl opacity-20 animate-ping"
                style={{ backgroundColor: "var(--color-game-accent)" }}
              />
            )}
            {isCurrentBot ? (
              <div className="w-full h-full rounded-xl bg-surface-raised border-2 border-purple-900 flex flex-col items-center justify-center gap-1 opacity-70">
                <span className="text-state-bot text-[10px] uppercase tracking-widest font-black">CPU</span>
                <span className="text-purple-600 text-base animate-pulse">···</span>
              </div>
            ) : (
              <button
                onClick={handleNextTurn}
                disabled={!!winners}
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
                <span className="text-center leading-tight px-1">{nextLabel()}</span>
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
          const avg =
            player.rounds.length > 0
              ? Math.round(
                  player.rounds.reduce((a, r) => a + r.score, 0) / player.rounds.length,
                )
              : 0;
          return (
            <div
              key={i}
              className="player-strip-cell border-r border-border-default last:border-r-0"
              data-active={String(isActive)}
              style={i === 0 ? { paddingLeft: "var(--sal)" } : undefined}
            >
              <span className={`font-black uppercase tracking-wide truncate max-w-full transition-colors duration-300 ${isActive ? "text-[var(--color-game-accent)]" : "text-content-faint"} ${textSizes.name}`}>
                {player.name}
              </span>
              <span className={`font-black tabular-nums leading-tight transition-colors duration-300 ${isActive ? "text-content-primary" : "text-content-muted"} ${textSizes.score}`}>
                {player.score}
              </span>
              <span className={`tabular-nums transition-colors duration-300 ${isActive ? "text-content-secondary" : "text-content-faint"} ${textSizes.stat}`}>
                avg {avg}
              </span>
            </div>
          );
        })}
      </div>
    </GameShell>
  );
}
