import { useCallback, useEffect, useMemo, useState } from "react";
import { useGameStore, type X01Options } from "../store/useGameStore.ts";
import { AwardOverlay } from "../components/AwardOverlay.tsx";
import { ResultsOverlay } from "../components/ResultsOverlay.tsx";
import { detectAward } from "../lib/awards.ts";
import type { AwardType } from "../lib/awards.ts";
import { X01Controller } from "../controllers/X01Controller.ts";
import { useGameSession } from "../hooks/useGameSession.ts";
import { useBotTurn } from "../hooks/useBotTurn.ts";
import { GameShell } from "../components/GameShell.tsx";
import { Bot } from "../bot/Bot.ts";
import type { BotSkill } from "../bot/Bot.ts";
import { CreateSegment } from "../board/Dartboard.ts";
import { gameLogger } from "../lib/GameLogger.ts";

interface HistoryRowDart {
  value: number;
  shortName: string;
  state: "scored" | "miss" | "bust";
}

function HistoryRow({
  roundNum,
  darts,
  totalDarts,
  readyToSwitch,
  isCurrent,
}: {
  roundNum: number;
  darts: HistoryRowDart[];
  totalDarts: number;
  readyToSwitch: boolean;
  isCurrent: boolean;
}) {
  return (
    <div
      className={`grid items-center shrink-0 rounded px-0.5 py-0.5 transition-colors duration-200 ${
        isCurrent ? "bg-surface-raised" : ""
      }`}
      style={{ gridTemplateColumns: "1.75rem 1fr 1fr 1fr" }}
    >
      <span className={`text-[clamp(0.6rem,1vw,1rem)] font-bold tabular-nums text-center leading-none ${
        isCurrent ? "text-[var(--color-game-accent)]" : "text-content-faint"
      }`}>
        R{roundNum}
      </span>
      {[0, 1, 2].map((j) => {
        const d = darts[j];
        const isNextSlot = isCurrent && j === totalDarts && !readyToSwitch;
        const cellState = d ? d.state : isNextSlot ? "next" : "empty";
        return (
          <div key={j} className="history-dart-cell" data-state={cellState}>
            {d ? (
              <>
                <span className={`text-[clamp(0.65rem,1.1vw,1.25rem)] font-black leading-none tabular-nums ${
                  d.state === "bust" ? "text-state-bust" :
                  d.state === "scored" ? "text-white" : "text-zinc-600"
                }`}>{d.value}</span>
                <span className={`text-[clamp(0.55rem,0.9vw,1rem)] font-bold uppercase leading-none ${
                  d.state === "bust" ? "text-state-bust" :
                  d.state === "scored" ? "text-[var(--color-game-accent)]" : "text-zinc-700"
                }`}>{d.shortName}</span>
              </>
            ) : isNextSlot ? (
              <span className="text-[var(--color-game-accent)] text-[clamp(0.6rem,1vw,1rem)] font-black opacity-50">{j + 1}</span>
            ) : (
              <span className="text-content-faint text-[clamp(0.6rem,1vw,1rem)]">·</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function playerTextSizes(n: number): { name: string; score: string; stat: string } {
  // Scale with viewport width; denominator shrinks as player count grows
  const div = n <= 2 ? 1 : n <= 4 ? 1.4 : n <= 6 ? 2 : 2.8;
  return {
    name:  `clamp(${(0.7  / div).toFixed(2)}rem, ${(1.8  / div).toFixed(2)}vw, ${(1.5  / div).toFixed(2)}rem)`,
    score: `clamp(${(1.5  / div).toFixed(2)}rem, ${(4.0  / div).toFixed(2)}vw, ${(4.0  / div).toFixed(2)}rem)`,
    stat:  `clamp(${(0.65 / div).toFixed(2)}rem, ${(1.4  / div).toFixed(2)}vw, ${(1.25 / div).toFixed(2)}rem)`,
  };
}

interface GameScreenProps {
  x01Options: X01Options;
  playerNames: string[];
  playerIds: (string | null)[];
  botSkills: (BotSkill | null)[];
  onExit: () => void;
}

export function GameScreen({ x01Options, playerNames, playerIds, botSkills, onExit }: GameScreenProps) {
  const { players, currentPlayerIndex, currentRoundDarts, isBust, winner, startGame, undoLastDart } =
    useGameStore();

  const { handleNextTurn, isTransitioning, countdown } = useGameSession({
    gameType: "x01",
    playerNames,
    playerIds,
    botSkills,
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
        busted: isBust,
      };
    },
    winner: winner ? [winner] : null,
    getFinalScores: () => useGameStore.getState().players.map((p) => p.score),
    onInit: () => startGame(x01Options, playerNames),
  });

  // Build bot map once per game session — indices match the player array.
  const bots = useMemo(() => {
    const map = new Map<number, Bot>();
    botSkills.forEach((skill, i) => {
      if (skill !== null) map.set(i, new Bot(playerNames[i], skill));
    });
    return map;
  }, [botSkills, playerNames]);

  const isCurrentBot = bots.has(currentPlayerIndex);

  // Reads live store state at throw time — stable, no component deps.
  const getThrow = useCallback((bot: Bot) => {
    const { players: ps, x01Options: opts, currentPlayerIndex: ci } = useGameStore.getState();
    const p = ps[ci];
    return CreateSegment(bot.throwX01(p.score, opts, p.opened, (target, actual) => {
      gameLogger.logDart(bot.name, target, actual, { remainingScore: p.score });
    }));
  }, []);

  useBotTurn({
    bots,
    currentPlayerIndex,
    dartsThrown: currentRoundDarts.length,
    isBust,
    hasWinner: !!winner,
    isTransitioning,
    onNextTurn: handleNextTurn,
    getThrow,
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
      gameClass="game-x01"
      title={
        <>
          <span className="font-black text-[var(--color-game-accent)] text-2xl tracking-widest">
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
      undoDisabled={!!winner || isCurrentBot || (currentRoundDarts.length === 0 && players.every((p) => p.rounds.length === 0))}
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
      <div className="flex-1 flex min-h-0" style={{ paddingLeft: "var(--sal)" }}>

        {/* Left: active player score */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 px-4 py-2">
          <div className="flex items-center gap-2 shrink-0">
            <span className="glow-dot" />
            <span className="text-[var(--color-game-accent)] font-black uppercase tracking-widest text-[clamp(1rem,2vw,2.5rem)]">
              {currentPlayer?.name}
            </span>
            {(isBust || needsDouble) && (
              <span className={`uppercase tracking-widest font-black text-[clamp(0.75rem,1.5vw,1.75rem)] ${isBust ? "text-state-bust" : "text-state-warning"}`}>
                · {isBust ? "BUST!" : "Need ×"}
              </span>
            )}
          </div>

          {/* Big score */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            {(isBust || (roundTotal > 0 && !isBust)) && (
              <span className={`font-black leading-none mb-2 text-[clamp(1.25rem,2.5vw,3rem)] ${isBust ? "text-state-bust uppercase tracking-widest" : "text-[var(--color-game-accent)]"}`}>
                {isBust ? "BUST" : `−${roundTotal}`}
              </span>
            )}
            <span
              className={`font-black tabular-nums leading-none select-none ${
                isBust ? "text-state-bust" : "text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]"
              } text-[clamp(7rem,16vw,40rem)]`}
            >
              {currentPlayer?.score ?? ""}
            </span>
          </div>

        </div>

        {/* Right: history grid + Next Turn button */}
        <div className="flex flex-col shrink-0 border-l border-border-default min-h-0" style={{ width: "clamp(12rem, 16vw, 22rem)" }}>

          {/* Column headers */}
          <div className="grid shrink-0 px-1 pt-1.5 pb-0.5" style={{ gridTemplateColumns: "1.75rem 1fr 1fr 1fr" }}>
            <span />
            {["D1","D2","D3"].map((h) => (
              <span key={h} className="text-[clamp(0.6rem,1vw,1rem)] text-content-faint font-bold uppercase text-center">{h}</span>
            ))}
          </div>
          <div className="shrink-0 border-t border-border-default mx-1 mb-1" />

          {/* Rows: current round (live) + completed rounds newest-first */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-1 gap-1">
            <HistoryRow
              roundNum={(currentPlayer?.rounds?.length ?? 0) + 1}
              darts={currentRoundDarts.map((thrown, j) => ({
                value: thrown.segment.Value,
                shortName: thrown.segment.ShortName,
                state: (!thrown.scored && isBust && j === currentRoundDarts.length - 1) ? "bust"
                  : thrown.scored ? "scored" : "miss",
              }))}
              totalDarts={currentRoundDarts.length}
              readyToSwitch={readyToSwitch}
              isCurrent={true}
            />
            {[...(currentPlayer?.rounds ?? [])].reverse().map((r, i) => {
              const roundNum = (currentPlayer?.rounds.length ?? 0) - i;
              return (
                <HistoryRow
                  key={roundNum}
                  roundNum={roundNum}
                  darts={r.darts.map((d) => ({
                    value: d.value,
                    shortName: d.shortName,
                    state: d.scored ? "scored" : "miss",
                  }))}
                  totalDarts={r.darts.length}
                  readyToSwitch={false}
                  isCurrent={false}
                />
              );
            })}
          </div>

          {/* Next Turn button */}
          <div className="relative shrink-0 p-2" style={{ height: "clamp(5rem, 12vh, 9rem)" }}>
            {readyToSwitch && !winner && (
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
                disabled={!!winner}
                className={`relative w-full h-full rounded-xl font-black text-[clamp(0.75rem,1.25vw,1.5rem)] uppercase tracking-widest transition-all duration-200 flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                  readyToSwitch
                    ? "text-[var(--color-game-accent-text)]"
                    : "bg-surface-raised border-2 border-border-default text-content-faint"
                }`}
                style={readyToSwitch ? {
                  backgroundColor: "var(--color-game-accent)",
                  boxShadow: "var(--shadow-glow-md)",
                } : undefined}
              >
                {readyToSwitch && isBust && (
                  <span className="text-[10px] text-state-bust font-black uppercase">Bust</span>
                )}
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
          const ppd =
            player.totalDartsThrown === 0
              ? "0.00"
              : ((x01Options.startingScore - player.score) / player.totalDartsThrown).toFixed(2);
          return (
            <div
              key={i}
              className="player-strip-cell border-r border-border-default last:border-r-0"
              data-active={String(isActive)}
              style={i === 0 ? { paddingLeft: "var(--sal)" } : undefined}
            >
              <span style={{ fontSize: textSizes.name }} className={`font-black uppercase tracking-wide truncate max-w-full transition-colors duration-300 ${isActive ? "text-[var(--color-game-accent)]" : "text-content-faint"}`}>
                {player.name}
              </span>
              <span style={{ fontSize: textSizes.score }} className={`font-black tabular-nums leading-tight transition-colors duration-300 ${isActive ? "text-content-primary" : "text-content-muted"}`}>
                {player.score}
              </span>
              <span style={{ fontSize: textSizes.stat }} className={`tabular-nums transition-colors duration-300 ${isActive ? "text-content-secondary" : "text-content-faint"}`}>
                {ppd} ppd
              </span>
            </div>
          );
        })}
      </div>
    </GameShell>
  );
}
