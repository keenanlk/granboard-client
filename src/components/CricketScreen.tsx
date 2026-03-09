import { useCallback, useEffect, useState } from "react";
import {
  useCricketStore,
  CRICKET_TARGETS,
  type CricketOptions,
  type CricketTarget,
} from "../store/useCricketStore.ts";
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

interface CricketScreenProps {
  options: CricketOptions;
  playerNames: string[];
  onExit: () => void;
}

function targetLabel(t: CricketTarget) {
  return t === 25 ? "BULL" : String(t);
}

function isNumberClosedByAll(
  players: ReturnType<typeof useCricketStore.getState>["players"],
  target: CricketTarget,
) {
  return players.every((p) => p.marks[target] >= 3);
}

/** Traditional cricket mark notation: — / X O */
function MarksIcon({ marks, isActive }: { marks: number; isActive: boolean }) {
  const icon = marks === 0 ? "—" : marks === 1 ? "/" : marks === 2 ? "X" : "O";
  const color =
    marks >= 3
      ? "text-green-400 drop-shadow-[0_0_6px_rgba(34,197,94,0.7)]"
      : isActive
        ? "text-white"
        : "text-zinc-500";
  return (
    <span
      className={`text-3xl font-black leading-none select-none transition-colors duration-200 ${color}`}
    >
      {icon}
    </span>
  );
}

function stripColsClass(n: number) {
  if (n === 1) return "grid-cols-1";
  if (n === 2) return "grid-cols-2";
  if (n === 3) return "grid-cols-3";
  if (n === 4) return "grid-cols-4";
  if (n <= 6) return "grid-cols-3";
  return "grid-cols-4";
}

