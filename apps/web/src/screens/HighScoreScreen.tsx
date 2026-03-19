import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHighScoreStore } from "../store/useHighScoreStore.ts";
import {
  Bot,
  getBotCharacter,
  CreateSegment,
  highScorePickTarget,
  detectAward,
} from "@nlc-darts/engine";
import type { HighScoreOptions, BotSkill, SegmentID } from "@nlc-darts/engine";
import { HighScoreController } from "../controllers/HighScoreController.ts";
import { useGameSession } from "../hooks/useGameSession.ts";
import { useBotTurn } from "../hooks/useBotTurn.ts";
import { useAwardDetection } from "../hooks/useAwardDetection.ts";
import { GameShell } from "../components/GameShell.tsx";
import { DartboardSVG } from "../components/DartboardSVG.tsx";
import { gameLogger } from "../lib/GameLogger.ts";
import { GameMenu } from "../components/GameMenu.tsx";
import { AwardOverlay } from "../components/AwardOverlay.tsx";
import { ResultsOverlay } from "../components/ResultsOverlay.tsx";
import { HistoryRow } from "../components/HistoryRow.tsx";
import { BotThinkingIndicator } from "../components/BotThinkingIndicator.tsx";
import { playerTextSizes } from "../lib/playerTextSizes.ts";

interface HighScoreScreenProps {
  options: HighScoreOptions;
  playerNames: string[];
  playerIds: (string | null)[];
  botSkills: (BotSkill | null)[];
  restoredState?: unknown;
  onExit: () => void;
  onRematch: () => void;
}

