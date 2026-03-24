import { useState, useEffect, useCallback, useRef } from "react";
import { Client } from "colyseus.js";
import type { Room } from "colyseus.js";
import type {
  Database,
  TournamentFormat,
  TournamentGameConfig,
} from "@nlc-darts/tournament";

const rawColyseusUrl =
  (import.meta.env.VITE_COLYSEUS_URL as string) ?? "ws://localhost:2567";
const COLYSEUS_URL = rawColyseusUrl.startsWith("/")
  ? `${location.origin}${rawColyseusUrl}`
  : rawColyseusUrl;

interface RegistrationUpdate {
  tournamentId: string;
  participantCount: number;
  participants: Array<{ id: string; name: string }>;
}

interface TournamentCreatedEvent {
  tournamentId: string;
  joinCode: string;
}

interface MatchReadyState {
  matchId: number;
  readyPlayerIds: string[];
  opponentName: string | null;
}

interface MatchCountdown {
  matchId: number;
  secondsLeft: number;
}

interface MatchStart {
  matchId: number;
  playerNames: string[];
  playerIds: string[];
  gameSettings: TournamentGameConfig | null;
  colyseusRoomId: string | null;
}

interface MatchAlert {
  matchId: number;
  playerIds: string[];
  playerNames: string[];
  tournamentId: string;
}

interface TournamentRoomState {
  connected: boolean;
  bracketData: Database | null;
  participantUserMap: Record<number, string> | null;
  registrationUpdate: RegistrationUpdate | null;
  tournamentCreated: TournamentCreatedEvent | null;
  error: string | null;
  matchReadyState: MatchReadyState | null;
  matchCountdown: MatchCountdown | null;
  matchStart: MatchStart | null;
  matchAlert: MatchAlert | null;
  matchGameRoom: { matchId: number; colyseusRoomId: string } | null;
}

