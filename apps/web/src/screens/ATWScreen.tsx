import { useCallback, useEffect, useMemo, useState } from "react";
import { useATWStore } from "../store/useATWStore.ts";
import {
  ATW_SEQUENCE,
  Bot,
  getBotCharacter,
  CreateSegment,
  atwPickTarget,
} from "@nlc-darts/engine";
import type { ATWOptions, BotSkill, SegmentID } from "@nlc-darts/engine";
import { ATWController } from "../controllers/ATWController.ts";
import { useGameSession } from "../hooks/useGameSession.ts";
import { useBotTurn } from "../hooks/useBotTurn.ts";
import { GameShell } from "../components/GameShell.tsx";
import { DartboardSVG } from "../components/DartboardSVG.tsx";
import { GameMenu } from "../components/GameMenu.tsx";
import { ResultsOverlay } from "../components/ResultsOverlay.tsx";
import { BotThinkingIndicator } from "../components/BotThinkingIndicator.tsx";
import { gameEventBus } from "../events/gameEventBus.ts";
import { gameLogger } from "../lib/GameLogger.ts";
import { playerTextSizes } from "../lib/playerTextSizes.ts";

interface ATWScreenProps {
  options: ATWOptions;
  playerNames: string[];
  playerIds: (string | null)[];
  botSkills: (BotSkill | null)[];
  restoredState?: unknown;
  onExit: () => void;
  onRematch: () => void;
}

