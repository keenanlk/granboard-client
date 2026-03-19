export type PlayerStatus = "online" | "in_game";
export type RoomStatus = "waiting" | "playing" | "finished" | "abandoned";
export type InviteStatus = "pending" | "accepted" | "declined" | "expired";
export type OnlineGameType = "x01" | "cricket" | "set";

export interface OnlinePlayer {
  id: string;
  display_name: string;
  status: PlayerStatus;
  last_seen: string;
}

export interface Room {
  id: string;
  host_id: string;
  guest_id: string | null;
  status: RoomStatus;
  game_type: OnlineGameType;
  game_options: unknown;
  created_at: string;
}

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