export function useTournamentRoom() {
  const [state, setState] = useState<TournamentRoomState>({
    connected: false,
    bracketData: null,
    participantUserMap: null,
    registrationUpdate: null,
    tournamentCreated: null,
    error: null,
    matchReadyState: null,
    matchCountdown: null,
    matchStart: null,
    matchAlert: null,
    matchGameRoom: null,
  });

  const roomRef = useRef<Room | null>(null);
  const clientRef = useRef<Client | null>(null);

  const currentTournamentIdRef = useRef<string | undefined>(undefined);

  const connect = useCallback(async (tournamentId?: string) => {
    // If already connected to a different tournament, disconnect first
    if (
      roomRef.current &&
      tournamentId &&
      currentTournamentIdRef.current !== tournamentId
    ) {
      roomRef.current.leave();
      roomRef.current = null;
    }

    if (roomRef.current) return;

    currentTournamentIdRef.current = tournamentId;

    try {
      const client = new Client(COLYSEUS_URL);
      clientRef.current = client;

      const room = await client.joinOrCreate(
        "tournament",
        tournamentId ? { tournamentId } : {},
      );
      roomRef.current = room;

      room.onMessage(
        "bracket_update",
        (data: {
          bracketData: Database;
          participantUserMap?: Record<number, string>;
        }) => {
          setState((s) => ({
            ...s,
            bracketData: data.bracketData,
            participantUserMap: data.participantUserMap ?? s.participantUserMap,
          }));
        },
      );

      room.onMessage("registration_update", (data: RegistrationUpdate) => {
        setState((s) => ({ ...s, registrationUpdate: data }));
      });

      room.onMessage("tournament_created", (data: TournamentCreatedEvent) => {
        setState((s) => ({ ...s, tournamentCreated: data }));
      });

      room.onMessage("tournament_error", (data: { error: string }) => {
        setState((s) => ({ ...s, error: data.error }));
      });

      // Match-play messages
      room.onMessage("match_ready_state", (data: MatchReadyState) => {
        setState((s) => ({ ...s, matchReadyState: data }));
      });

      room.onMessage("match_countdown", (data: MatchCountdown) => {
        setState((s) => ({ ...s, matchCountdown: data }));
      });

      room.onMessage("match_start", (data: MatchStart) => {
        setState((s) => ({ ...s, matchStart: data }));
      });

      room.onMessage("match_your_turn", (data: MatchAlert) => {
        setState((s) => ({ ...s, matchAlert: data }));
      });

      room.onMessage(
        "match_game_room_created",
        (data: { matchId: number; colyseusRoomId: string }) => {
          setState((s) => ({ ...s, matchGameRoom: data }));
        },
      );

      room.onLeave(() => {
        roomRef.current = null;
        setState((s) => ({ ...s, connected: false }));
      });

      setState((s) => ({ ...s, connected: true, error: null }));
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : "Connection failed",
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    roomRef.current?.leave();
    roomRef.current = null;
    setState({
      connected: false,
      bracketData: null,
      participantUserMap: null,
      registrationUpdate: null,
      tournamentCreated: null,
      error: null,
      matchReadyState: null,
      matchCountdown: null,
      matchStart: null,
      matchAlert: null,
      matchGameRoom: null,
    });
  }, []);

  useEffect(() => {
    return () => {
      roomRef.current?.leave();
    };
  }, []);

  const createTournament = useCallback(
    (data: {
      name: string;
      format: TournamentFormat;
      visibility?: "public" | "private";
      scheduledAt?: string | null;
      registrationDeadline?: string | null;
      maxParticipants?: number | null;
      createdBy: string;
    }) => {
      roomRef.current?.send("create_tournament", data);
    },
    [],
  );

  const startTournament = useCallback(
    (tournamentId: string, userId: string) => {
      roomRef.current?.send("start_tournament", { tournamentId, userId });
    },
    [],
  );

  const recordResult = useCallback(
    (matchId: number, opponent1Score: number, opponent2Score: number) => {
      roomRef.current?.send("record_result", {
        matchId,
        opponent1Score,
        opponent2Score,
      });
    },
    [],
  );

  const registerPlayer = useCallback((tournamentId: string, userId: string) => {
    roomRef.current?.send("register_player", { tournamentId, userId });
  }, []);

  const unregisterPlayer = useCallback(
    (tournamentId: string, userId: string) => {
      roomRef.current?.send("unregister_player", { tournamentId, userId });
    },
    [],
  );

  const readyForMatch = useCallback(
    (matchId: number, userId: string, tournamentId: string) => {
      roomRef.current?.send("ready_for_match", {
        matchId,
        userId,
        tournamentId,
      });
    },
    [],
  );

  const unreadyForMatch = useCallback((matchId: number, userId: string) => {
    roomRef.current?.send("unready_for_match", { matchId, userId });
  }, []);

  const reportMatchGameResult = useCallback(
    (
      matchId: number,
      winnerUserId: string,
      legResults: Array<{ winnerName: string; winnerIndex: number }>,
    ) => {
      roomRef.current?.send("match_game_result", {
        matchId,
        winnerUserId,
        legResults,
      });
    },
    [],
  );

  const clearMatchAlert = useCallback(() => {
    setState((s) => ({ ...s, matchAlert: null }));
  }, []);

  const clearMatchStart = useCallback(() => {
    setState((s) => ({ ...s, matchStart: null }));
  }, []);

  const sendGameRoomReady = useCallback(
    (matchId: number, colyseusRoomId: string) => {
      roomRef.current?.send("match_game_room_ready", {
        matchId,
        colyseusRoomId,
      });
    },
    [],
  );

  const clearMatchGameRoom = useCallback(() => {
    setState((s) => ({ ...s, matchGameRoom: null }));
  }, []);

  const clearMatchCountdown = useCallback(() => {
    setState((s) => ({ ...s, matchCountdown: null, matchReadyState: null }));
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    createTournament,
    startTournament,
    recordResult,
    registerPlayer,
    unregisterPlayer,
    readyForMatch,
    unreadyForMatch,
    reportMatchGameResult,
    clearMatchAlert,
    clearMatchStart,
    sendGameRoomReady,
    clearMatchGameRoom,
    clearMatchCountdown,
  };
}
