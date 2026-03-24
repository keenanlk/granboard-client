import type {
  LobbyPhase,
  InvitePhase,
  RoomPhase,
  ColyseusPhase,
  RematchPhase,
  NextLegPhase,
  TournamentPhase,
} from "../online/transitions.ts";
import type { Database, TournamentGameConfig } from "@nlc-darts/tournament";
import type { OnlinePlayerStats } from "../lib/onlineStats.ts";

// Re-export phase types for convenience
export type {
  LobbyPhase,
  InvitePhase,
  RoomPhase,
  ColyseusPhase,
  RematchPhase,
  NextLegPhase,
  TournamentPhase,
};

/** Whether a player is idle or currently in a game. */
export type PlayerStatus = "online" | "in_game";

/** Lifecycle status of a multiplayer room. */
export type RoomStatus = "waiting" | "playing" | "finished" | "abandoned";

/** Lifecycle status of a game invite. */
export type InviteStatus = "pending" | "accepted" | "declined" | "expired";

/** Game types supported in online multiplayer. */
export type OnlineGameType = "x01" | "cricket" | "set";

/** A player visible in the online lobby. */
export interface OnlinePlayer {
  id: string;
  display_name: string;
  avatar_url: string | null;
  status: PlayerStatus;
  last_seen: string;
  x01_grade: string | null;
  x01_ppd: number;
  x01_games: number;
  cricket_grade: string | null;
  cricket_mpr: number;
  cricket_games: number;
}

/** A multiplayer game room record. */
export interface Room {
  id: string;
  host_id: string;
  guest_id: string | null;
  status: RoomStatus;
  game_type: OnlineGameType;
  game_options: unknown;
  created_at: string;
}

/** An invitation from one player to another to join a room. */
export interface Invite {
  id: string;
  from_id: string;
  to_id: string;
  room_id: string;
  game_type: OnlineGameType;
  game_options: unknown;
  status: InviteStatus;
  created_at: string;
  expires_at: string;
  /** Joined from online_players for display */
  from_name?: string;
}

/** Configuration for launching an online game via Colyseus. */
export interface OnlineConfig {
  roomId: string;
  isHost: boolean;
  colyseusRoomId?: string;
  gameType?: "x01" | "cricket";
  playerNames?: string[];
  playerIds?: (string | null)[];
  gameOptions?: unknown;
}

/** Match ready-up state from the tournament room. */
export interface MatchReadyState {
  matchId: number;
  readyPlayerIds: string[];
  opponentName: string | null;
}

/** Match countdown tick from the tournament room. */
export interface MatchCountdown {
  matchId: number;
  secondsLeft: number;
}

/** Match start signal from the tournament room. */
export interface MatchStart {
  matchId: number;
  playerNames: string[];
  playerIds: string[];
  gameSettings: TournamentGameConfig | null;
  colyseusRoomId: string | null;
}

/** Match alert (your-turn notification) from the tournament room. */
export interface MatchAlert {
  matchId: number;
  playerIds: string[];
  playerNames: string[];
  tournamentId: string;
}

/** Registration update from the tournament room. */
export interface RegistrationUpdate {
  tournamentId: string;
  participantCount: number;
  participants: Array<{ id: string; name: string }>;
}

/** Tournament created confirmation. */
export interface TournamentCreatedEvent {
  tournamentId: string;
  joinCode: string;
}

// --- Store state shape ---

export interface OnlineStoreState {
  // Auth
  authUserId: string | null;
  displayName: string | null;
  stats: OnlinePlayerStats;

  // Phase machines
  lobbyPhase: LobbyPhase;
  invitePhase: InvitePhase;
  roomPhase: RoomPhase;
  colyseusPhase: ColyseusPhase;
  rematchPhase: RematchPhase;
  nextLegPhase: NextLegPhase;
  tournamentPhase: TournamentPhase;

  // Lobby
  onlinePlayers: OnlinePlayer[];

  // Rooms & invites
  currentRoom: Room | null;
  isHost: boolean;
  opponentName: string | null;
  pendingInvite: Invite | null;
  sentInvite: Invite | null;
  onlineConfig: OnlineConfig | null;

  // Tournament
  bracketData: Database | null;
  participantUserMap: Record<number, string> | null;
  registrationUpdate: RegistrationUpdate | null;
  tournamentCreated: TournamentCreatedEvent | null;
  tournamentError: string | null;
  matchReadyState: MatchReadyState | null;
  matchCountdown: MatchCountdown | null;
  matchStart: MatchStart | null;
  matchAlert: MatchAlert | null;
  matchGameRoom: { matchId: number; colyseusRoomId: string } | null;
}

export interface OnlineStoreActions {
  set: (partial: Partial<OnlineStoreState>) => void;

  // Lobby
  goOnline: () => Promise<void>;
  goOffline: () => Promise<void>;

  // Invites
  sendInvite: (
    toId: string,
    gameType: OnlineGameType,
    gameOptions: unknown,
  ) => Promise<void>;
  acceptInvite: (invite: Invite) => Promise<void>;
  declineInvite: (invite: Invite) => Promise<void>;
  dismissInvite: () => void;
  dismissSentInvite: () => void;

  // Room
  createRoom: (
    gameType: OnlineGameType,
    gameOptions: unknown,
  ) => Promise<Room | null>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  updateRoomStatus: (status: RoomStatus) => void;

  // Game (Colyseus)
  launchGame: (config: OnlineConfig) => Promise<void>;
  sendDart: (segmentId: number) => void;
  sendNextTurn: () => void;
  sendUndo: () => void;

  // Rematch / Next Leg
  requestRematch: () => void;
  acceptRematch: () => void;
  declineRematch: () => void;
  requestNextLeg: () => void;
  resetNextLeg: () => void;
  resetRematch: () => void;

  // Tournament
  connectTournament: (tournamentId?: string) => Promise<void>;
  disconnectTournament: () => void;
  createTournament: (data: {
    name: string;
    format: string;
    visibility?: "public" | "private";
    scheduledAt?: string | null;
    registrationDeadline?: string | null;
    maxParticipants?: number | null;
    createdBy: string;
  }) => void;
  startTournament: (tournamentId: string, userId: string) => void;
  registerPlayer: (tournamentId: string, userId: string) => void;
  unregisterPlayer: (tournamentId: string, userId: string) => void;
  readyForMatch: (
    matchId: number,
    userId: string,
    tournamentId: string,
  ) => void;
  unreadyForMatch: (matchId: number, userId: string) => void;
  reportMatchGameResult: (
    matchId: number,
    winnerUserId: string,
    legResults: Array<{ winnerName: string; winnerIndex: number }>,
  ) => void;
  sendGameRoomReady: (matchId: number, colyseusRoomId: string) => void;
  clearMatchAlert: () => void;
  clearMatchStart: () => void;
  clearMatchCountdown: () => void;
  clearMatchGameRoom: () => void;
  recordResult: (
    matchId: number,
    opponent1Score: number,
    opponent2Score: number,
  ) => void;
}

export type OnlineStore = OnlineStoreState & OnlineStoreActions;
