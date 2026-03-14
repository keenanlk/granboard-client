import { useEffect, useState } from "react";
import { useGameStore, type X01Options } from "../store/useGameStore.ts";
import { AwardOverlay } from "../components/AwardOverlay.tsx";
import { ResultsOverlay } from "../components/ResultsOverlay.tsx";
import { detectAward } from "../lib/awards.ts";
import type { AwardType } from "../lib/awards.ts";
import { X01Controller } from "../controllers/X01Controller.ts";
import { useGameSession } from "../hooks/useGameSession.ts";
import { GameShell } from "../components/GameShell.tsx";

function playerTextSizes(n: number) {
  if (n <= 2) return { name: "text-sm", score: "text-2xl", stat: "text-xs" };
  if (n <= 4) return { name: "text-xs", score: "text-xl", stat: "text-xs" };
  if (n <= 6) return { name: "text-[10px]", score: "text-base", stat: "text-[9px]" };
  return { name: "text-[9px]", score: "text-sm", stat: "text-[8px]" };
}

interface GameScreenProps {
  x01Options: X01Options;
  playerNames: string[];
  playerIds: (string | null)[];
  onExit: () => void;
}

export function GameScreen({ x01Options, playerNames, playerIds, onExit }: GameScreenProps) {
  const { players, currentPlayerIndex, currentRoundDarts, isBust, winner, startGame, undoLastDart } =
    useGameStore();

  const { handleNextTurn, isTransitioning, countdown } = useGameSession({
    gameType: "x01",
    playerNames,
    playerIds,
    options: x01Options,
    createController: () => new X01Controller(),
    extractRound: () => {
      const { currentPlayerIndex, currentRoundDarts, isBust } = useGameStore.getState();
      const roundTotal = currentRoundDarts
        .filter((d) => d.scored)
        .reduce((sum, d) => sum + d.segment.Value, 0);
      return {
        playerIndex: currentPlayerIndex,
        darts: currentRoundDarts.map((d) => ({
          value: d.segment.Value,
          shortName: d.segment.ShortName,
          scored: d.scored,
        })),
        roundScore: isBust ? 0 : roundTotal,
      };
    },
    winner: winner ? [winner] : null,
    getFinalScores: () => useGameStore.getState().players.map((p) => p.score),
    onInit: () => startGame(x01Options, playerNames),
  });

  const n = players.length;
  const currentPlayer = players[currentPlayerIndex];
  const roundTotal = currentRoundDarts.filter((d) => d.scored).reduce((sum, d) => sum + d.segment.Value, 0);
  const readyToSwitch = currentRoundDarts.length === 3 || isBust;
  const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
  const nextPlayer = players[nextPlayerIndex];
  const needsDouble = x01Options.doubleIn && !currentPlayer?.opened;
  const textSizes = playerTextSizes(n);

  const [pendingAward, setPendingAward] = useState<AwardType | null>(null);
  useEffect(() => {
    if (!readyToSwitch || isBust) return;
    const award = detectAward(currentRoundDarts);
    if (award) setPendingAward(award);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToSwitch]);

  return (
    <GameShell
      headerBorderClass="border-green-900"
      title={
        <>
          <span className="font-black text-green-400 text-2xl tracking-widest">
            {x01Options.startingScore}
          </span>
          <span className="text-zinc-600 text-xs uppercase tracking-widest">
            {[
              x01Options.splitBull && "Split Bull",
              x01Options.doubleIn && "Double In",
              x01Options.doubleOut && "Double Out",
              x01Options.masterOut && "Master Out",
            ].filter(Boolean).join(" · ") || "Straight Out"}
          </span>
        </>
      }
      onExit={onExit}
      onUndo={undoLastDart}
      undoDisabled={currentRoundDarts.length === 0 || !!winner}
      isTransitioning={isTransitioning}
      countdown={countdown}
      nextPlayerName={nextPlayer?.name}
      overlays={
        <>
          {winner && (
            <ResultsOverlay
              accentClass="text-green-400"
              buttonClass="bg-green-600 hover:bg-green-500 active:bg-green-700 text-white"
              glowClass="shadow-[0_0_30px_rgba(34,197,94,0.4)]"
              onExit={onExit}
              playerResults={players
                .slice()
                .sort((a, b) => a.score - b.score)
                .map((p, rank) => {
                  const ppd =
                    p.totalDartsThrown === 0
                      ? "0.00"
                      : ((x01Options.startingScore - p.score) / p.totalDartsThrown).toFixed(2);
                  return {
                    name: p.name,
                    isWinner: p.name === winner,
                    rank: rank + 1,
                    stats: [
                      { label: "remaining", value: String(p.score) },
                      { label: "darts", value: String(p.totalDartsThrown) },
                      { label: "ppd", value: ppd },
                    ],
                  };
                })}
            />
          )}
          {pendingAward && (
            <AwardOverlay award={pendingAward} onDismiss={() => setPendingAward(null)} />
          )}
        </>
      }
    >
      {/* Main area */}
      <div className="flex-1 flex min-h-0">

        {/* Left: active player score */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 px-4 py-2">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_3px_rgba(34,197,94,0.6)]" />
            <span className="text-green-400 font-black uppercase tracking-widest text-base">
              {currentPlayer?.name}
            </span>
            {(isBust || needsDouble) && (
              <span className={`text-xs uppercase tracking-widest font-black ${isBust ? "text-red-500" : "text-yellow-400"}`}>
                · {isBust ? "BUST!" : "Need ×"}
              </span>
            )}
          </div>

          <div className="flex-1 flex items-center min-h-0 gap-2">
            {/* Big score */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-0">
              {(isBust || (roundTotal > 0 && !isBust)) && (
                <span className={`font-black text-lg leading-none mb-1 ${isBust ? "text-red-400 text-xs uppercase tracking-widest" : "text-green-400"}`}>
                  {isBust ? "BUST" : `−${roundTotal}`}
                </span>
              )}
              <span
                className={`font-black tabular-nums leading-none select-none ${
                  isBust ? "text-red-500" : "text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                } text-[min(9rem,22vh)]`}
              >
                {currentPlayer?.score ?? ""}
              </span>
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
                      <span className={`text-xs font-black tabular-nums ${r.score === 0 ? "text-red-400" : "text-zinc-300"}`}>{r.score}</span>
                    </div>
                    <div className="flex gap-0.5 pl-5 flex-wrap">
                      {r.darts.map((d, di) => (
                        <span key={di} className={`text-[9px] tabular-nums ${d.scored ? "text-zinc-500" : "text-zinc-700"}`}>
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
              const thrown = currentRoundDarts[j];
              const isNext = j === currentRoundDarts.length && !readyToSwitch;
              const isBustDart = thrown && !thrown.scored && isBust && j === currentRoundDarts.length - 1;
              return (
                <div
                  key={j}
                  className={`h-7 rounded flex items-center justify-center gap-1.5 border transition-all duration-200 ${
                    thrown
                      ? isBustDart
                        ? "border-red-500 bg-red-950/60"
                        : thrown.scored
                          ? "border-green-600 bg-green-950/60"
                          : "border-zinc-700 bg-zinc-800/50"
                      : isNext
                        ? "border-green-700 border-dashed bg-zinc-900"
                        : "border-zinc-800 bg-zinc-900/50"
                  }`}
                >
                  {thrown ? (
                    <>
                      <span className={`text-xs font-black leading-none ${thrown.scored ? "text-white" : "text-zinc-600"}`}>
                        {thrown.segment.Value}
                      </span>
                      <span className={`text-[10px] font-bold uppercase ${thrown.scored ? "text-green-400" : "text-zinc-700"}`}>
                        {thrown.segment.ShortName}
                      </span>
                    </>
                  ) : isNext ? (
                    <span className="text-green-700 text-xs font-black">{j + 1}</span>
                  ) : (
                    <span className="text-zinc-700 text-xs">·</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Next Turn button */}
          <div className="relative flex-1 min-h-0 p-2">
            {readyToSwitch && !winner && (
              <span className="absolute inset-2 rounded-xl bg-green-500 opacity-20 animate-ping" />
            )}
            <button
              onClick={handleNextTurn}
              disabled={!!winner}
              className={`relative w-full h-full rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
                readyToSwitch
                  ? "bg-green-600 hover:bg-green-500 active:bg-green-700 text-white shadow-[0_0_24px_rgba(34,197,94,0.35)]"
                  : "bg-zinc-900 border-2 border-zinc-800 text-zinc-600"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {readyToSwitch && isBust && (
                <span className="text-[10px] text-red-300 font-black uppercase">Bust</span>
              )}
              <span className="text-center leading-tight px-1">
                {readyToSwitch && nextPlayer ? nextPlayer.name : "Next"}
              </span>
              <span className="text-base">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Player strip — always single row */}
      <div
        className={`shrink-0 grid border-t-2 bg-black transition-all duration-300 ${
          readyToSwitch ? "border-green-800" : "border-zinc-800"
        }`}
        style={{
          gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
          paddingBottom: "calc(var(--sab) + 0.25rem)",
        }}
      >
        {players.map((player, i) => {
          const isActive = i === currentPlayerIndex;
          const ppd =
            player.totalDartsThrown === 0
              ? "0.00"
              : ((x01Options.startingScore - player.score) / player.totalDartsThrown).toFixed(2);
          return (
            <div
              key={i}
              className={`flex flex-col items-center justify-center py-1.5 px-1 border-r border-zinc-800 last:border-r-0 transition-all duration-300 ${
                isActive ? "bg-zinc-900 shadow-[inset_0_2px_0_rgba(34,197,94,0.5)]" : "bg-black"
              }`}
            >
              <span className={`font-black uppercase tracking-wide truncate max-w-full transition-colors duration-300 ${isActive ? "text-green-400" : "text-zinc-600"} ${textSizes.name}`}>
                {player.name}
              </span>
              <span className={`font-black tabular-nums leading-tight transition-colors duration-300 ${isActive ? "text-white" : "text-zinc-500"} ${textSizes.score}`}>
                {player.score}
              </span>
              <span className={`tabular-nums transition-colors duration-300 ${isActive ? "text-zinc-400" : "text-zinc-700"} ${textSizes.stat}`}>
                {ppd} ppd
              </span>
            </div>
          );
        })}
      </div>
    </GameShell>
  );
}
