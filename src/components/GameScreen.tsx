import { useCallback, useEffect } from "react";
import { useGameStore, type X01Options } from "../store/useGameStore.ts";
import { useGranboardStore } from "../store/useGranboardStore.ts";
import { SegmentID, SegmentSection, SegmentType } from "../lib/Dartboard.ts";
import {
  buildBlinkCommand,
  buildButtonPressCommand,
  buildHitCommand,
  Colors,
} from "../lib/GranboardLED.ts";
import { Sounds } from "../lib/sounds.ts";

interface GameScreenProps {
  x01Options: X01Options;
  playerNames: string[];
  onExit: () => void;
}

export function GameScreen({ x01Options, playerNames, onExit }: GameScreenProps) {
  const { players, currentPlayerIndex, currentRoundDarts, startGame, nextTurn, undoLastDart } =
    useGameStore();
  const { board } = useGranboardStore();

  useEffect(() => {
    startGame(x01Options, playerNames);
  }, [x01Options, playerNames, startGame]);

  // Wire up Granboard — reset button advances turn, all other hits add a dart
  useEffect(() => {
    if (!board) return;
    board.segmentHitCallback = (segment) => {
      if (segment.ID === SegmentID.RESET_BUTTON) {
        board?.sendCommand(buildButtonPressCommand(Colors.WHITE, Colors.RED));
        useGameStore.getState().nextTurn();
      } else {
        useGameStore.getState().addDart(segment);

        // Sound + LED for the segment that was hit
        if (segment.Section === SegmentSection.BULL) {
          Sounds.bull();
          board.sendCommand(buildBlinkCommand(Colors.LIGHT_BLUE, 0x0a));
        } else if (segment.Type !== SegmentType.Other) {
          Sounds.hit();
          const color =
            segment.Type === SegmentType.Double ? Colors.GREEN
            : segment.Type === SegmentType.Triple ? Colors.YELLOW
            : Colors.RED;
          board.sendCommand(buildHitCommand(segment.Section, segment.Type, color));
        }
      }
    };
    return () => {
      board.segmentHitCallback = undefined;
    };
  }, [board]);

  const handleNextTurn = useCallback(() => {
    board?.sendCommand(buildButtonPressCommand(Colors.WHITE, Colors.RED));
    nextTurn();
  }, [board, nextTurn]);

  const roundTotal = currentRoundDarts.reduce((sum, d) => sum + d.Value, 0);
  const readyToSwitch = currentRoundDarts.length === 3;
  const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
  const nextPlayer = players[nextPlayerIndex];

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <button
          onClick={onExit}
          className="text-zinc-500 hover:text-white transition-colors text-sm w-12"
        >
          ← Exit
        </button>
        <div className="flex items-center gap-1.5">
          <span className="font-black text-white">NLC</span>
          <span className="font-black text-red-500">Darts</span>
          <span className="text-zinc-600 text-sm ml-1">· {x01Options.startingScore}</span>
        </div>
        <button
          onClick={undoLastDart}
          disabled={currentRoundDarts.length === 0}
          className="text-zinc-500 hover:text-red-400 disabled:text-zinc-800 transition-colors text-sm w-12 text-right disabled:cursor-not-allowed"
        >
          Undo
        </button>
      </header>

      {/* Scoreboard */}
      <div className="flex flex-1 min-h-0">
        {players.map((player, i) => {
          const isActive = i === currentPlayerIndex;
          return (
            <div
              key={i}
              className={`flex-1 flex flex-col p-5 transition-all duration-300 border-r border-zinc-800 last:border-r-0 ${
                isActive ? "bg-zinc-900" : "bg-zinc-950"
              }`}
            >
              {/* Player name + status */}
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 transition-all duration-300 ${
                    isActive
                      ? "bg-red-500 shadow-[0_0_6px_2px_rgba(239,68,68,0.5)]"
                      : "bg-zinc-700"
                  }`}
                />
                <span
                  className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${
                    isActive ? "text-red-400" : "text-zinc-600"
                  }`}
                >
                  {player.name}
                </span>
              </div>

              {isActive && (
                <span className="text-xs text-zinc-600 uppercase tracking-widest ml-4 mb-2">
                  Throwing
                </span>
              )}

              {/* Score */}
              <div className="flex-1 flex items-center justify-center">
                <span
                  className={`font-black tabular-nums transition-all duration-300 ${
                    isActive ? "text-7xl text-white" : "text-5xl text-zinc-600"
                  }`}
                >
                  {player.score}
                </span>
              </div>

              {/* Round total */}
              {isActive && roundTotal > 0 && (
                <div className="text-center text-red-400 font-semibold text-sm mb-2">
                  −{roundTotal}
                </div>
              )}

              {/* Dart slots — only in active player column */}
              {isActive && (
                <div className="flex gap-2 mt-2">
                  {[0, 1, 2].map((j) => {
                    const dart = currentRoundDarts[j];
                    const isNext = j === currentRoundDarts.length && !readyToSwitch;
                    return (
                      <div
                        key={j}
                        className={`flex-1 h-14 rounded-lg flex flex-col items-center justify-center border transition-all duration-200 ${
                          dart
                            ? "border-red-600 bg-red-950/50"
                            : isNext
                              ? "border-zinc-600 border-dashed bg-zinc-800/50"
                              : "border-zinc-800 bg-transparent"
                        }`}
                      >
                        {dart ? (
                          <>
                            <span className="text-lg font-bold leading-tight">{dart.Value}</span>
                            <span className="text-xs text-zinc-400">{dart.ShortName}</span>
                          </>
                        ) : isNext ? (
                          <span className="text-zinc-600 text-xs">{j + 1}</span>
                        ) : (
                          <span className="text-zinc-800 text-lg">·</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Switch player prompt */}
      <div
        className={`shrink-0 px-4 py-4 border-t transition-all duration-300 ${
          readyToSwitch ? "border-red-900 bg-red-950/30" : "border-zinc-800 bg-zinc-900"
        }`}
      >
        {readyToSwitch && nextPlayer && (
          <p className="text-center text-red-400 text-xs uppercase tracking-widest mb-3 font-semibold">
            3 darts thrown — {nextPlayer.name}'s turn
          </p>
        )}
        <button
          onClick={handleNextTurn}
          className={`w-full py-3.5 rounded-xl font-bold text-base transition-all duration-200 ${
            readyToSwitch
              ? "bg-red-600 hover:bg-red-500 active:bg-red-700 text-white"
              : "bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-400 hover:text-white"
          }`}
        >
          {readyToSwitch && nextPlayer
            ? `Switch to ${nextPlayer.name} →`
            : "Next Player"}
        </button>
      </div>
    </div>
  );
}
