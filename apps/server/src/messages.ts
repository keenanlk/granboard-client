/** Client → Server action types */
export const ClientMessage = {
  DART_HIT: "dart_hit",
  NEXT_TURN: "next_turn",
  UNDO: "undo",
  REMATCH_REQUEST: "rematch_request",
  REMATCH_ACCEPT: "rematch_accept",
  REMATCH_DECLINE: "rematch_decline",
  /** Resets the game state for a rematch within the same room. */
  REMATCH: "rematch",
  /** WebRTC SDP offer/answer relayed between peers for camera streaming. */
  WEBRTC_SIGNAL: "webrtc_signal",
  /** Notifies opponent whether this player's camera is active. */
  CAMERA_STATUS: "camera_status",
} as const;

/** Server → Client broadcast types */
export const ServerMessage = {
  STATE_UPDATE: "state_update",
  GAME_EVENT: "game_event",
  TURN_DELAY: "turn_delay",
  GAME_ENDED: "game_ended",
  PLAYER_LEFT: "player_left",
  REMATCH_REQUEST: "rematch_request",
  REMATCH_ACCEPT: "rematch_accept",
  REMATCH_DECLINE: "rematch_decline",
} as const;
