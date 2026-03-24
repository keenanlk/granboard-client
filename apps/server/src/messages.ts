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
  // Tournament messages
  CREATE_TOURNAMENT: "create_tournament",
  START_TOURNAMENT: "start_tournament",
  RECORD_RESULT: "record_result",
  REGISTER_PLAYER: "register_player",
  UNREGISTER_PLAYER: "unregister_player",
  // Tournament match-play messages
  READY_FOR_MATCH: "ready_for_match",
  UNREADY_FOR_MATCH: "unready_for_match",
  MATCH_GAME_RESULT: "match_game_result",
  MATCH_GAME_ROOM_READY: "match_game_room_ready",
  NEXT_LEG_REQUEST: "next_leg_request",
  NEXT_LEG_ACCEPT: "next_leg_accept",
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
  // Tournament messages
  BRACKET_UPDATE: "bracket_update",
  REGISTRATION_UPDATE: "registration_update",
  TOURNAMENT_CREATED: "tournament_created",
  TOURNAMENT_ERROR: "tournament_error",
  // Tournament match-play messages
  MATCH_READY_STATE: "match_ready_state",
  MATCH_COUNTDOWN: "match_countdown",
  MATCH_START: "match_start",
  MATCH_YOUR_TURN: "match_your_turn",
  MATCH_GAME_ROOM_CREATED: "match_game_room_created",
  NEXT_LEG_REQUEST: "next_leg_request",
  NEXT_LEG_ACCEPT: "next_leg_accept",
} as const;
