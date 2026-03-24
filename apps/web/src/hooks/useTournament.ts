import { useOnlineStore } from "../store/useOnlineStore.ts";

/**
 * Thin selector hook for tournament state.
 * Replaces useTournamentRoom.
 */
export function useTournament() {
  // State selectors
  const tournamentPhase = useOnlineStore((s) => s.tournamentPhase);
  const bracketData = useOnlineStore((s) => s.bracketData);
  const participantUserMap = useOnlineStore((s) => s.participantUserMap);
  const registrationUpdate = useOnlineStore((s) => s.registrationUpdate);
  const tournamentCreated = useOnlineStore((s) => s.tournamentCreated);
  const error = useOnlineStore((s) => s.tournamentError);
  const matchReadyState = useOnlineStore((s) => s.matchReadyState);
  const matchCountdown = useOnlineStore((s) => s.matchCountdown);
  const matchStart = useOnlineStore((s) => s.matchStart);
  const matchAlert = useOnlineStore((s) => s.matchAlert);
  const matchGameRoom = useOnlineStore((s) => s.matchGameRoom);

  // Actions
  const connect = useOnlineStore((s) => s.connectTournament);
  const disconnect = useOnlineStore((s) => s.disconnectTournament);
  const createTournament = useOnlineStore((s) => s.createTournament);
  const startTournament = useOnlineStore((s) => s.startTournament);
  const registerPlayer = useOnlineStore((s) => s.registerPlayer);
  const unregisterPlayer = useOnlineStore((s) => s.unregisterPlayer);
  const readyForMatch = useOnlineStore((s) => s.readyForMatch);
  const unreadyForMatch = useOnlineStore((s) => s.unreadyForMatch);
  const reportMatchGameResult = useOnlineStore((s) => s.reportMatchGameResult);
  const recordResult = useOnlineStore((s) => s.recordResult);
  const sendGameRoomReady = useOnlineStore((s) => s.sendGameRoomReady);
  const clearMatchAlert = useOnlineStore((s) => s.clearMatchAlert);
  const clearMatchStart = useOnlineStore((s) => s.clearMatchStart);
  const clearMatchCountdown = useOnlineStore((s) => s.clearMatchCountdown);
  const clearMatchGameRoom = useOnlineStore((s) => s.clearMatchGameRoom);

  return {
    // State (backward-compatible shape)
    connected: tournamentPhase !== "disconnected",
    tournamentPhase,
    bracketData,
    participantUserMap,
    registrationUpdate,
    tournamentCreated,
    error,
    matchReadyState,
    matchCountdown,
    matchStart,
    matchAlert,
    matchGameRoom,

    // Actions
    connect,
    disconnect,
    createTournament,
    startTournament,
    registerPlayer,
    unregisterPlayer,
    readyForMatch,
    unreadyForMatch,
    reportMatchGameResult,
    recordResult,
    sendGameRoomReady,
    clearMatchAlert,
    clearMatchStart,
    clearMatchCountdown,
    clearMatchGameRoom,
  };
}
