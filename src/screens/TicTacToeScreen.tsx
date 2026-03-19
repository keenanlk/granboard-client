import { useCallback, useEffect, useMemo, useState } from "react";
import { useTicTacToeStore } from "../store/useTicTacToeStore.ts";
import type { TicTacToeOptions } from "../engine/ticTacToe.types.ts";
import { TicTacToeController } from "../controllers/TicTacToeController.ts";
import { useGameSession } from "../hooks/useGameSession.ts";
import { useBotTurn } from "../hooks/useBotTurn.ts";
import { GameShell } from "../components/GameShell.tsx";
import { Bot } from "../bot/Bot.ts";
import type { BotSkill } from "../bot/Bot.ts";
import { getBotCharacter } from "../bot/botCharacters.ts";
import { CreateSegment } from "../board/Dartboard.ts";
import type { SegmentID } from "../board/Dartboard.ts";
import { ticTacToePickTarget } from "../bot/ticTacToeStrategy.ts";
import { DartboardSVG } from "../components/DartboardSVG.tsx";
import { gameLogger } from "../lib/GameLogger.ts";
import { GameMenu } from "../components/GameMenu.tsx";
import { ResultsOverlay } from "../components/ResultsOverlay.tsx";
import { HistoryRow } from "../components/HistoryRow.tsx";
import { BotThinkingIndicator } from "../components/BotThinkingIndicator.tsx";
import { gameEventBus } from "../events/gameEventBus.ts";
import { playerTextSizes } from "../lib/playerTextSizes.ts";

interface TicTacToeScreenProps {
  options: TicTacToeOptions;
  playerNames: string[];
  playerIds: (string | null)[];
  botSkills: (BotSkill | null)[];
  restoredState?: unknown;
  onExit: () => void;
  onRematch: () => void;
}