export function CricketScreen({
  options,
  playerNames,
  onExit,
}: CricketScreenProps) {
  const {
    players,
    currentPlayerIndex,
    currentRoundDarts,
    winner,
    startGame,
    nextTurn,
    undoLastDart,
  } = useCricketStore();
  const { board } = useGranboardStore();

  useEffect(() => {
    startGame(options, playerNames);
  }, [options, playerNames, startGame]);

  const [pendingAward, setPendingAward] = useState<AwardType | null>(null);

  useEffect(() => {
    if (!board) return;
    board.setSegmentHitCallback((segment) => {
      if (segment.ID === SegmentID.RESET_BUTTON) {
        board?.sendCommand(buildButtonPressCommand(Colors.WHITE, Colors.RED));
        useCricketStore.getState().nextTurn();
      } else {
        useCricketStore.getState().addDart(segment);

        // Detect award after 3rd dart
        const { currentRoundDarts: darts } = useCricketStore.getState();
        if (darts.length === 3) {
          const award = detectAward(darts);
          if (award) setPendingAward(award);
        }

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
  }, [board, setPendingAward]);

  const handleNextTurn = useCallback(() => {
    board?.sendCommand(buildButtonPressCommand(Colors.WHITE, Colors.RED));
    nextTurn();
  }, [board, nextTurn]);

  const n = players.length;
  const readyToSwitch = currentRoundDarts.length === 3;
  const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
  const nextPlayer = players[nextPlayerIndex];
  const currentPlayer = players[currentPlayerIndex];
  const isTwoPlayer = n === 2;

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

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-black border-b-2 border-green-900 shrink-0">
        <button
          onClick={onExit}
          className="text-zinc-500 hover:text-white transition-colors text-sm uppercase tracking-wider w-16"
        >
          ← Exit
        </button>
        <div className="flex flex-col items-center">
          <span className="font-black text-green-400 text-2xl tracking-widest">
            Cricket
          </span>
          {options.singleBull && (
            <span className="text-zinc-600 text-xs uppercase tracking-widest">
              Single Bull
            </span>
          )}
        </div>
        <button
          onClick={undoLastDart}
          disabled={currentRoundDarts.length === 0 || !!winner}
          className="text-zinc-500 hover:text-red-400 disabled:text-zinc-800 transition-colors text-sm uppercase tracking-wider w-16 text-right disabled:cursor-not-allowed"
        >
          Undo
        </button>
      </header>

      {/* Main scoreboard area */}
      <div className="flex-1 min-h-0 flex flex-col px-4 py-3 gap-2 overflow-hidden">
        {isTwoPlayer ? (
          /* ── 2-player: Granboard mirror layout ── */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Player name row */}
            <div className="grid grid-cols-3 mb-1 shrink-0">
              {[0, 1].map((pi) => {
                const p = players[pi];
                const isActive = pi === currentPlayerIndex;
                return (
                  <div
                    key={pi}
                    className={`flex flex-col items-center ${pi === 1 ? "col-start-3" : ""}`}
                  >
                    <div className="flex items-center gap-1.5">
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_2px_rgba(34,197,94,0.6)]" />
                      )}
                      <span
                        className={`text-xs font-black uppercase tracking-widest ${
                          isActive ? "text-green-400" : "text-zinc-600"
                        }`}
                      >
                        {p?.name}
                      </span>
                    </div>
                    <span
                      className={`font-black tabular-nums text-xl leading-tight ${
                        isActive ? "text-white" : "text-zinc-600"
                      }`}
                    >
                      {p?.score ?? 0}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Target rows */}
            <div className="flex-1 flex flex-col justify-around min-h-0">
              {CRICKET_TARGETS.map((target) => {
                const allClosed = isNumberClosedByAll(players, target);
                return (
                  <div
                    key={target}
                    className={`grid grid-cols-3 items-center transition-opacity duration-200 ${
                      allClosed ? "opacity-25" : ""
                    }`}
                  >
                    {/* Left player marks */}
                    <div className="flex justify-center">
                      <MarksIcon
                        marks={players[0]?.marks[target] ?? 0}
                        isActive={currentPlayerIndex === 0}
                      />
                    </div>

                    {/* Target label */}
                    <div className="flex justify-center">
                      <span
                        className={`font-black tabular-nums leading-none text-2xl ${
                          allClosed ? "text-zinc-600" : "text-zinc-200"
                        }`}
                      >
                        {targetLabel(target)}
                      </span>
                    </div>

                    {/* Right player marks */}
                    <div className="flex justify-center">
                      <MarksIcon
                        marks={players[1]?.marks[target] ?? 0}
                        isActive={currentPlayerIndex === 1}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── 3+ players: table layout ── */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Player name header row */}
            <div
              className="grid shrink-0 mb-1"
              style={{ gridTemplateColumns: `3rem repeat(${n}, 1fr)` }}
            >
              <div />
              {players.map((p, pi) => {
                const isActive = pi === currentPlayerIndex;
                return (
                  <div key={pi} className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.8)]" />
                      )}
                      <span
                        className={`text-xs font-black uppercase tracking-wider truncate ${
                          isActive ? "text-green-400" : "text-zinc-600"
                        }`}
                      >
                        {p.name}
                      </span>
                    </div>
                    <span
                      className={`font-black tabular-nums text-sm leading-tight ${
                        isActive ? "text-white" : "text-zinc-600"
                      }`}
                    >
                      {p.score}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Target rows */}
            <div className="flex-1 flex flex-col justify-around min-h-0">
              {CRICKET_TARGETS.map((target) => {
                const allClosed = isNumberClosedByAll(players, target);
                return (
                  <div
                    key={target}
                    className={`grid items-center transition-opacity duration-200 ${
                      allClosed ? "opacity-25" : ""
                    }`}
                    style={{ gridTemplateColumns: `3rem repeat(${n}, 1fr)` }}
                  >
                    <span
                      className={`font-black tabular-nums text-lg text-right pr-2 ${
                        allClosed ? "text-zinc-600" : "text-zinc-300"
                      }`}
                    >
                      {targetLabel(target)}
                    </span>
                    {players.map((p, pi) => (
                      <div key={pi} className="flex justify-center">
                        <MarksIcon
                          marks={p.marks[target]}
                          isActive={pi === currentPlayerIndex}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Dart slots for active player */}
        <div className="flex gap-3 shrink-0 pt-1">
          {/* Active player label */}
          <div className="flex items-center gap-2 w-full">
            <span className="text-green-700 text-xs font-black uppercase tracking-widest shrink-0">
              {currentPlayer?.name}
            </span>
            <div className="flex gap-2 flex-1">
              {[0, 1, 2].map((j) => {
                const thrown = currentRoundDarts[j];
                const isNext = j === currentRoundDarts.length && !readyToSwitch;
                const scored = thrown && thrown.pointsScored > 0;
                const hitTarget = thrown && thrown.target !== null;
                return (
                  <div
                    key={j}
                    className={`flex-1 h-14 rounded-lg flex flex-col items-center justify-center border-2 transition-all duration-200 ${
                      thrown
                        ? scored
                          ? "border-green-600 bg-green-950/60 shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                          : hitTarget
                            ? "border-zinc-500 bg-zinc-800/60"
                            : "border-zinc-700 bg-zinc-800/40"
                        : isNext
                          ? "border-green-700 border-dashed bg-zinc-900"
                          : "border-zinc-800 bg-zinc-900/50"
                    }`}
                  >
                    {thrown ? (
                      <>
                        <span
                          className={`text-base font-black leading-tight ${
                            scored
                              ? "text-green-400"
                              : hitTarget
                                ? "text-white"
                                : "text-zinc-600"
                          }`}
                        >
                          {thrown.target !== null
                            ? thrown.marksEarned > 0
                              ? `+${thrown.marksEarned}`
                              : "0"
                            : "0"}
                        </span>
                        <span className="text-xs text-zinc-500 font-bold uppercase">
                          {thrown.target !== null
                            ? targetLabel(thrown.target)
                            : thrown.segment.ShortName}
                        </span>
                      </>
                    ) : isNext ? (
                      <span className="text-green-700 text-sm font-black">
                        {j + 1}
                      </span>
                    ) : (
                      <span className="text-zinc-700 text-xl">·</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Player strip */}
      <div
        className={`shrink-0 grid border-t-2 border-zinc-800 bg-black ${stripColsClass(n)}`}
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
              className={`flex flex-col items-center py-3 px-2 border-r border-zinc-800 last:border-r-0 transition-all duration-300 ${
                isActive
                  ? "bg-zinc-900 shadow-[inset_0_2px_0_rgba(34,197,94,0.5)]"
                  : "bg-black"
              }`}
            >
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
                {mpr} mpr
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
        {readyToSwitch && nextPlayer && (
          <p className="text-center text-green-400 text-xs uppercase tracking-widest mb-2 font-black">
            {nextPlayer.name}'s turn
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
