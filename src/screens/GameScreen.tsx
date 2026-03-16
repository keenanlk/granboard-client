import { useCallback, useMemo } from "react";
import { useGameStore, type X01Options } from "../store/useGameStore.ts";
import { AwardOverlay } from "../components/AwardOverlay.tsx";
import { ResultsOverlay } from "../components/ResultsOverlay.tsx";
import { detectAward } from "../lib/awards.ts";
import { X01Controller } from "../controllers/X01Controller.ts";
import { useGameSession } from "../hooks/useGameSession.ts";
import { useBotTurn } from "../hooks/useBotTurn.ts";
import { useAwardDetection } from "../hooks/useAwardDetection.ts";
import { GameShell } from "../components/GameShell.tsx";
import { Bot } from "../bot/Bot.ts";
import type { BotSkill } from "../bot/Bot.ts";
import { getBotCharacter } from "../bot/botCharacters.ts";
import { CreateSegment } from "../board/Dartboard.ts";
import { gameLogger } from "../lib/GameLogger.ts";
import { GameMenu } from "../components/GameMenu.tsx";
import { HistoryRow } from "../components/HistoryRow.tsx";
import { BotThinkingIndicator } from "../components/BotThinkingIndicator.tsx";
import { playerTextSizes } from "../lib/playerTextSizes.ts";
import type { SetProgress, SetConfig, LegResult } from "../lib/setTypes.ts";

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
}

export function GameScreen({ x01Options, playerNames, playerIds, botSkills, restoredState, onExit, onRematch, setProgress, onNextLeg, setConfig, legResults, currentLegIndex }: GameScreenProps) {
  const { players, currentPlayerIndex, currentRoundDarts, isBust, winner, undoStack, startGame, undoLastDart } =
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
    getSerializableState: () => useGameStore.getState().getSerializableState(),
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

  const [pendingAward, dismissAward] = useAwardDetection(
    readyToSwitch && !isBust && !winner,
    () => detectAward(currentRoundDarts),
  );

  return (
    <GameShell
      gameClass="game-x01"
      title={
        <>
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
            ].filter(Boolean).join(" \u00B7 ") || "Straight Out"}
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
          {winner && !pendingAward && (
            <ResultsOverlay
              onExit={onExit}
              onRematch={setProgress ? undefined : onRematch}
              setProgress={setProgress}
              onNextLeg={onNextLeg}
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
            <AwardOverlay award={pendingAward} onDismiss={dismissAward} />
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
            <span
              className={`font-black uppercase tracking-widest text-[clamp(1rem,2vw,2.5rem)] ${isCurrentBot ? getBotCharacter(botSkills[currentPlayerIndex]!).animationClass : ""}`}
              style={isCurrentBot
                ? { fontFamily: "Beon, sans-serif", color: getBotCharacter(botSkills[currentPlayerIndex]!).color, textShadow: `0 0 12px ${getBotCharacter(botSkills[currentPlayerIndex]!).glow}` }
                : { color: "var(--color-game-accent)" }
              }
            >
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
              className={`font-normal tabular-nums leading-none select-none text-[clamp(7rem,20vw,45rem)] ${
                isBust ? "text-state-bust" : ""
              }`}
              style={{ fontFamily: "Beon, sans-serif", ...(!isBust ? { color: "var(--color-game-accent)", textShadow: "0 0 20px var(--color-game-accent), 0 0 60px var(--color-game-accent), 0 0 100px var(--color-game-accent-glow), 0 0 150px var(--color-game-accent-glow)" } : {}) }}
            >
              {currentPlayer?.score ?? ""}
            </span>
          </div>

        </div>

        {/* Right: game info + history grid */}
        <div className="flex flex-col shrink-0 border-l border-border-default min-h-0" style={{ width: "clamp(12rem, 16vw, 22rem)" }}>
          {/* Game title + menu */}
          <div className="shrink-0 px-2 py-2 flex items-center border-b border-border-default" style={{ paddingTop: "calc(var(--sat) + 0.5rem)" }}>
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
                ].filter(Boolean).join(" · ") || "Straight"}
              </span>
            </div>
            <GameMenu onUndo={undoLastDart} undoDisabled={!!winner || isCurrentBot || undoStack.length === 0} onExit={onExit} />
          </div>


          {/* Rows: current round (live) + completed rounds newest-first */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-1 gap-1.5 pt-1">
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

          {/* Bot thinking indicator */}
          {isCurrentBot && <BotThinkingIndicator skill={botSkills[currentPlayerIndex]!} />}
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
              <span
                style={{
                  fontSize: textSizes.name,
                  ...(botSkills[i] != null ? { fontFamily: "Beon, sans-serif", color: getBotCharacter(botSkills[i]!).color, textShadow: isActive ? `0 0 8px ${getBotCharacter(botSkills[i]!).glow}` : "none" } : {}),
                }}
                className={`font-black uppercase tracking-wide truncate max-w-full transition-colors duration-300 ${botSkills[i] != null ? getBotCharacter(botSkills[i]!).animationClass : isActive ? "text-[var(--color-game-accent)]" : "text-content-faint"}`}
              >
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
