import { useCallback, useEffect, useRef } from "react";
import { setActiveController } from "../controllers/GameController.ts";
import type { GameController } from "../controllers/GameController.ts";
import { GameRecorder } from "../db/gameRecorder.ts";
import type { RecordedDart } from "../db/gameRecorder.ts";
import { useTurnDelay } from "./useTurnDelay.ts";
import { Sounds } from "../sound/sounds.ts";
import { gameLogger } from "../lib/GameLogger.ts";
import type { BotSkill } from "../bot/Bot.ts";

export interface RoundExtract {
  playerIndex: number;
  darts: RecordedDart[];
  roundScore: number;
  busted?: boolean;
}

/**
 * Shared session hook for all game modes.
 * Handles: controller lifecycle, per-turn recording, turn delay (remove darts countdown),
 * and winner-triggered final-round recording + session save.
 *
 * Each game screen provides:
 *   - onInit        — called first: startGame() + any game-specific init (e.g. LED open numbers)
 *   - createController — factory for the game-specific controller
 *   - extractRound  — reads current store state and returns dart data for recording
 *   - winner        — current winner(s) from the store (null while game is live)
 *   - getFinalScores — reads final scores from the store when the game ends
 */
export function useGameSession({
  gameType,
  playerNames,
  playerIds,
  botSkills,
  options,
  createController,
  extractRound,
  winner,
  getFinalScores,
  onInit,
}: {
  gameType: "x01" | "cricket" | "highscore";
  playerNames: string[];
  playerIds: (string | null)[];
  botSkills?: (BotSkill | null)[];
  options: unknown;
  createController: () => GameController;
  extractRound: () => RoundExtract;
  winner: string[] | null;
  getFinalScores: () => number[];
  onInit: () => void;
}) {
  const controllerRef = useRef<GameController | null>(null);
  const recorderRef = useRef<GameRecorder | null>(null);
  const savedRef = useRef(false);

  // Stable refs so the onNextTurn closure always calls the latest version
  const extractRoundRef = useRef(extractRound);
  extractRoundRef.current = extractRound;
  const getFinalScoresRef = useRef(getFinalScores);
  getFinalScoresRef.current = getFinalScores;
  const onInitRef = useRef(onInit);
  onInitRef.current = onInit;

  const { isTransitioning, countdown, triggerDelay } = useTurnDelay();
  const triggerDelayRef = useRef(triggerDelay);
  triggerDelayRef.current = triggerDelay;

  // Reset saved guard when a new game starts
  useEffect(() => {
    savedRef.current = false;
  }, [gameType, playerNames, playerIds, options]);

  useEffect(() => {
    Sounds.intro();
    gameLogger.start(gameType, playerNames, botSkills ?? [], options);
    onInitRef.current();

    // createController intentionally excluded from deps — it never needs to change

    const controller = createController();
    recorderRef.current = new GameRecorder(
      gameType,
      playerNames,
      playerIds,
      options,
    );

    const origOnNextTurn = controller.onNextTurn.bind(controller);
    controller.onNextTurn = () => {
      const { playerIndex, darts, roundScore, busted } = extractRoundRef.current();
      if (darts.length > 0) {
        recorderRef.current?.recordRound(playerIndex, darts, roundScore);
        gameLogger.logTurnEnd(playerNames[playerIndex], darts.length, roundScore, busted);
      }
      setActiveController(null);
      triggerDelayRef.current(() => {
        setActiveController(controller);
        origOnNextTurn();
      });
    };

    controllerRef.current = controller;
    setActiveController(controller);
    return () => setActiveController(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameType, playerNames, playerIds, options]);

  /**
   * Record the winning player's final round and save the session.
   * X01/Cricket: winner is set by addDart — darts are still in the store.
   * HighScore: winner is set by nextTurn — darts already cleared, guard skips recording.
   */
  useEffect(() => {
    if (!winner || savedRef.current) return;
    savedRef.current = true;
    const { playerIndex, darts, roundScore, busted } = extractRoundRef.current();
    if (darts.length > 0) {
      recorderRef.current?.recordRound(playerIndex, darts, roundScore);
      gameLogger.logTurnEnd(playerNames[playerIndex], darts.length, roundScore, busted);
    }
    const finalScores = getFinalScoresRef.current();
    const scoreMap = Object.fromEntries(playerNames.map((n, i) => [n, finalScores[i]]));
    gameLogger.logGameEnd(winner, scoreMap);
    void recorderRef.current?.save(winner, finalScores);
  }, [winner]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNextTurn = useCallback(() => {
    controllerRef.current?.onNextTurn();
  }, []);

  return { handleNextTurn, isTransitioning, countdown };
}
