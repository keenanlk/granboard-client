import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGameStore } from "../store/useGameStore.ts";
import {
  detectAward,
  Bot,
  getBotCharacter,
  CreateSegment,
  x01PickTarget,
} from "@nlc-darts/engine";
import type {
  X01Options,
  BotSkill,
  SegmentID,
  SetProgress,
  SetConfig,
  LegResult,
} from "@nlc-darts/engine";
import { AwardOverlay } from "../components/AwardOverlay.tsx";
import { ResultsOverlay } from "../components/ResultsOverlay.tsx";
import { X01Controller } from "../controllers/X01Controller.ts";
import { guardForOnlineTurn } from "../controllers/OnlineTurnGuard.ts";
import { setActiveController } from "../controllers/GameController.ts";
import { useGameSession } from "../hooks/useGameSession.ts";
import { useOnlineRematch } from "../hooks/useOnlineRematch.ts";
import { useBotTurn } from "../hooks/useBotTurn.ts";
import { useAwardDetection } from "../hooks/useAwardDetection.ts";
import { GameShell } from "../components/GameShell.tsx";
import { DartboardSVG } from "../components/DartboardSVG.tsx";
import { gameLogger } from "../lib/GameLogger.ts";
import { GameMenu } from "../components/GameMenu.tsx";
import { HistoryRow } from "../components/HistoryRow.tsx";
import { BotThinkingIndicator } from "../components/BotThinkingIndicator.tsx";
import { playerTextSizes } from "../lib/playerTextSizes.ts";
import type { OnlineConfig } from "../store/useOnlineStore.ts";
import { useColyseusSync } from "../hooks/useColyseusSync.ts";
import { ColyseusRemoteController } from "../controllers/ColyseusRemoteController.ts";
import { OnlineIndicator } from "../components/OnlineIndicator.tsx";
import { WaitingOverlay } from "../components/WaitingOverlay.tsx";

interface GameScreenProps {
  x01Options: X01Options;
  playerNames: string[];
  playerIds: (string | null)[];
  botSkills: (BotSkill | null)[];
  restoredState?: unknown;
  onExit: () => void;
  onRematch: () => void;
  setProgress?: SetProgress;
  onNextLeg?: () => void;
  setConfig?: SetConfig;
  legResults?: LegResult[];
  currentLegIndex?: number;
  onlineConfig?: OnlineConfig;
}

