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
