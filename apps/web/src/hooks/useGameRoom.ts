import { useCallback, useEffect, useRef } from "react";
import { useOnlineStore } from "../store/useOnlineStore.ts";
import { getColyseusManager } from "../online/managers.ts";
import type { OnlineConfig } from "../store/online.types.ts";
import type { ColyseusCallbacks } from "../online/ColyseusConnectionManager.ts";

/**
 * Thin selector hook for game room state.
 * Replaces useColyseusSync + useOnlineRematch + useOnlineNextLeg.
 */
export function useGameRoom(
  onlineConfig: OnlineConfig | null | undefined,
  callbacks?: {
    restoreState: (state: unknown) => void;
    onGameEnded?: (winner: string) => void;
    onOpponentDisconnected?: () => void;
    onTurnDelay?: () => void;
  },
) {
  // Store selectors
  const roomPhase = useOnlineStore((s) => s.roomPhase);
  const colyseusPhase = useOnlineStore((s) => s.colyseusPhase);
  const rematchPhase = useOnlineStore((s) => s.rematchPhase);
  const nextLegPhase = useOnlineStore((s) => s.nextLegPhase);
  const isHost = useOnlineStore((s) => s.isHost);

  // Store actions
  const launchGame = useOnlineStore((s) => s.launchGame);
  const sendDart = useOnlineStore((s) => s.sendDart);
  const sendNextTurn = useOnlineStore((s) => s.sendNextTurn);
  const sendUndo = useOnlineStore((s) => s.sendUndo);
  const requestRematch = useOnlineStore((s) => s.requestRematch);
  const acceptRematch = useOnlineStore((s) => s.acceptRematch);
  const declineRematch = useOnlineStore((s) => s.declineRematch);
  const requestNextLeg = useOnlineStore((s) => s.requestNextLeg);
  const resetNextLeg = useOnlineStore((s) => s.resetNextLeg);
  const resetRematch = useOnlineStore((s) => s.resetRematch);

  // Ref to track callbacks so we can update handlers without reconnecting
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  // Install/update handlers when online config changes
  const hasLaunched = useRef(false);
  useEffect(() => {
    if (!onlineConfig || !callbacks) return;

    // Install handlers (these use the ref)
    const cbProxy: ColyseusCallbacks = {
      restoreState: (state) => callbacksRef.current?.restoreState(state),
      onGameEnded: (winner) => callbacksRef.current?.onGameEnded?.(winner),
      onOpponentDisconnected: () =>
        callbacksRef.current?.onOpponentDisconnected?.(),
      onTurnDelay: () => callbacksRef.current?.onTurnDelay?.(),
    };

    const mgr = getColyseusManager();
    mgr.installHandlers(cbProxy);

    // Launch the game (idempotent if already connected)
    if (!hasLaunched.current) {
      hasLaunched.current = true;
      void launchGame(onlineConfig);
    }

    return () => {
      // Don't clean up on unmount — the manager persists across remounts
    };
  }, [onlineConfig, callbacks, launchGame]);

  // Get room reference for ColyseusRemoteController usage
  const getRoom = useCallback(() => {
    return getColyseusManager().getRoom();
  }, []);

  return {
    // State
    roomPhase,
    colyseusPhase,
    rematchPhase,
    nextLegPhase,
    isHost,
    isOnline: !!onlineConfig,
    room: getColyseusManager().getRoom(),

    // Game actions
    sendDart,
    sendNextTurn,
    sendUndo,
    getRoom,

    // Rematch
    requestRematch,
    acceptRematch,
    declineRematch,
    resetRematch,

    // Next leg
    requestNextLeg,
    resetNextLeg,
  };
}