export function GameScreen({
  x01Options,
  playerNames,
  playerIds,
  botSkills,
  restoredState,
  onExit,
  onRematch,
  setProgress,
  onNextLeg,
  setConfig,
  legResults,
  currentLegIndex,
  onlineConfig,
}: GameScreenProps) {
  const {
    players,
    currentPlayerIndex,
    currentRoundDarts,
    isBust,
    winner,
    undoStack,
    startGame,
    undoLastDart,
  } = useGameStore();

  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [botBoard, setBotBoard] = useState<{
    segment: SegmentID;
    mode: "outline" | "fill";
  } | null>(null);

  // Refs for deferred callbacks — populated after hooks that define them
  const dismissOverlaysRef = useRef<(() => void) | undefined>(undefined);
  const colyseusRoomRef = useRef<unknown>(null);

  const { handleNextTurn, isTransitioning, countdown, triggerRemoteDelay } =
    useGameSession({
      gameType: "x01",
      playerNames,
      playerIds,
      botSkills,
      options: x01Options,
      createController: () => {
        if (onlineConfig && colyseusRoomRef.current) {
          const localIndex = onlineConfig.isHost ? 0 : 1;
          return guardForOnlineTurn(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            new ColyseusRemoteController(colyseusRoomRef.current as any),
            localIndex,
            () => useGameStore.getState().currentPlayerIndex,
          );
        }
        return new X01Controller();
      },
      extractRound: () => {
        const { currentPlayerIndex, currentRoundDarts, isBust } =
          useGameStore.getState();
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
      getSerializableState: () =>
        useGameStore.getState().getSerializableState(),
      onInit: () => {
        if (restoredState) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          useGameStore.getState().restoreState(restoredState as any);
        } else {
          startGame(x01Options, playerNames);
        }
      },
      setConfig,
      legResults,
      currentLegIndex,
      // With Colyseus, the server handles turn delay broadcasting
      shouldSkipDelay: onlineConfig ? () => true : undefined,
      online: !!onlineConfig,
      onBeforeNextTurn: () => dismissOverlaysRef.current?.(),
    });

  // Colyseus sync — always called, no-op when onlineConfig is null
  const { room } = useColyseusSync({
    onlineConfig: onlineConfig ?? null,
    restoreState: (state) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useGameStore.getState().restoreState(state as any),
    onOpponentDisconnected: () => {
      setOpponentDisconnected(true);
    },
    onTurnDelay: () => {
      triggerRemoteDelay();
    },
  });

  // When Colyseus room connects, swap to the remote controller
  useEffect(() => {
    colyseusRoomRef.current = room;
    if (room && onlineConfig) {
      const localIndex = onlineConfig.isHost ? 0 : 1;
      const controller = guardForOnlineTurn(
        new ColyseusRemoteController(room),
        localIndex,
        () => useGameStore.getState().currentPlayerIndex,
      );
      setActiveController(controller);
    }
  }, [room, onlineConfig]);

  // Build bot map once per game session — indices match the player array.
  const bots = useMemo(() => {
    const map = new Map<number, Bot>();
    botSkills.forEach((skill, i) => {
      if (skill !== null) map.set(i, new Bot(playerNames[i], skill));
    });
    return map;
  }, [botSkills, playerNames]);

  const isCurrentBot = bots.has(currentPlayerIndex);
  const isOnlineOpponentTurn =
    !!onlineConfig &&
    !isCurrentBot &&
    (onlineConfig.isHost ? currentPlayerIndex !== 0 : currentPlayerIndex !== 1);

  // Reads live store state at throw time — stable, no component deps.
  const getThrow = useCallback((bot: Bot) => {
    const {
      players: ps,
      x01Options: opts,
      currentPlayerIndex: ci,
    } = useGameStore.getState();
    const p = ps[ci];
    return CreateSegment(
      bot.throwX01(p.score, opts, p.opened, (target, actual) => {
        gameLogger.logDart(bot.name, target, actual, {
          remainingScore: p.score,
        });
        setBotBoard({ segment: actual, mode: "fill" });
      }),
    );
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

  // Show bot dartboard overlay: outline on target before throw, fill on actual after throw.
  // Clear board when bot is not active (use a 0ms timeout to avoid synchronous setState in effect).
  useEffect(() => {
    if (!isCurrentBot || !!winner || isTransitioning) {
      const t = setTimeout(() => setBotBoard(null), 0);
      return () => clearTimeout(t);
    }
    const dartsThrown = currentRoundDarts.length;
    // After last dart or bust, keep fill state (set by getThrow) — don't override.
    if (dartsThrown >= 3 || isBust) return;

    // After a dart lands (fill set by getThrow), wait 800ms then show next target outline.
    // For the first dart (dartsThrown=0), show outline immediately.
    const delay = dartsThrown > 0 ? 800 : 0;
    const t = setTimeout(() => {
      const {
        players: ps,
        x01Options: opts,
        currentPlayerIndex: ci,
      } = useGameStore.getState();
      const p = ps[ci];
      if (!p) return;
      const target = x01PickTarget(p.score, opts, p.opened);
      setBotBoard({ segment: target, mode: "outline" });
    }, delay);
    return () => clearTimeout(t);
  }, [
    isCurrentBot,
    currentPlayerIndex,
    currentRoundDarts.length,
    isBust,
    winner,
    isTransitioning,
  ]);

  // Online opponent dartboard overlay: fill on each dart hit, clear when not opponent's turn.
  useEffect(() => {
    if (!isOnlineOpponentTurn || !!winner || isTransitioning) {
      const t = setTimeout(() => setBotBoard(null), 0);
      return () => clearTimeout(t);
    }
    const dartsThrown = currentRoundDarts.length;
    if (dartsThrown === 0) return;
    const lastDart = currentRoundDarts[dartsThrown - 1];
    const t = setTimeout(
      () => setBotBoard({ segment: lastDart.segment.ID, mode: "fill" }),
      0,
    );
    return () => clearTimeout(t);
  }, [
    isOnlineOpponentTurn,
    currentRoundDarts.length,
    winner,
    isTransitioning,
    currentRoundDarts,
  ]);

  const n = players.length;
  const currentPlayer = players[currentPlayerIndex];
  const roundTotal = currentRoundDarts
    .filter((d) => d.scored)
    .reduce((sum, d) => sum + d.segment.Value, 0);
  const readyToSwitch = currentRoundDarts.length === 3 || isBust;
  const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
  const nextPlayer = players[nextPlayerIndex];
  const needsDouble = x01Options.doubleIn && !currentPlayer?.opened;
  const textSizes = playerTextSizes(n);

  const [pendingAward, dismissAward] = useAwardDetection(
    readyToSwitch && !isBust && !winner,
    () => detectAward(currentRoundDarts),
  );
  useEffect(() => {
    dismissOverlaysRef.current = dismissAward;
  });

  const { rematchState, requestRematch, acceptRematch, declineRematch } =
    useOnlineRematch(onlineConfig);

  // When both players accept rematch, trigger it
  useEffect(() => {
    if (rematchState === "accepted") onRematch();
    if (rematchState === "declined") onExit();
  }, [rematchState, onRematch, onExit]);

  return (
    <GameShell
      gameClass="game-x01"
      title={
        <>
          {onlineConfig && (
            <OnlineIndicator
              isHost={onlineConfig.isHost}
              connected={!opponentDisconnected}
            />
          )}
          {setProgress && (
            <span className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">
              Leg {setProgress.currentLeg}/{setProgress.totalLegs}
            </span>
          )}
          <span className="font-black text-[var(--color-game-accent)] text-2xl tracking-widest">
            {x01Options.startingScore}
          </span>
          <span className="text-zinc-600 text-xs uppercase tracking-widest">
            {[
              x01Options.splitBull && "Split Bull",
              x01Options.doubleIn && "Double In",
              x01Options.doubleOut && "Double Out",
              x01Options.masterOut && "Master Out",
            ]
              .filter(Boolean)
              .join(" \u00B7 ") || "Straight Out"}
          </span>
        </>
      }
      onExit={onExit}
      onUndo={undoLastDart}
      undoDisabled={!!winner || isCurrentBot || undoStack.length === 0}
      isTransitioning={isTransitioning}
      countdown={countdown}
      nextPlayerName={nextPlayer?.name}
      onNextTurn={handleNextTurn}
      showNextTurn={readyToSwitch}
      hasWinner={!!winner}
      overlays={
        <>
          {onlineConfig && opponentDisconnected && !winner && (
            <WaitingOverlay message="Opponent disconnected" onCancel={onExit} />
          )}
          {winner && !pendingAward && (
            <ResultsOverlay
              onExit={onExit}
              onRematch={onlineConfig || setProgress ? undefined : onRematch}
              setProgress={setProgress}
              onNextLeg={onNextLeg}
              onlineRematch={
                onlineConfig && !setProgress
                  ? {
                      state: rematchState,
                      onRequest: requestRematch,
                      onAccept: acceptRematch,
                      onDecline: declineRematch,
                    }
                  : undefined
              }
              playerResults={players
                .slice()
                .sort((a, b) => a.score - b.score)
                .map((p, rank) => {
                  const ppd =
                    p.totalDartsThrown === 0
                      ? "0.00"
                      : (
                          (x01Options.startingScore - p.score) /
                          p.totalDartsThrown
                        ).toFixed(2);
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
            <AwardOverlay award={pendingAward} onDismiss={dismissAward} />
          )}
        </>
      }
    >
      {/* Main area */}
      <div
        className="flex-1 flex min-h-0 relative"
        style={{ paddingLeft: "var(--sal)" }}
      >
        {/* Bot dartboard overlay — shows target (outline) and actual hit (fill) */}
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
            {(isBust || needsDouble) && (
              <span
                className={`uppercase tracking-widest font-black text-[clamp(0.75rem,1.5vw,1.75rem)] ${isBust ? "text-state-bust" : "text-state-warning"}`}
              >
                · {isBust ? "BUST!" : "Need ×"}
              </span>
            )}
          </div>

          {/* Big score */}
          <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            {(isBust || (roundTotal > 0 && !isBust)) && (
              <span
                className={`font-black leading-none mb-2 text-[clamp(1.25rem,2.5vw,3rem)] ${isBust ? "text-state-bust uppercase tracking-widest" : "text-[var(--color-game-accent)]"}`}
              >
                {isBust ? "BUST" : `−${roundTotal}`}
              </span>
            )}
            <span
              key={`${currentPlayerIndex}-${currentPlayer?.score}`}
              className={`font-normal tabular-nums leading-none select-none score-animate text-[clamp(7rem,20vw,45rem)] ${
                isBust ? "text-state-bust" : ""
              }`}
              style={{
                fontFamily: "Beon, sans-serif",
                ...(!isBust
                  ? {
                      color: "var(--color-game-accent)",
                      textShadow:
                        "0 0 20px var(--color-game-accent), 0 0 60px var(--color-game-accent), 0 0 100px var(--color-game-accent-glow), 0 0 150px var(--color-game-accent-glow)",
                    }
                  : {}),
              }}
            >
              {currentPlayer?.score ?? ""}
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
              {setProgress && (
                <span className="text-blue-400 text-[clamp(0.5rem,0.8vw,0.7rem)] font-bold uppercase tracking-widest">
                  Leg {setProgress.currentLeg}/{setProgress.totalLegs}
                </span>
              )}
              <span className="font-black text-[var(--color-game-accent)] text-[clamp(0.8rem,1.3vw,1.25rem)] tracking-widest tabular-nums">
                {x01Options.startingScore}
              </span>
              <span className="text-zinc-600 text-[clamp(0.5rem,0.8vw,0.7rem)] uppercase tracking-widest">
                {[
                  x01Options.splitBull && "Split",
                  x01Options.doubleIn && "DblIn",
                  x01Options.doubleOut && "DblOut",
                  x01Options.masterOut && "MstrOut",
                ]
                  .filter(Boolean)
                  .join(" · ") || "Straight"}
              </span>
            </div>
            <GameMenu
              onUndo={undoLastDart}
              undoDisabled={!!winner || isCurrentBot || undoStack.length === 0}
              onExit={onExit}
            />
          </div>

          {/* Rows: current round (live) + completed rounds newest-first */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-1 gap-1.5 pt-1">
            <HistoryRow
              roundNum={(currentPlayer?.rounds?.length ?? 0) + 1}
              darts={currentRoundDarts.map((thrown, j) => ({
                value: thrown.segment.Value,
                shortName: thrown.segment.ShortName,
                state:
                  !thrown.scored && isBust && j === currentRoundDarts.length - 1
                    ? "bust"
                    : thrown.scored
                      ? "scored"
                      : "miss",
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
          const ppd =
            player.totalDartsThrown === 0
              ? "0.00"
              : (
                  (x01Options.startingScore - player.score) /
                  player.totalDartsThrown
                ).toFixed(2);
          return (
            <div
              key={i}
              className="player-strip-cell border-r border-border-default last:border-r-0"
              data-active={String(isActive)}
              style={i === 0 ? { paddingLeft: "var(--sal)" } : undefined}
            >
              <span
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
                className={`font-black uppercase tracking-wide truncate max-w-full transition-colors duration-300 ${botSkills[i] != null ? getBotCharacter(botSkills[i]!).animationClass : isActive ? "text-[var(--color-game-accent)]" : "text-content-faint"}`}
              >
                {player.name}
              </span>
              <span
                style={{ fontSize: textSizes.score }}
                className={`font-black tabular-nums leading-tight transition-colors duration-300 ${isActive ? "text-content-primary" : "text-content-muted"}`}
              >
                {player.score}
              </span>
              <span
                style={{ fontSize: textSizes.stat }}
                className={`tabular-nums transition-colors duration-300 ${isActive ? "text-content-secondary" : "text-content-faint"}`}
              >
                {ppd} ppd
              </span>
            </div>
          );
        })}
      </div>
    </GameShell>
  );
}
