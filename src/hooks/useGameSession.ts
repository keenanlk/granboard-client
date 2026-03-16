import { useCallback, useEffect, useRef } from "react";
import { setActiveController } from "../controllers/GameController.ts";
import type { GameController } from "../controllers/GameController.ts";
import { GameRecorder } from "../db/gameRecorder.ts";
import type { RecordedDart } from "../db/gameRecorder.ts";
import { useTurnDelay } from "./useTurnDelay.ts";
import { Sounds } from "../sound/sounds.ts";
import { gameLogger } from "../lib/GameLogger.ts";
import type { BotSkill } from "../bot/Bot.ts";
import { saveSession, clearSession } from "../lib/sessionPersistence.ts";
import { gameEventBus } from "../events/gameEventBus.ts";
import type { SetConfig, LegResult } from "../lib/setTypes.ts";

export interface RoundExtract {
  playerIndex: number;
  darts: RecordedDart[];
  roundScore: number;
  busted?: boolean;
}

/**
 * Shared session hook for all game modes.
 * Handles: controller lifecycle, per-turn recording, turn delay (remove darts countdown),
 * winner-triggered final-round recording + session save, and localStorage persistence.
 *
 * Each game screen provides:
 *   - onInit        — called first: startGame() + any game-specific init (e.g. LED open numbers)
 *   - createController — factory for the game-specific controller
 *   - extractRound  — reads current store state and returns dart data for recording
 *   - winner        — current winner(s) from the store (null while game is live)
 *   - getFinalScores — reads final scores from the store when the game ends
 *   - getSerializableState — returns the store's serializable state for persistence
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
  getSerializableState,
  setConfig,
  legResults,
  currentLegIndex,
  shouldSkipDelay,
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
  getSerializableState: () => unknown;
  setConfig?: SetConfig;
  legResults?: LegResult[];
  currentLegIndex?: number;
  /** If provided, called before triggering turn delay. Return true to skip the delay. */
  shouldSkipDelay?: () => boolean;
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
  const getSerializableStateRef = useRef(getSerializableState);
  getSerializableStateRef.current = getSerializableState;

  const { isTransitioning, countdown, triggerDelay } = useTurnDelay();
  const triggerDelayRef = useRef(triggerDelay);
  triggerDelayRef.current = triggerDelay;
  const shouldSkipDelayRef = useRef(shouldSkipDelay);
  shouldSkipDelayRef.current = shouldSkipDelay;

  // Reset saved guard when a new game starts
  useEffect(() => {
    savedRef.current = false;
  }, [gameType, playerNames, playerIds, options]);

  useEffect(() => {
    Sounds.intro();
    gameEventBus.emit("game_start", {});
    gameLogger.start(gameType, playerNames, botSkills ?? [], options);
    onInitRef.current();

    // Save initial session state
    persistSession();

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
      const { playerIndex, darts, roundScore, busted } =
        extractRoundRef.current();
      if (darts.length > 0) {
        recorderRef.current?.recordRound(playerIndex, darts, roundScore);
        gameLogger.logTurnEnd(
          playerNames[playerIndex],
          darts.length,
          roundScore,
          busted,
        );
      }
      if (shouldSkipDelayRef.current?.()) {
        origOnNextTurn();
        persistSession();
      } else {
        setActiveController(null);
        triggerDelayRef.current(() => {
          setActiveController(controller);
          origOnNextTurn();
          persistSession();
        });
      }
    };

    controllerRef.current = controller;
    setActiveController(controller);
    return () => setActiveController(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameType, playerNames, playerIds, options]);

  // Persist session to localStorage
  function persistSession() {
    saveSession({
      gameType,
      options,
      playerNames,
      playerIds,
      botSkills: botSkills ?? playerNames.map(() => null),
      gameState: getSerializableStateRef.current(),
      savedAt: Date.now(),
      setConfig,
      legResults,
      currentLegIndex,
    });
  }

  /**
   * Record the winning player's final round and save the session.
   * X01/Cricket: winner is set by addDart — darts are still in the store.
   * HighScore: winner is set by nextTurn — darts already cleared, guard skips recording.
   */
  useEffect(() => {
    if (!winner || savedRef.current) return;
    savedRef.current = true;
    const { playerIndex, darts, roundScore, busted } =
      extractRoundRef.current();
    if (darts.length > 0) {
      recorderRef.current?.recordRound(playerIndex, darts, roundScore);
      gameLogger.logTurnEnd(
        playerNames[playerIndex],
        darts.length,
        roundScore,
        busted,
      );
    }
    const finalScores = getFinalScoresRef.current();
    const scoreMap = Object.fromEntries(
      playerNames.map((n, i) => [n, finalScores[i]]),
    );
    gameLogger.logGameEnd(winner, scoreMap);
    void recorderRef.current?.save(winner, finalScores);
    clearSession();
  }, [winner]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNextTurn = useCallback(() => {
    controllerRef.current?.onNextTurn();
  }, []);

  // Save session after each dart (subscribe to state changes via a post-render effect)
  const winnerRef = useRef(winner);
  winnerRef.current = winner;
  useEffect(() => {
    // Persist on every render where there's no winner (game is live)
    if (!winnerRef.current) {
      persistSession();
    }
  });

  return { handleNextTurn, isTransitioning, countdown };
}