export function HighScoreScreen({
  options,
  playerNames,
  playerIds,
  botSkills,
  restoredState,
  onExit,
  onRematch,
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
    undoStack,
  } = useHighScoreStore();

  const dismissOverlaysRef = useRef<(() => void) | undefined>(undefined);

  const { handleNextTurn, isTransitioning, countdown } = useGameSession({
    gameType: "highscore",
    playerNames,
    playerIds,
    botSkills,
    options,
    createController: () => new HighScoreController(),
    extractRound: () => {
      const { currentPlayerIndex, currentRoundDarts } =
        useHighScoreStore.getState();
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
    getFinalScores: () =>
      useHighScoreStore.getState().players.map((p) => p.score),
    getSerializableState: () =>
      useHighScoreStore.getState().getSerializableState(),
    onInit: () => {
      if (restoredState) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useHighScoreStore.getState().restoreState(restoredState as any);
      } else {
        startGame(options, playerNames);
      }
    },
    shouldSkipDelay: () => {
      const s = useHighScoreStore.getState();
      const isLast = s.currentPlayerIndex === s.players.length - 1;
      const isFinalRound = s.currentRound === s.options.rounds;
      return isLast && isFinalRound;
    },
    onBeforeNextTurn: () => dismissOverlaysRef.current?.(),
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

  const [botBoard, setBotBoard] = useState<{
    segment: SegmentID;
    mode: "outline" | "fill";
  } | null>(null);

  const getThrow = useCallback(
    (bot: Bot) => {
      return CreateSegment(
        bot.throwHighScore(options.splitBull, (target, actual) => {
          gameLogger.logDart(bot.name, target, actual, {});
          setBotBoard({ segment: actual, mode: "fill" });
        }),
      );
    },
    [options.splitBull],
  );

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

  // Bot dartboard overlay: outline on target, fill on actual hit.
  useEffect(() => {
    if (!isCurrentBot || !!winners || isTransitioning) {
      const t = setTimeout(() => setBotBoard(null), 0);
      return () => clearTimeout(t);
    }
    const dartsThrown = currentRoundDarts.length;
    if (dartsThrown >= 3) return;

    const delay = dartsThrown > 0 ? 800 : 0;
    const t = setTimeout(() => {
      const target = highScorePickTarget(options.splitBull);
      setBotBoard({ segment: target, mode: "outline" });
    }, delay);
    return () => clearTimeout(t);
  }, [
    isCurrentBot,
    currentPlayerIndex,
    currentRoundDarts.length,
    winners,
    isTransitioning,
    options.splitBull,
  ]);

  const [pendingAward, dismissAward] = useAwardDetection(readyToSwitch, () =>
    detectAward(currentRoundDarts),
  );
  useEffect(() => {
    dismissOverlaysRef.current = dismissAward;
  });

  // Auto-advance when last player finishes last round (show results immediately)
  useEffect(() => {
    if (
      !readyToSwitch ||
      !isLastPlayerOfRound ||
      !isLastRound ||
      !!winners ||
      isTransitioning ||
      pendingAward
    )
      return;
    // Small delay so the last dart visually lands before results appear
    const timer = setTimeout(() => handleNextTurn(), 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    readyToSwitch,
    isLastPlayerOfRound,
    isLastRound,
    winners,
    isTransitioning,
    pendingAward,
  ]);

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
      undoDisabled={!!winners || isCurrentBot || undoStack.length === 0}
      isTransitioning={isTransitioning}
      countdown={countdown}
      nextPlayerName={n > 1 ? nextPlayer?.name : undefined}
      onNextTurn={handleNextTurn}
      showNextTurn={readyToSwitch}
      hasWinner={!!winners}
      overlays={
        <>
          {winners && (
            <ResultsOverlay
              onExit={onExit}
              onRematch={onRematch}
              playerResults={players
                .slice()
                .sort((a, b) => b.score - a.score)
                .map((p, rank) => {
                  const avg =
                    p.rounds.length > 0
                      ? Math.round(
                          p.rounds.reduce((a, r) => a + r.score, 0) /
                            p.rounds.length,
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
            <AwardOverlay award={pendingAward} onDismiss={dismissAward} />
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
        {/* Left: active player score */}
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

          {/* Big score */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            {roundTotal > 0 && (
              <span className="text-[var(--color-game-accent)] font-black text-[clamp(1.25rem,2.5vw,3rem)] leading-none mb-2">
                +{roundTotal}
              </span>
            )}
            <span
              className="font-normal tabular-nums leading-none select-none text-[clamp(7rem,16vw,40rem)]"
              style={{
                fontFamily: "Beon, sans-serif",
                color: "var(--color-game-accent)",
                textShadow:
                  "0 0 20px var(--color-game-accent), 0 0 60px var(--color-game-accent), 0 0 100px var(--color-game-accent-glow), 0 0 150px var(--color-game-accent-glow)",
              }}
            >
              {(currentPlayer?.score ?? 0) + roundTotal}
            </span>
          </div>
        </div>

        {/* Right: game info + history grid */}
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
                High Score
              </span>
              <span className="text-zinc-600 text-[clamp(0.5rem,0.8vw,0.7rem)] uppercase tracking-widest">
                Round {currentRound} of {options.rounds}
              </span>
            </div>
            <GameMenu
              onUndo={undoLastDart}
              undoDisabled={!!winners || isCurrentBot || undoStack.length === 0}
              onExit={onExit}
            />
          </div>

          {/* Rows: current round (live) + completed rounds newest-first */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-1 gap-1.5 pt-1">
            <HistoryRow
              roundNum={(currentPlayer?.rounds?.length ?? 0) + 1}
              darts={currentRoundDarts.map((d) => ({
                value: d.value,
                shortName: d.segment.ShortName,
                state: d.value > 0 ? "scored" : "miss",
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
                    state: d.value > 0 ? "scored" : "miss",
                  }))}
                  totalDarts={r.darts.length}
                  readyToSwitch={false}
                  isCurrent={false}
                />
              );
            })}
          </div>

          {/* Bot thinking indicator */}
          {isCurrentBot && (
            <BotThinkingIndicator skill={botSkills[currentPlayerIndex]!} />
          )}
        </div>
      </div>

      {/* Player strip — always single row */}
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
          const avg =
            player.rounds.length > 0
              ? Math.round(
                  player.rounds.reduce((a, r) => a + r.score, 0) /
                    player.rounds.length,
                )
              : 0;
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
                {player.score}
              </span>
              <span
                className={`tabular-nums transition-colors duration-300 ${isActive ? "text-content-secondary" : "text-content-faint"}`}
                style={{ fontSize: textSizes.stat }}
              >
                avg {avg}
              </span>
            </div>
          );
        })}
      </div>
    </GameShell>
  );
}