// Tic-tac-toe win lines for highlight
const WIN_LINES: readonly [number, number, number][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function getWinningLine(owner: (0 | 1 | null)[]): number[] | null {
  for (const [a, b, c] of WIN_LINES) {
    if (owner[a] !== null && owner[a] === owner[b] && owner[b] === owner[c]) {
      return [a, b, c];
    }
  }
  return null;
}

export function TicTacToeScreen({
  options,
  playerNames,
  playerIds,
  botSkills,
  restoredState,
  onExit,
  onRematch,
}: TicTacToeScreenProps) {
  const {
    players,
    grid,
    owner,
    currentPlayerIndex,
    currentRound,
    currentRoundDarts,
    winner,
    isCatsGame,
    startGame,
    undoLastDart,
    undoStack,
  } = useTicTacToeStore();

  const gameOver = !!winner || isCatsGame;
  const winnerNames = winner ? [winner] : isCatsGame ? [] : null;

  const { handleNextTurn, isTransitioning, countdown } = useGameSession({
    gameType: "tictactoe",
    playerNames,
    playerIds,
    botSkills,
    options,
    createController: () => new TicTacToeController(),
    extractRound: () => {
      const { currentPlayerIndex, currentRoundDarts } =
        useTicTacToeStore.getState();
      const marksTotal = currentRoundDarts.reduce(
        (sum, d) => sum + d.marksAdded,
        0,
      );
      return {
        playerIndex: currentPlayerIndex,
        darts: currentRoundDarts.map((d) => ({
          value: d.segment.Value,
          shortName: d.segment.ShortName,
          marksEarned: d.marksAdded,
        })),
        roundScore: marksTotal,
      };
    },
    winner: winnerNames,
    getFinalScores: () =>
      useTicTacToeStore.getState().players.map((p) => p.claimed.length),
    getSerializableState: () =>
      useTicTacToeStore.getState().getSerializableState(),
    onInit: () => {
      if (restoredState) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useTicTacToeStore.getState().restoreState(restoredState as any);
      } else {
        startGame(options, playerNames);
      }
      // Emit open numbers for LED
      const s = useTicTacToeStore.getState();
      const numbers = s.grid.filter(
        (num, i) => s.owner[i] === null && num >= 1 && num <= 20,
      );
      gameEventBus.emit("open_numbers", { numbers });
    },
  });

  const n = players.length;
  const textSizes = playerTextSizes(n);
  const currentPlayer = players[currentPlayerIndex];
  const readyToSwitch = currentRoundDarts.length === 3;
  const nextPlayerIndex = (currentPlayerIndex + 1) % n;
  const nextPlayer = players[nextPlayerIndex];
  const winningLine = gameOver ? getWinningLine(owner) : null;

  // Bot setup
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
    const s = useTicTacToeStore.getState();
    const myIdx = s.currentPlayerIndex;
    const oppIdx = myIdx === 0 ? 1 : 0;
    return CreateSegment(
      bot.throwTicTacToe(
        s.grid,
        s.owner,
        myIdx,
        s.players[myIdx].marks,
        s.players[oppIdx].marks,
        (target, actual) => {
          gameLogger.logDart(bot.name, target, actual, {});
          setBotBoard({ segment: actual, mode: "fill" });
        },
      ),
    );
  }, []);

  useBotTurn({
    bots,
    currentPlayerIndex,
    dartsThrown: currentRoundDarts.length,
    isBust: false,
    hasWinner: gameOver,
    isTransitioning,
    onNextTurn: handleNextTurn,
    getThrow,
  });

  // Bot dartboard overlay: outline on target, fill on actual hit.
  useEffect(() => {
    if (!isCurrentBot || gameOver || isTransitioning) {
      const t = setTimeout(() => setBotBoard(null), 0);
      return () => clearTimeout(t);
    }
    const dartsThrown = currentRoundDarts.length;
    if (dartsThrown >= 3) return;

    const delay = dartsThrown > 0 ? 800 : 0;
    const t = setTimeout(() => {
      const s = useTicTacToeStore.getState();
      const myIdx = s.currentPlayerIndex;
      const oppIdx = myIdx === 0 ? 1 : 0;
      const target = ticTacToePickTarget(
        s.grid,
        s.owner,
        myIdx,
        s.players[myIdx].marks,
        s.players[oppIdx].marks,
      );
      setBotBoard({ segment: target, mode: "outline" });
    }, delay);
    return () => clearTimeout(t);
  }, [
    isCurrentBot,
    currentPlayerIndex,
    currentRoundDarts.length,
    gameOver,
    isTransitioning,
  ]);

  // Auto-advance on cats game when all darts thrown
  useEffect(() => {
    if (!readyToSwitch || gameOver || isTransitioning) return;
    // Check if nextTurn would trigger cats/round-limit
    // Normal flow — let the player press next turn
  }, [readyToSwitch, gameOver, isTransitioning]);

  // Player symbols
  const symbols = ["X", "O"];

  return (
    <GameShell
      gameClass="game-tictactoe"
      title={
        <>
          <span className="font-black text-[var(--color-game-accent)] text-2xl tracking-widest">
            Tic Tac Toe
          </span>
          <span className="text-zinc-500 text-xs uppercase tracking-widest">
            Round {currentRound}
            {options.roundLimit > 0 ? ` of ${options.roundLimit}` : ""}
          </span>
        </>
      }
      onExit={onExit}
      onUndo={undoLastDart}
      undoDisabled={gameOver || isCurrentBot || undoStack.length === 0}
      isTransitioning={isTransitioning}
      countdown={countdown}
      nextPlayerName={n > 1 ? nextPlayer?.name : undefined}
      onNextTurn={handleNextTurn}
      showNextTurn={readyToSwitch}
      hasWinner={gameOver}
      overlays={
        <>
          {gameOver && (
            <ResultsOverlay
              onExit={onExit}
              onRematch={onRematch}
              playerResults={players.map((p, i) => ({
                name: p.name,
                isWinner: winner === p.name,
                rank: winner === p.name ? 1 : winner ? 2 : 0,
                stats: [
                  {
                    label: "symbol",
                    value: symbols[i],
                  },
                  {
                    label: "claimed",
                    value: String(p.claimed.length),
                  },
                ],
              }))}
            />
          )}
        </>
      }
    >
      {/* Mobile header — visible below md */}
      <div
        className="flex md:hidden items-center justify-between px-3 py-1.5 border-b border-border-default shrink-0"
        style={{ paddingTop: "calc(var(--sat) + 0.25rem)" }}
      >
        <div className="flex flex-col">
          <span className="font-black text-[var(--color-game-accent)] text-sm tracking-widest">
            Tic Tac Toe
          </span>
          <span className="text-zinc-600 text-[0.6rem] uppercase tracking-widest">
            Round {currentRound}
            {options.roundLimit > 0 ? ` of ${options.roundLimit}` : ""}
          </span>
        </div>
        <GameMenu
          onUndo={undoLastDart}
          undoDisabled={gameOver || isCurrentBot || undoStack.length === 0}
          onExit={onExit}
        />
      </div>

      {/* Main area — grid + sidebar */}
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
        {/* Left: TTT grid */}
        <div className="flex-1 relative flex items-center justify-center min-w-0 min-h-0 p-1">
          {/* Active player indicator — top left overlay */}
          <div
            className="absolute top-0 left-0 flex items-center gap-2 z-10"
            style={{
              padding: "clamp(0.25rem, 0.5vh, 0.5rem) clamp(0.5rem, 1vw, 1rem)",
            }}
          >
            <span className="glow-dot" />
            <span
              className={`font-black uppercase tracking-widest ${isCurrentBot ? getBotCharacter(botSkills[currentPlayerIndex]!).animationClass : ""}`}
              style={{
                fontSize: "clamp(0.85rem, min(1.8vw, 2.5vh), 1.75rem)",
                ...(isCurrentBot
                  ? {
                      fontFamily: "Beon, sans-serif",
                      color: getBotCharacter(botSkills[currentPlayerIndex]!)
                        .color,
                      textShadow: `0 0 12px ${getBotCharacter(botSkills[currentPlayerIndex]!).glow}`,
                    }
                  : { color: "var(--color-game-accent)" }),
              }}
            >
              {currentPlayer?.name}{" "}
              <span
                className="opacity-60"
                style={{
                  fontSize: "clamp(0.6rem, min(1.2vw, 1.8vh), 1.25rem)",
                }}
              >
                ({symbols[currentPlayerIndex]})
              </span>
            </span>
          </div>

          {/* 3x3 Grid */}
          <div
            className="grid grid-cols-3 grid-rows-3 gap-[clamp(4px,0.5vh,8px)]"
            style={{
              width: "min(100vh, 650px)",
              height: "min(75vh, 500px)",
              maxWidth: "100%",
            }}
          >
            {grid.map((num, idx) => {
              const cellOwner = owner[idx];
              const isWinCell = winningLine?.includes(idx) ?? false;
              const p0Marks = players[0]?.marks[idx] ?? 0;
              const p1Marks = players[1]?.marks[idx] ?? 0;
              const label = num === 25 ? "BULL" : String(num);

              return (
                <div
                  key={idx}
                  data-testid={`cell-${idx}`}
                  className={`relative rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${
                    isWinCell
                      ? "border-[var(--color-game-accent)] bg-[var(--color-game-accent-dim)]"
                      : cellOwner === 0
                        ? "border-red-500/60 bg-red-950/40 animate-[pulse-red_2s_ease-in-out_infinite]"
                        : cellOwner === 1
                          ? "border-blue-500/60 bg-blue-950/40 animate-[pulse-blue_2s_ease-in-out_infinite]"
                          : "border-zinc-700 bg-zinc-900"
                  }`}
                  style={{
                    boxShadow: isWinCell
                      ? "0 0 20px var(--color-game-accent-glow)"
                      : undefined,
                  }}
                >
                  {/* Number label — hidden once claimed */}
                  {cellOwner === null && (
                    <>
                      <span
                        className="font-black leading-none text-white"
                        style={{
                          fontSize: "clamp(2rem, min(7vw, 11vh), 5rem)",
                        }}
                      >
                        {label}
                      </span>
                      {/* X marks — top edge */}
                      <div
                        className="absolute top-0 left-0 h-[clamp(6px,1vh,10px)] rounded-br transition-all duration-300"
                        style={{
                          width: `${(p0Marks / 4) * 100}%`,
                          backgroundColor: "#ef4444",
                          boxShadow:
                            p0Marks > 0
                              ? "0 0 8px rgba(239,68,68,0.7), 0 0 16px rgba(239,68,68,0.3)"
                              : "none",
                        }}
                      />
                      {/* O marks — bottom edge */}
                      <div
                        className="absolute bottom-0 left-0 h-[clamp(6px,1vh,10px)] rounded-tr transition-all duration-300"
                        style={{
                          width: `${(p1Marks / 4) * 100}%`,
                          backgroundColor: "#3b82f6",
                          boxShadow:
                            p1Marks > 0
                              ? "0 0 8px rgba(59,130,246,0.7), 0 0 16px rgba(59,130,246,0.3)"
                              : "none",
                        }}
                      />
                    </>
                  )}

                  {/* Claimed symbol (X or O) */}
                  {cellOwner !== null && (
                    <span
                      className="font-black leading-none"
                      style={{
                        fontSize: "clamp(2rem, min(10vw, 12vh), 9rem)",
                        fontFamily: "Beon, sans-serif",
                        color: cellOwner === 0 ? "#ef4444" : "#3b82f6",
                        textShadow:
                          cellOwner === 0
                            ? "0 0 15px #ef4444, 0 0 40px rgba(239,68,68,0.4)"
                            : "0 0 15px #3b82f6, 0 0 40px rgba(59,130,246,0.4)",
                      }}
                    >
                      {symbols[cellOwner]}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile current round — visible below md */}
          <div
            className="flex md:hidden shrink-0 mt-1"
            style={{ width: "min(100vh, 650px)", maxWidth: "100%" }}
          >
            <HistoryRow
              roundNum={(currentPlayer?.rounds?.length ?? 0) + 1}
              darts={currentRoundDarts.map((d) => ({
                value: d.segment.Value,
                shortName: d.segment.ShortName,
                state: d.marksAdded > 0 ? "scored" : "miss",
              }))}
              totalDarts={currentRoundDarts.length}
              readyToSwitch={readyToSwitch}
              isCurrent={true}
            />
          </div>

          {/* Mobile bot thinking indicator */}
          {isCurrentBot && (
            <div className="md:hidden">
              <BotThinkingIndicator skill={botSkills[currentPlayerIndex]!} />
            </div>
          )}
        </div>

        {/* Right sidebar: game info + dart history — hidden on mobile */}
        <div
          className="hidden md:flex flex-col shrink-0 border-l border-border-default min-h-0"
          style={{ width: "clamp(12rem, 16vw, 22rem)" }}
        >
          {/* Game title + menu */}
          <div
            className="shrink-0 px-2 py-2 flex items-center border-b border-border-default"
            style={{ paddingTop: "calc(var(--sat) + 0.5rem)" }}
          >
            <div className="flex-1 flex flex-col items-center">
              <span className="font-black text-[var(--color-game-accent)] text-[clamp(0.8rem,1.3vw,1.25rem)] tracking-widest">
                Tic Tac Toe
              </span>
              <span className="text-zinc-600 text-[clamp(0.5rem,0.8vw,0.7rem)] uppercase tracking-widest">
                Round {currentRound}
                {options.roundLimit > 0 ? ` of ${options.roundLimit}` : ""}
              </span>
            </div>
            <GameMenu
              onUndo={undoLastDart}
              undoDisabled={gameOver || isCurrentBot || undoStack.length === 0}
              onExit={onExit}
            />
          </div>

          {/* Current round darts */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-1 gap-1.5 pt-1">
            <HistoryRow
              roundNum={(currentPlayer?.rounds?.length ?? 0) + 1}
              darts={currentRoundDarts.map((d) => ({
                value: d.segment.Value,
                shortName: d.segment.ShortName,
                state: d.marksAdded > 0 ? "scored" : "miss",
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
                    state: d.marksAdded > 0 ? "scored" : "miss",
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
          return (
            <div
              key={i}
              className="player-strip-cell border-r border-border-default last:border-r-0 !flex-row !items-center !gap-3"
              data-active={String(isActive)}
              style={{
                padding: "clamp(0.5rem, 2.5vh, 1.5rem) 0.5rem",
                paddingBottom:
                  "calc(var(--sab) + clamp(0.5rem, 2.5vh, 1.5rem))",
                ...(i === 0 ? { paddingLeft: "var(--sal)" } : {}),
              }}
            >
              {/* Name + claimed stacked */}
              <div className="flex flex-col items-center">
                <span
                  className={`font-black uppercase tracking-widest truncate max-w-full transition-colors duration-300 ${botSkills[i] != null ? getBotCharacter(botSkills[i]!).animationClass : isActive ? "text-[var(--color-game-accent)]" : "text-content-faint"}`}
                  style={{
                    fontSize: `clamp(1rem, min(3.5vw, 4vh), 2.5rem)`,
                    letterSpacing: "0.15em",
                    ...(botSkills[i] != null
                      ? {
                          fontFamily: "Beon, sans-serif",
                          color: getBotCharacter(botSkills[i]!).color,
                          textShadow: isActive
                            ? `0 0 8px ${getBotCharacter(botSkills[i]!).glow}`
                            : "none",
                        }
                      : isActive
                        ? {
                            textShadow: "0 0 8px var(--color-game-accent-glow)",
                          }
                        : {}),
                  }}
                >
                  {player.name}
                </span>
                <span
                  className={`tabular-nums transition-colors duration-300 ${isActive ? "text-content-secondary" : "text-content-faint"}`}
                  style={{ fontSize: textSizes.stat }}
                >
                  {player.claimed.length} claimed
                </span>
              </div>
              {/* Symbol to the right */}
              <span
                className="font-black leading-none transition-colors duration-300"
                style={{
                  fontSize: textSizes.score,
                  fontFamily: "Beon, sans-serif",
                  color: i === 0 ? "#ef4444" : "#3b82f6",
                  textShadow: isActive
                    ? i === 0
                      ? "0 0 10px #ef4444, 0 0 30px rgba(239,68,68,0.3)"
                      : "0 0 10px #3b82f6, 0 0 30px rgba(59,130,246,0.3)"
                    : "none",
                  opacity: isActive ? 1 : 0.5,
                }}
              >
                {symbols[i]}
              </span>
            </div>
          );
        })}
      </div>
    </GameShell>
  );
}
