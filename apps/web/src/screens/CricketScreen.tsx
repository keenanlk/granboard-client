import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCricketStore } from "../store/useCricketStore.ts";
import {
  CRICKET_TARGETS,
  detectCricketAward,
  Bot,
  getBotCharacter,
  CreateSegment,
  cricketPickTarget,
} from "@nlc-darts/engine";
import type {
  CricketOptions,
  CricketTarget,
  AwardType,
  BotSkill,
  SegmentID,
  SetProgress,
  SetConfig,
  LegResult,
} from "@nlc-darts/engine";
import { AwardOverlay } from "../components/AwardOverlay.tsx";
import { ResultsOverlay } from "../components/ResultsOverlay.tsx";
import { CricketMarksOverlay } from "../components/CricketMarksOverlay.tsx";
import { CricketController } from "../controllers/CricketController.ts";
import { gameEventBus } from "../events/gameEventBus.ts";
import { useGameSession } from "../hooks/useGameSession.ts";
import { useBotTurn } from "../hooks/useBotTurn.ts";
import { GameShell } from "../components/GameShell.tsx";
import { GameMenu } from "../components/GameMenu.tsx";
import { DartboardSVG } from "../components/DartboardSVG.tsx";
import { gameLogger } from "../lib/GameLogger.ts";
import { HistoryRow } from "../components/HistoryRow.tsx";
import { BotThinkingIndicator } from "../components/BotThinkingIndicator.tsx";
import { RobotModel } from "../components/RobotModel.tsx";
import { playerTextSizes } from "../lib/playerTextSizes.ts";
import type { OnlineConfig } from "../store/useOnlineStore.ts";
import { useColyseusSync } from "../hooks/useColyseusSync.ts";
import { ColyseusRemoteController } from "../controllers/ColyseusRemoteController.ts";
import { guardForOnlineTurn } from "../controllers/OnlineTurnGuard.ts";
import { setActiveController } from "../controllers/GameController.ts";
import { useOnlineRematch } from "../hooks/useOnlineRematch.ts";
import { OnlineIndicator } from "../components/OnlineIndicator.tsx";
import { WaitingOverlay } from "../components/WaitingOverlay.tsx";
import { useWebRTC } from "../hooks/useWebRTC.ts";
import { CameraBackground } from "../components/CameraBackground.tsx";
import { CameraPreview } from "../components/CameraPreview.tsx";