export function ATWScreen({
  options,
  playerNames,
  playerIds,
  botSkills,
  restoredState,
  onExit,
  onRematch,
}: ATWScreenProps) {
  const {
    players,
    currentPlayerIndex,
    currentRound,
    currentRoundDarts,
    winners,
    startGame,
    undoLastDart,
    undoStack,
  } = useATWStore();

  const { handleNextTurn, isTransitioning, countdown } = useGameSession({
    gameType: "atw",
    playerNames,
    playerIds,
    botSkills,
    options,
    createController: () => new ATWController(),
    extractRound: () => {
      const { currentPlayerIndex, currentRoundDarts } = useATWStore.getState();
      return {
        playerIndex: currentPlayerIndex,
        darts: currentRoundDarts.map((d) => ({
          value: d.segment.Value,
          shortName: d.segment.ShortName,
        })),
        roundScore: currentRoundDarts.filter((d) => d.hit).length,
      };
    },
    winner: winners,
    getFinalScores: () =>
      useATWStore.getState().players.map((p) => p.targetIndex),
    getSerializableState: () => useATWStore.getState().getSerializableState(),
    onInit: () => {
      if (restoredState) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useATWStore.getState().restoreState(restoredState as any);
      } else {
        startGame(options, playerNames);
      }
      // Emit initial open_numbers for LED
      const { players } = useATWStore.getState();
      if (players.length > 0) {
        const target = players[0].currentTarget;
        gameEventBus.emit("open_numbers", {
          numbers: target <= 20 ? [target] : [],
        });
      }
    },
  });

  const n = players.length;
  const currentPlayer = players[currentPlayerIndex];
  const readyToSwitch =
    currentRoundDarts.length === 3 || currentPlayer?.finished;
  const nextPlayerIndex = (currentPlayerIndex + 1) % n;
  const nextPlayer = players[nextPlayerIndex];
  const textSizes = playerTextSizes(n);

  const bots = useMemo(() => {
    const map = new Map<number, Bot>();
    botSkills.forEach((skill, i) => {
      if (skill !== null) map.set(i, new Bot(playerNames[i], skill));
    });
    return map;
  }, [botSkills, playerNames]);

  const isCurrentBot = bots.has(currentPlayerIndex);

  const [botBoard, setBotBoard] = useState<{
    segment: SegmentID;
    mode: "outline" | "fill";
  } | null>(null);

  const getThrow = useCallback((bot: Bot) => {
    const { players, currentPlayerIndex } = useATWStore.getState();
    const player = players[currentPlayerIndex];
    return CreateSegment(
      bot.throwATW(player.currentTarget, (target, actual) => {
        gameLogger.logDart(bot.name, target, actual, {});
        setBotBoard({ segment: actual, mode: "fill" });
      }),
    );
  }, []);

  useBotTurn({
    bots,
    currentPlayerIndex,
    dartsThrown: currentRoundDarts.length,
    isBust: false,
    hasWinner: !!winners || !!currentPlayer?.finished,
    isTransitioning,
    onNextTurn: handleNextTurn,
    getThrow,
  });

  // Bot dartboard overlay: outline on target, fill on actual hit.
  useEffect(() => {
    if (
      !isCurrentBot ||
      !!winners ||
      !!currentPlayer?.finished ||
      isTransitioning
    ) {
      const t = setTimeout(() => setBotBoard(null), 0);
      return () => clearTimeout(t);
    }
    const dartsThrown = currentRoundDarts.length;
    if (dartsThrown >= 3) return;

    const delay = dartsThrown > 0 ? 800 : 0;
    const t = setTimeout(() => {
      const { players: ps, currentPlayerIndex: ci } = useATWStore.getState();
      const p = ps[ci];
      if (!p) return;
      const target = atwPickTarget(p.currentTarget);
      setBotBoard({ segment: target, mode: "outline" });
    }, delay);
    return () => clearTimeout(t);
  }, [
    isCurrentBot,
    currentPlayerIndex,
    currentRoundDarts.length,
    winners,
    currentPlayer?.finished,
    isTransitioning,
  ]);

  // Auto-advance when player finishes on Bull (show result after brief delay)
  useEffect(() => {
    if (!currentPlayer?.finished || !!winners || isTransitioning) return;
    const timer = setTimeout(() => handleNextTurn(), 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer?.finished, winners, isTransitioning]);

  return (
    <GameShell
      gameClass="game-atw"
      isTransitioning={isTransitioning}
      countdown={countdown}
      nextPlayerName={n > 1 ? nextPlayer?.name : undefined}
      onNextTurn={handleNextTurn}
      showNextTurn={!!readyToSwitch && !currentPlayer?.finished}
      hasWinner={!!winners}
      overlays={
        <>
          {winners && (
            <ResultsOverlay
              onExit={onExit}
              onRematch={onRematch}
              playerResults={players
                .slice()
                .sort((a, b) => b.targetIndex - a.targetIndex)
                .map((p, rank) => ({
                  name: p.name,
                  isWinner: winners.includes(p.name),
                  rank: rank + 1,
                  stats: [
                    {
                      label: "target",
                      value: p.finished
                        ? "Bull"
                        : String(ATW_SEQUENCE[p.targetIndex] ?? "?"),
                    },
                    { label: "darts", value: String(p.totalDartsThrown) },
                    { label: "rounds", value: String(p.rounds.length) },
                  ],
                }))}
            />
          )}
        </>
      }
    >
      {/* Main area */}
      <div
        className="flex-1 flex min-h-0 relative"
        style={{ paddingLeft: "var(--sal)" }}
      >
        {/* Bot dartboard overlay */}
        {botBoard && (
          <div
            className="absolute z-10 pointer-events-none rounded-full"
            style={{
              bottom: "1rem",
              left: "calc(var(--sal) + 1rem)",
              width: "clamp(140px, 18vw, 280px)",
              opacity: 0.85,
              boxShadow:
                "0 0 20px var(--color-game-accent-glow), 0 0 60px var(--color-game-accent-glow), inset 0 0 30px rgba(0,0,0,0.5)",
              background:
                "radial-gradient(circle, rgba(0,0,0,0.6) 60%, transparent 100%)",
            }}
          >
            <DartboardSVG
              className="w-full h-auto drop-shadow-[0_0_8px_var(--color-game-accent-glow)]"
              highlightSegment={botBoard.segment}
              highlightMode={botBoard.mode}
              highlightColor="var(--color-game-accent)"
            />
          </div>
        )}
        {/* Left: active player + current target */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 px-4 py-2">
          <div className="flex items-center gap-2 shrink-0">
            <span className="glow-dot" />
            <span
              className={`font-black uppercase tracking-widest text-[clamp(1rem,2vw,2.5rem)] ${isCurrentBot ? getBotCharacter(botSkills[currentPlayerIndex]!).animationClass : ""}`}
              style={
                isCurrentBot
                  ? {
                      fontFamily: "Beon, sans-serif",
                      color: getBotCharacter(botSkills[currentPlayerIndex]!)
                        .color,
                      textShadow: `0 0 12px ${getBotCharacter(botSkills[currentPlayerIndex]!).glow}`,
                    }
                  : { color: "var(--color-game-accent)" }
              }
            >
              {currentPlayer?.name}
            </span>
          </div>

          {/* Big current target display */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            <span className="text-zinc-500 text-[clamp(0.7rem,1.2vw,1rem)] uppercase tracking-widest mb-1">
              Target
            </span>
            <span
              className="font-normal tabular-nums leading-none select-none text-[clamp(7rem,16vw,40rem)]"
              style={{
                fontFamily: "Beon, sans-serif",
                color: "var(--color-game-accent)",
                textShadow:
                  "0 0 20px var(--color-game-accent), 0 0 60px var(--color-game-accent), 0 0 100px var(--color-game-accent-glow), 0 0 150px var(--color-game-accent-glow)",
              }}
            >
              {currentPlayer?.finished
                ? "Done"
                : currentPlayer?.currentTarget === 25
                  ? "Bull"
                  : (currentPlayer?.currentTarget ?? 1)}
            </span>

            {/* Progress indicator */}
            <div className="mt-4 flex gap-1 items-center flex-wrap justify-center max-w-md">
              {ATW_SEQUENCE.map((num, idx) => {
                const playerIdx = currentPlayer?.targetIndex ?? 0;
                const isPast = idx < playerIdx;
                const isCurrent = idx === playerIdx && !currentPlayer?.finished;
                return (
                  <span
                    key={num}
                    className="font-bold tabular-nums transition-all duration-200"
                    style={{
                      fontSize: isCurrent
                        ? "clamp(0.9rem, 1.5vw, 1.25rem)"
                        : "clamp(0.55rem, 0.9vw, 0.75rem)",
                      color: isPast
                        ? "var(--color-game-accent)"
                        : isCurrent
                          ? "#fff"
                          : "var(--color-content-faint)",
                      textShadow: isCurrent
                        ? "0 0 8px var(--color-game-accent)"
                        : isPast
                          ? "0 0 4px var(--color-game-accent-glow)"
                          : "none",
                      opacity: isPast ? 0.6 : 1,
                    }}
                  >
                    {num === 25 ? "B" : num}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Dart slots */}
          <div className="shrink-0 flex justify-center gap-3 pb-2">
            {[0, 1, 2].map((i) => {
              const dart = currentRoundDarts[i];
              return (
                <div
                  key={i}
                  className="w-16 h-10 rounded-lg border flex items-center justify-center font-bold text-sm transition-all duration-200"
                  style={{
                    borderColor: dart
                      ? dart.hit
                        ? "var(--color-game-accent)"
                        : "var(--color-border-subtle)"
                      : "var(--color-border-subtle)",
                    backgroundColor: dart
                      ? dart.hit
                        ? "var(--color-game-accent-dim)"
                        : "transparent"
                      : "transparent",
                    color: dart
                      ? dart.hit
                        ? "var(--color-game-accent)"
                        : "var(--color-content-faint)"
                      : "var(--color-content-faint)",
                  }}
                >
                  {dart ? dart.segment.ShortName : "--"}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: game info */}
        <div
          className="flex flex-col shrink-0 border-l border-border-default min-h-0"
          style={{ width: "clamp(12rem, 16vw, 22rem)" }}
        >
          {/* Game title + menu */}
          <div
            className="shrink-0 px-2 py-2 flex items-center border-b border-border-default"
            style={{ paddingTop: "calc(var(--sat) + 0.5rem)" }}
          >
            <div className="flex-1 flex flex-col items-center">
              <span className="font-black text-[var(--color-game-accent)] text-[clamp(0.8rem,1.3vw,1.25rem)] tracking-widest">
                Around the World
              </span>
              <span className="text-zinc-600 text-[clamp(0.5rem,0.8vw,0.7rem)] uppercase tracking-widest">
                Round {currentRound}
                {options.roundLimit > 0 ? ` of ${options.roundLimit}` : ""}
              </span>
            </div>
            <GameMenu
              onUndo={undoLastDart}
              undoDisabled={!!winners || isCurrentBot || undoStack.length === 0}
              onExit={onExit}
            />
          </div>

          {/* Round history */}
          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto px-2 py-1 gap-1">
            {[...(currentPlayer?.rounds ?? [])].reverse().map((r, i) => {
              const roundNum = (currentPlayer?.rounds.length ?? 0) - i;
              const startTarget = ATW_SEQUENCE[r.startTargetIndex];
              const endTarget =
                r.endTargetIndex >= ATW_SEQUENCE.length
                  ? "Bull"
                  : ATW_SEQUENCE[r.endTargetIndex];
              return (
                <div
                  key={roundNum}
                  className="flex items-center gap-2 text-xs py-0.5"
                >
                  <span className="text-zinc-600 w-5 text-right tabular-nums">
                    {roundNum}
                  </span>
                  <span className="text-zinc-400 flex-1">
                    {r.darts.map((d) => d.shortName).join(" ")}
                  </span>
                  <span className="text-zinc-500 text-[0.65rem]">
                    {startTarget === 25 ? "B" : startTarget} →{" "}
                    {endTarget === 25 || endTarget === "Bull" ? "B" : endTarget}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bot thinking indicator */}
          {isCurrentBot && (
            <BotThinkingIndicator skill={botSkills[currentPlayerIndex]!} />
          )}
        </div>
      </div>

      {/* Player strip */}
      <div
        className="shrink-0 grid border-t-2 bg-surface-sunken transition-all duration-300"
        style={{
          borderColor: readyToSwitch
            ? "var(--color-game-accent)"
            : "var(--color-border-default)",
          gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
        }}
      >
        {players.map((player, i) => {
          const isActive = i === currentPlayerIndex;
          const target = player.finished
            ? "Done"
            : player.currentTarget === 25
              ? "Bull"
              : String(player.currentTarget);
          const progress = player.finished
            ? ATW_SEQUENCE.length
            : player.targetIndex;
          return (
            <div
              key={i}
              className="player-strip-cell border-r border-border-default last:border-r-0"
              data-active={String(isActive)}
              style={i === 0 ? { paddingLeft: "var(--sal)" } : undefined}
            >
              <span
                className={`font-black uppercase tracking-wide truncate max-w-full transition-colors duration-300 ${botSkills[i] != null ? getBotCharacter(botSkills[i]!).animationClass : isActive ? "text-[var(--color-game-accent)]" : "text-content-faint"}`}
                style={{
                  fontSize: textSizes.name,
                  ...(botSkills[i] != null
                    ? {
                        fontFamily: "Beon, sans-serif",
                        color: getBotCharacter(botSkills[i]!).color,
                        textShadow: isActive
                          ? `0 0 8px ${getBotCharacter(botSkills[i]!).glow}`
                          : "none",
                      }
                    : {}),
                }}
              >
                {player.name}
              </span>
              <span
                className={`font-black tabular-nums leading-tight transition-colors duration-300 ${isActive ? "text-content-primary" : "text-content-muted"}`}
                style={{ fontSize: textSizes.score }}
              >
                {target}
              </span>
              <span
                className={`tabular-nums transition-colors duration-300 ${isActive ? "text-content-secondary" : "text-content-faint"}`}
                style={{ fontSize: textSizes.stat }}
              >
                {progress}/{ATW_SEQUENCE.length}
              </span>
            </div>
          );
        })}
      </div>
    </GameShell>
  );
}
