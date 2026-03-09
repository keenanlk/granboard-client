import { useCallback, useEffect, useState } from "react";
import { useGameStore, type X01Options } from "../store/useGameStore.ts";
import { useGranboardStore } from "../store/useGranboardStore.ts";
import { SegmentID, SegmentSection, SegmentType } from "../lib/Dartboard.ts";
import { AwardOverlay } from "./AwardOverlay.tsx";
import { detectAward } from "../lib/awards.ts";
import type { AwardType } from "../lib/awards.ts";
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

function stripColsClass(n: number) {
  if (n === 1) return "grid-cols-1";
  if (n === 2) return "grid-cols-2";
  if (n === 3) return "grid-cols-3";
  if (n === 4) return "grid-cols-4";
  if (n <= 6) return "grid-cols-3";
  return "grid-cols-4";
}

export function GameScreen({
  x01Options,
  playerNames,
  onExit,
}: GameScreenProps) {
  const {
    players,
    currentPlayerIndex,
    currentRoundDarts,
    isBust,
    winner,
    startGame,
    nextTurn,
    undoLastDart,
  } = useGameStore();
  const { board } = useGranboardStore();

  useEffect(() => {
    startGame(x01Options, playerNames);
  }, [x01Options, playerNames, startGame]);

  // Wire up Granboard — reset button advances turn, all other hits add a dart
  useEffect(() => {
    if (!board) return;
    board.setSegmentHitCallback((segment) => {
      if (segment.ID === SegmentID.RESET_BUTTON) {
        board?.sendCommand(buildButtonPressCommand(Colors.WHITE, Colors.RED));
        useGameStore.getState().nextTurn();
      } else {
        useGameStore.getState().addDart(segment);

        // Sound + LED feedback based on physical segment hit
        if (segment.Section === SegmentSection.BULL) {
          Sounds.bull();
          board.sendCommand(buildBlinkCommand(Colors.LIGHT_BLUE, 0x0a));
        } else if (segment.Type !== SegmentType.Other) {
          if (segment.Type === SegmentType.Triple) Sounds.triple();
          else Sounds.hit();
          const color =
            segment.Type === SegmentType.Double
              ? Colors.GREEN
              : segment.Type === SegmentType.Triple
                ? Colors.YELLOW
                : Colors.RED;
          board.sendCommand(
            buildHitCommand(segment.Section, segment.Type, color),
          );
        } else {
          Sounds.buzzer();
        }
      }
    });
    return () => {
      board.setSegmentHitCallback(undefined);
    };
  }, [board]);

  const handleNextTurn = useCallback(() => {
    board?.sendCommand(buildButtonPressCommand(Colors.WHITE, Colors.RED));
    nextTurn();
  }, [board, nextTurn]);

  const n = players.length;
  const currentPlayer = players[currentPlayerIndex];
  const roundTotal = currentRoundDarts
    .filter((d) => d.scored)
    .reduce((sum, d) => sum + d.segment.Value, 0);
  const readyToSwitch = currentRoundDarts.length === 3 || isBust;

  const [pendingAward, setPendingAward] = useState<AwardType | null>(null);

  // Show award overlay when the 3rd dart lands
  useEffect(() => {
    if (!readyToSwitch || isBust) return;
    const award = detectAward(currentRoundDarts);
    if (award) setPendingAward(award);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readyToSwitch]);
  const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
  const nextPlayer = players[nextPlayerIndex];
  const needsDouble = x01Options.doubleIn && !currentPlayer?.opened;

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">
      {/* Winner overlay */}
      {winner && (
        <div className="absolute inset-0 z-10 bg-zinc-950/95 flex flex-col items-center justify-center gap-6">
          <p className="text-zinc-500 text-sm uppercase tracking-widest">
            Game Over
          </p>
          <p className="text-8xl font-black text-white">{winner}</p>
          <p className="text-3xl font-black text-green-400 uppercase tracking-widest">
            Wins!
          </p>
          <button
            onClick={onExit}
            className="mt-6 px-12 py-5 rounded-xl bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-black text-xl transition-colors uppercase tracking-widest shadow-[0_0_30px_rgba(34,197,94,0.4)]"
          >
            Back to Menu
          </button>
        </div>
      )}

      {/* Award overlay */}
      {pendingAward && (
        <AwardOverlay
          award={pendingAward}
          onDismiss={() => setPendingAward(null)}
        />
      )}

      {/* Header bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-black border-b-2 border-green-900 shrink-0">
        <button
          onClick={onExit}
          className="text-zinc-500 hover:text-white transition-colors text-sm uppercase tracking-wider w-16"
        >
          ← Exit
        </button>
        <div className="flex flex-col items-center">
          <span className="font-black text-green-400 text-2xl tracking-widest">
            {x01Options.startingScore}
          </span>
          <span className="text-zinc-600 text-xs uppercase tracking-widest">
            {[x01Options.doubleIn && "DI", x01Options.doubleOut && "DO"]
              .filter(Boolean)
              .join(" · ") || "Straight Out"}
          </span>
        </div>
        <button
          onClick={undoLastDart}
          disabled={currentRoundDarts.length === 0 || !!winner}
          className="text-zinc-500 hover:text-red-400 disabled:text-zinc-800 transition-colors text-sm uppercase tracking-wider w-16 text-right disabled:cursor-not-allowed"
        >
          Undo
        </button>
      </header>

      {/* Active player area — takes all available space */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-6 py-4 gap-3">
        {/* Player name + status */}
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_4px_rgba(34,197,94,0.6)]" />
          <span className="text-green-400 font-black uppercase tracking-widest text-lg">
            {currentPlayer?.name}
          </span>
          {(isBust || needsDouble) && (
            <span
              className={`text-sm uppercase tracking-widest font-black ${
                isBust ? "text-red-500" : "text-yellow-400"
              }`}
            >
              · {isBust ? "BUST!" : "Need Double"}
            </span>
          )}
        </div>

        {/* Giant score */}
        <div className="flex-1 flex items-center justify-center">
          <span
            className={`font-black tabular-nums leading-none select-none ${
              isBust
                ? "text-red-500"
                : "text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]"
            } text-[11rem]`}
          >
            {currentPlayer?.score ?? ""}
          </span>
        </div>

        {/* Round delta */}
        {roundTotal > 0 && !isBust && (
          <div className="text-green-400 font-black text-3xl tracking-wider">
            −{roundTotal}
          </div>
        )}
        {isBust && (
          <div className="text-red-400 font-black text-xl uppercase tracking-widest">
            Score unchanged
          </div>
        )}

        {/* Dart slots */}
        <div className="flex gap-3 w-full max-w-xs">
          {[0, 1, 2].map((j) => {
            const thrown = currentRoundDarts[j];
            const isNext = j === currentRoundDarts.length && !readyToSwitch;
            const isBustDart =
              thrown &&
              !thrown.scored &&
              isBust &&
              j === currentRoundDarts.length - 1;
            return (
              <div
                key={j}
                className={`flex-1 h-16 rounded-lg flex flex-col items-center justify-center border-2 transition-all duration-200 ${
                  thrown
                    ? isBustDart
                      ? "border-red-500 bg-red-950/60 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                      : thrown.scored
                        ? "border-green-600 bg-green-950/60 shadow-[0_0_12px_rgba(34,197,94,0.25)]"
                        : "border-zinc-700 bg-zinc-800/50"
                    : isNext
                      ? "border-green-700 border-dashed bg-zinc-900"
                      : "border-zinc-800 bg-zinc-900/50"
                }`}
              >
                {thrown ? (
                  <>
                    <span
                      className={`text-xl font-black leading-tight ${
                        thrown.scored ? "text-white" : "text-zinc-600"
                      }`}
                    >
                      {thrown.segment.Value}
                    </span>
                    <span
                      className={`text-xs font-bold uppercase ${
                        thrown.scored ? "text-green-400" : "text-zinc-700"
                      }`}
                    >
                      {thrown.segment.ShortName}
                    </span>
                  </>
                ) : isNext ? (
                  <span className="text-green-700 text-sm font-black">
                    {j + 1}
                  </span>
                ) : (
                  <span className="text-zinc-700 text-2xl">·</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Player strip */}
      <div
        className={`shrink-0 grid border-t-2 border-zinc-800 bg-black ${stripColsClass(n)}`}
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
              className={`flex flex-col items-center py-3 px-2 border-r border-zinc-800 last:border-r-0 transition-all duration-300 ${
                isActive
                  ? "bg-zinc-900 shadow-[inset_0_2px_0_rgba(34,197,94,0.5)]"
                  : "bg-black"
              }`}
            >
              {/* Avatar circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-base mb-1.5 transition-all duration-300 ${
                  isActive
                    ? "bg-green-600 text-white shadow-[0_0_14px_rgba(34,197,94,0.55)]"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {player.name.charAt(0).toUpperCase()}
              </div>
              <span
                className={`text-xs font-black uppercase tracking-wide truncate max-w-full transition-colors duration-300 ${
                  isActive ? "text-green-400" : "text-zinc-600"
                }`}
              >
                {player.name}
              </span>
              <span
                className={`font-black tabular-nums leading-tight transition-colors duration-300 ${
                  isActive ? "text-white text-2xl" : "text-zinc-500 text-xl"
                }`}
              >
                {player.score}
              </span>
              <span
                className={`text-xs tabular-nums transition-colors duration-300 ${
                  isActive ? "text-zinc-400" : "text-zinc-700"
                }`}
              >
                {ppd} ppd
              </span>
            </div>
          );
        })}
      </div>

      {/* Action bar */}
      <div
        className={`shrink-0 px-4 py-3 border-t-2 transition-all duration-300 ${
          readyToSwitch
            ? "border-green-800 bg-green-950/25"
            : "border-zinc-800 bg-black"
        }`}
      >
        {readyToSwitch && (
          <p className="text-center text-green-400 text-xs uppercase tracking-widest mb-2 font-black">
            {isBust
              ? `Bust — ${currentPlayer?.name}'s score reset`
              : nextPlayer
                ? `${nextPlayer.name}'s turn`
                : "3 darts thrown"}
          </p>
        )}
        <button
          onClick={handleNextTurn}
          disabled={!!winner}
          className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest transition-all duration-200 ${
            readyToSwitch
              ? "bg-green-600 hover:bg-green-500 active:bg-green-700 text-white shadow-[0_0_24px_rgba(34,197,94,0.35)]"
              : "bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-500 hover:text-white"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {readyToSwitch && nextPlayer ? `${nextPlayer.name} →` : "Next Player"}
        </button>
      </div>
    </div>
  );
}
