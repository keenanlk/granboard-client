import { useEffect, useState } from "react";
import { useHighScoreStore, type HighScoreOptions } from "../store/useHighScoreStore.ts";
import { HighScoreController } from "../controllers/HighScoreController.ts";
import { useGameSession } from "../hooks/useGameSession.ts";
import { GameShell } from "../components/GameShell.tsx";
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
  onExit: () => void;
}

export function HighScoreScreen({
  options,
  playerNames,
  playerIds,
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
      headerBorderClass="border-yellow-900"
      title={
        <>
          <span className="font-black text-yellow-400 text-2xl tracking-widest">
            High Score
          </span>
          <span className="text-zinc-500 text-xs uppercase tracking-widest">
            Round {currentRound} of {options.rounds}
          </span>
        </>
      }
      onExit={onExit}
      onUndo={undoLastDart}
      undoDisabled={currentRoundDarts.length === 0 || !!winners}
      isTransitioning={isTransitioning}
      countdown={countdown}
      nextPlayerName={n > 1 ? nextPlayer?.name : undefined}
      overlays={
        <>
          {winners && (
            <ResultsOverlay
              accentClass="text-yellow-400"
              buttonClass="bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black"
              glowClass="shadow-[0_0_30px_rgba(234,179,8,0.4)]"
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
            <div className="absolute top-0 inset-x-0 z-10 bg-yellow-500 text-black text-center py-2 font-black text-sm uppercase tracking-widest">
              Playoff — throw 1 dart
            </div>
          )}
        </>
      }
    >
      {/* Main area */}
      <div className="flex-1 flex min-h-0">

        {/* Left: active player score */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 px-4 py-2">
          <div className="flex items-center gap-3 shrink-0">
            <span className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_10px_4px_rgba(234,179,8,0.5)]" />
            <span className="text-yellow-400 font-black uppercase tracking-widest text-lg">
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
                <p className="text-yellow-400 font-black text-2xl tabular-nums">+{roundTotal}</p>
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
        <div className="flex flex-col shrink-0 w-24 border-l border-zinc-800 min-h-0">

          {/* Compact dart slots */}
          <div className="flex flex-col gap-1 p-2 shrink-0">
            {[0, 1, 2].map((j) => {
              const dart = currentRoundDarts[j];
              const isNext = j === currentRoundDarts.length && !readyToSwitch;
              return (
                <div
                  key={j}
                  className={`h-7 rounded flex items-center justify-center gap-1.5 border transition-all duration-200 ${
                    dart
                      ? dart.value > 0
                        ? "border-yellow-600 bg-yellow-950/40"
                        : "border-zinc-700 bg-zinc-800/40"
                      : isNext
                        ? "border-yellow-700 border-dashed bg-zinc-900"
                        : "border-zinc-800 bg-zinc-900/50"
                  }`}
                >
                  {dart ? (
                    <>
                      <span className={`text-xs font-black leading-none ${dart.value > 0 ? "text-yellow-400" : "text-zinc-600"}`}>
                        {dart.value}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">
                        {dart.segment.ShortName}
                      </span>
                    </>
                  ) : isNext ? (
                    <span className="text-yellow-700 text-xs font-black">{j + 1}</span>
                  ) : (
                    <span className="text-zinc-700 text-xs">·</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Next Turn button */}
          <div className="relative flex-1 min-h-0 p-2">
            {readyToSwitch && !winners && (
              <span className="absolute inset-2 rounded-xl bg-yellow-500 opacity-20 animate-ping" />
            )}
            <button
              onClick={handleNextTurn}
              disabled={!!winners}
              className={`relative w-full h-full rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                readyToSwitch
                  ? "bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black shadow-[0_0_24px_rgba(234,179,8,0.35)]"
                  : "bg-zinc-900 border-2 border-zinc-800 text-zinc-600"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="text-center leading-tight px-1">{nextLabel()}</span>
              <span className="text-base">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Player strip — always single row */}
      <div
        className={`shrink-0 grid border-t-2 bg-black transition-all duration-300 ${
          readyToSwitch ? "border-yellow-800" : "border-zinc-800"
        }`}
        style={{
          gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
          paddingBottom: "calc(var(--sab) + 0.25rem)",
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
              className={`flex flex-col items-center justify-center py-1.5 px-1 border-r border-zinc-800 last:border-r-0 transition-all duration-300 ${
                isActive ? "bg-zinc-900 shadow-[inset_0_2px_0_rgba(234,179,8,0.5)]" : "bg-black"
              }`}
            >
              <span className={`font-black uppercase tracking-wide truncate max-w-full transition-colors duration-300 ${isActive ? "text-yellow-400" : "text-zinc-600"} ${textSizes.name}`}>
                {player.name}
              </span>
              <span className={`font-black tabular-nums leading-tight transition-colors duration-300 ${isActive ? "text-white" : "text-zinc-500"} ${textSizes.score}`}>
                {player.score}
              </span>
              <span className={`tabular-nums transition-colors duration-300 ${isActive ? "text-zinc-400" : "text-zinc-700"} ${textSizes.stat}`}>
                avg {avg}
              </span>
            </div>
          );
        })}
      </div>
    </GameShell>
  );
}