interface CricketScreenProps {
  options: CricketOptions;
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

function targetLabel(t: CricketTarget) {
  return t === 25 ? "B" : String(t);
}

function isNumberClosedByAll(
  players: ReturnType<typeof useCricketStore.getState>["players"],
  target: CricketTarget,
) {
  return players.every((p) => p.marks[target] >= 3);
}

function marksIconSize(n: number) {
  if (n <= 2) return "size-[clamp(2.5rem,10vh,6rem)]";
  if (n <= 4) return "size-[clamp(2rem,8vh,5rem)]";
  return "size-[clamp(1.5rem,7vh,4rem)]";
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
  // Colors
  const barColor =
    marks >= 3 ? "var(--color-game-accent)" : isActive ? "#fff" : "#71717a"; // zinc-500
  const dimColor = isActive
    ? "rgba(255,255,255,0.15)"
    : "rgba(113,113,122,0.2)";
  const glowFilter =
    marks >= 3
      ? "drop-shadow(0 0 4px var(--color-game-accent-glow)) drop-shadow(0 0 8px var(--color-game-accent-glow))"
      : "none";

  // Bar positions: 3 vertical bars evenly spaced, with strike-through at 3
  const barX = [5, 12, 19]; // center x for each of the 3 bars

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      className={`select-none transition-all duration-200 ${sizeClass}`}
      style={{ filter: glowFilter }}
    >
      {/* Vertical bars — dim slots for unearned, lit for earned */}
      {barX.map((x, i) => (
        <rect
          key={i}
          x={x - 1.5}
          y={4}
          width={3}
          height={16}
          rx={1.5}
          fill={i < marks ? barColor : dimColor}
          className="transition-all duration-200"
        />
      ))}
      {/* Strike-through line when closed (3 marks) */}
      {marks >= 3 && (
        <line
          x1={2}
          y1={12}
          x2={22}
          y2={12}
          stroke={barColor}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export function CricketScreen({
  options,
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
}: CricketScreenProps) {
  const {
    players,
    currentPlayerIndex,
    currentRound,
    currentRoundDarts,
    winner,
    startGame,
    undoLastDart,
    undoStack,
  } = useCricketStore();

  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [cameraPreviewShown, setCameraPreviewShown] = useState(!!onlineConfig);
  const [confirmedStream, setConfirmedStream] = useState<MediaStream | null>(
    null,
  );

  // Refs for deferred callbacks — populated after hooks that define them
  const dismissOverlaysRef = useRef<(() => void) | undefined>(undefined);
  const colyseusRoomRef = useRef<unknown>(null);

  const { handleNextTurn, isTransitioning, countdown, triggerRemoteDelay } =
    useGameSession({
      gameType: "cricket",
      playerNames,
      playerIds,
      botSkills,
      options,
      createController: () => {
        if (onlineConfig && colyseusRoomRef.current) {
          const localIndex = onlineConfig.isHost ? 0 : 1;
          return guardForOnlineTurn(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            new ColyseusRemoteController(colyseusRoomRef.current as any),
            localIndex,
            () => useCricketStore.getState().currentPlayerIndex,
          );
        }
        return new CricketController();
      },
      extractRound: () => {
        const { currentPlayerIndex, currentRoundDarts } =
          useCricketStore.getState();
        const roundScore = currentRoundDarts.reduce(
          (sum, d) => sum + d.pointsScored,
          0,
        );
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
      getFinalScores: () =>
        useCricketStore.getState().players.map((p) => p.score),
      getSerializableState: () =>
        useCricketStore.getState().getSerializableState(),
      onInit: () => {
        if (restoredState) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          useCricketStore.getState().restoreState(restoredState as any);
        } else {
          startGame(options, playerNames);
        }
        gameEventBus.emit("open_numbers", { numbers: [...CRICKET_TARGETS] });
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
      useCricketStore.getState().restoreState(state as any),
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
        () => useCricketStore.getState().currentPlayerIndex,
      );
      setActiveController(controller);
    }
  }, [room, onlineConfig]);

  const localPlayerIndex = onlineConfig ? (onlineConfig.isHost ? 0 : 1) : 0;
  const { localStream, remoteStream } = useWebRTC({
    room,
    isHost: onlineConfig?.isHost ?? false,
    enabled: confirmedStream !== null,
    preAcquiredStream: confirmedStream,
  });

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

  const [botBoard, setBotBoard] = useState<{
    segment: SegmentID;
    mode: "outline" | "fill";
  } | null>(null);

  const getThrow = useCallback(
    (bot: Bot) => {
      const { players: ps, currentPlayerIndex: ci } =
        useCricketStore.getState();
      return CreateSegment(
        bot.throwCricket(
          ps[ci].marks,
          ps,
          ci,
          (target, actual) => {
            gameLogger.logDart(bot.name, target, actual, {
              players: ps.map((p) => ({
                name: p.name,
                score: p.score,
                marks: p.marks,
              })),
            });
            setBotBoard({ segment: actual, mode: "fill" });
          },
          options.cutThroat,
        ),
      );
    },
    [options.cutThroat],
  );

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

  // Bot dartboard overlay: outline on target, fill on actual hit.
  useEffect(() => {
    if (!isCurrentBot || !!winner || isTransitioning) {
      const t = setTimeout(() => setBotBoard(null), 0);
      return () => clearTimeout(t);
    }
    const dartsThrown = currentRoundDarts.length;
    if (dartsThrown >= 3) return;

    const delay = dartsThrown > 0 ? 800 : 0;
    const t = setTimeout(() => {
      const { players: ps, currentPlayerIndex: ci } =
        useCricketStore.getState();
      const p = ps[ci];
      if (!p) return;
      const target = cricketPickTarget(p.marks, ps, ci, options.cutThroat);
      setBotBoard({ segment: target, mode: "outline" });
    }, delay);
    return () => clearTimeout(t);
  }, [
    isCurrentBot,
    currentPlayerIndex,
    currentRoundDarts.length,
    winner,
    isTransitioning,
    options.cutThroat,
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

  // Cricket has custom award detection (marks animation fallback)
  const [pendingAward, setPendingAward] = useState<AwardType | null>(null);
  const [showMarksAnimation, setShowMarksAnimation] = useState(false);

  useEffect(() => {
    if (currentRoundDarts.length !== 3 || winner) return;
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

  useEffect(() => {
    dismissOverlaysRef.current = () => {
      setPendingAward(null);
      setShowMarksAnimation(false);
    };
  });

  const { rematchState, requestRematch, acceptRematch, declineRematch } =
    useOnlineRematch(onlineConfig);

  useEffect(() => {
    if (rematchState === "accepted") {
      room?.send("rematch", {});
      onRematch();
    }
    if (rematchState === "declined") onExit();
  }, [rematchState, onRematch, onExit, room]);

  const n = players.length;
  const readyToSwitch = currentRoundDarts.length === 3;
  const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
  const nextPlayer = players[nextPlayerIndex];
  const currentPlayer = players[currentPlayerIndex];
  const iconSize = marksIconSize(n);
  const textSizes = playerTextSizes(n);

  // Split players into left and right halves
  const leftPlayers = players.slice(0, Math.ceil(n / 2));
  const rightPlayers = players.slice(Math.ceil(n / 2));
  const leftIndices = Array.from({ length: leftPlayers.length }, (_, i) => i);
  const rightIndices = Array.from(
    { length: rightPlayers.length },
    (_, i) => i + Math.ceil(n / 2),
  );

  const numColWidth = "1fr";

  return (
    <GameShell
      gameClass="game-cricket"
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
          <span
            className="font-normal text-2xl tracking-widest"
            style={{
              fontFamily: "Beon, sans-serif",
              color: "var(--color-game-accent)",
              textShadow:
                "0 0 10px var(--color-game-accent), 0 0 30px var(--color-game-accent-glow)",
            }}
          >
            {options.cutThroat ? "Cut-Throat" : "Cricket"}
          </span>
          <span className="text-zinc-600 text-xs uppercase tracking-widest">
            {options.roundLimit > 0
              ? `Round ${currentRound}/${options.roundLimit}`
              : `Round ${currentRound}`}
            {options.cutThroat ? " · Cut-Throat" : ""}
            {options.singleBull ? " · Split Bull" : ""}
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
          {cameraPreviewShown && (
            <CameraPreview
              onConfirm={(stream) => {
                setConfirmedStream(stream);
                setCameraPreviewShown(false);
              }}
              onSkip={() => setCameraPreviewShown(false)}
            />
          )}
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
                .sort((a, b) =>
                  options.cutThroat ? a.score - b.score : b.score - a.score,
                )
                .map((p, rank) => {
                  const mpr =
                    p.totalDartsThrown === 0
                      ? "0.00"
                      : ((p.totalMarksEarned * 3) / p.totalDartsThrown).toFixed(
                          2,
                        );
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
      <div
        className="flex-1 flex min-h-0 relative"
        style={{ paddingLeft: "var(--sal)" }}
      >
        {/* Camera background — scoped to main content area */}
        {onlineConfig && (localStream || remoteStream) && (
          <CameraBackground
            localStream={localStream}
            remoteStream={remoteStream}
            currentPlayerIndex={currentPlayerIndex}
            localPlayerIndex={localPlayerIndex}
          />
        )}
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
        {/* Marks scoreboard — single grid with explicit rows for alignment */}
        <div
          className="flex-1 min-h-0 min-w-0 grid"
          style={{
            gridTemplateColumns: `repeat(${leftPlayers.length}, minmax(0, 1fr)) ${numColWidth} repeat(${rightPlayers.length}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${CRICKET_TARGETS.length}, minmax(0, 1fr))`,
            maxWidth: `${(n + 1) * 5}rem`,
            margin: "0 auto",
          }}
        >
          {/* Render all cells row by row so grid alignment is guaranteed */}
          {CRICKET_TARGETS.map((target, row) => {
            const allClosed = isNumberClosedByAll(players, target);
            const openForCurrent =
              !allClosed && (currentPlayer?.marks[target] ?? 0) >= 3;
            const rowOpacity = allClosed ? "opacity-40" : "";

            return (
              <div key={target} className="contents">
                {/* Left player marks */}
                {leftIndices.map((pi) => (
                  <div
                    key={`left-${pi}-${target}`}
                    className={`flex justify-center items-center border-r border-solid transition-all duration-200 ${rowOpacity}`}
                    style={{
                      gridRow: row + 1,
                      borderColor:
                        pi === currentPlayerIndex
                          ? "color-mix(in oklch, var(--color-game-accent) 70%, transparent)"
                          : "var(--color-border-subtle)",
                    }}
                  >
                    <MarksIcon
                      marks={players[pi]?.marks[target] ?? 0}
                      isActive={pi === currentPlayerIndex}
                      sizeClass={iconSize}
                    />
                  </div>
                ))}

                {/* Center target label */}
                <div
                  className={`flex justify-center items-center transition-opacity duration-200 ${rowOpacity}`}
                  style={{ gridRow: row + 1 }}
                >
                  <span
                    className="font-normal tabular-nums leading-none whitespace-nowrap text-[clamp(1rem,5vh,3rem)] transition-colors duration-200"
                    style={{
                      fontFamily: "Beon, sans-serif",
                      color:
                        allClosed || openForCurrent
                          ? "var(--color-game-accent)"
                          : "#e4e4e7",
                      textShadow: allClosed
                        ? "0 0 8px var(--color-game-accent-glow)"
                        : openForCurrent
                          ? "0 0 15px var(--color-game-accent), 0 0 40px var(--color-game-accent-glow)"
                          : "0 0 6px rgba(255,255,255,0.15)",
                    }}
                  >
                    {targetLabel(target)}
                  </span>
                </div>

                {/* Right player marks */}
                {rightIndices.map((pi) => (
                  <div
                    key={`right-${pi}-${target}`}
                    className={`flex justify-center items-center border-l border-solid transition-all duration-200 ${rowOpacity}`}
                    style={{
                      gridRow: row + 1,
                      borderColor:
                        pi === currentPlayerIndex
                          ? "color-mix(in oklch, var(--color-game-accent) 70%, transparent)"
                          : "var(--color-border-subtle)",
                    }}
                  >
                    <MarksIcon
                      marks={players[pi]?.marks[target] ?? 0}
                      isActive={pi === currentPlayerIndex}
                      sizeClass={iconSize}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Right: game info + round history — wider when fewer players */}
        <div
          className="flex flex-col shrink-0 border-l border-border-default min-h-0"
          style={{
            width:
              n <= 2
                ? "clamp(14rem,25vw,28rem)"
                : n <= 4
                  ? "clamp(12rem,20vw,24rem)"
                  : "clamp(10rem,16vw,20rem)",
          }}
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
              <span
                className="font-normal text-[clamp(1rem,2vw,2rem)] tracking-widest"
                style={{
                  fontFamily: "Beon, sans-serif",
                  color: "var(--color-game-accent)",
                  textShadow:
                    "0 0 10px var(--color-game-accent), 0 0 30px var(--color-game-accent-glow)",
                }}
              >
                Cricket
              </span>
              <span className="text-zinc-600 text-[clamp(0.5rem,0.8vw,0.7rem)] uppercase tracking-widest">
                {options.roundLimit > 0
                  ? `R${currentRound}/${options.roundLimit}`
                  : `R${currentRound}`}
              </span>
            </div>
            <GameMenu
              onUndo={undoLastDart}
              undoDisabled={!!winner || isCurrentBot || undoStack.length === 0}
              onExit={onExit}
            />
          </div>
          {/* Round history */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-1 gap-1.5 pt-1">
            <HistoryRow
              roundNum={(currentPlayer?.rounds?.length ?? 0) + 1}
              darts={currentRoundDarts.map((d) => ({
                value: d.segment.Value,
                shortName: d.segment.ShortName,
                state:
                  d.pointsScored > 0 || d.marksEarned > 0 ? "scored" : "miss",
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
          {isCurrentBot && !readyToSwitch && (
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
          const mpr =
            player.totalDartsThrown === 0
              ? "0.00"
              : (
                  (player.totalMarksEarned * 3) /
                  player.totalDartsThrown
                ).toFixed(2);
          return (
            <div
              key={i}
              className="player-strip-cell border-r border-border-default last:border-r-0"
              data-active={String(isActive)}
              style={i === 0 ? { paddingLeft: "var(--sal)" } : undefined}
            >
              {botSkills[i] != null && (
                <RobotModel skill={botSkills[i]!} size={32} />
              )}
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
                className={`font-normal tabular-nums leading-tight transition-colors duration-300 ${isActive ? "" : "text-content-muted"}`}
                style={{
                  fontSize: textSizes.score,
                  ...(isActive
                    ? {
                        fontFamily: "Beon, sans-serif",
                        color: "var(--color-game-accent)",
                        textShadow:
                          "0 0 10px var(--color-game-accent), 0 0 30px var(--color-game-accent-glow)",
                      }
                    : {}),
                }}
              >
                {player.score}
              </span>
              <span
                className={`tabular-nums transition-colors duration-300 ${isActive ? "text-content-secondary" : "text-content-faint"}`}
                style={{ fontSize: textSizes.stat }}
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
