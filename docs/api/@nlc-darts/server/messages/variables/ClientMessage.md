[**Documentation**](../../../../README.md)

---

[Documentation](../../../../README.md) / [@nlc-darts/server](../../README.md) / [messages](../README.md) / ClientMessage

# Variable: ClientMessage

> `const` **ClientMessage**: `object`

Defined in: [apps/server/src/messages.ts:2](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/messages.ts#L2)

Client → Server action types

## Type Declaration

### CAMERA_STATUS

> `readonly` **CAMERA_STATUS**: `"camera_status"` = `"camera_status"`

Notifies opponent whether this player's camera is active.

### CREATE_TOURNAMENT

> `readonly` **CREATE_TOURNAMENT**: `"create_tournament"` = `"create_tournament"`

### DART_HIT

> `readonly` **DART_HIT**: `"dart_hit"` = `"dart_hit"`

### MATCH_GAME_RESULT

> `readonly` **MATCH_GAME_RESULT**: `"match_game_result"` = `"match_game_result"`

### MATCH_GAME_ROOM_READY

> `readonly` **MATCH_GAME_ROOM_READY**: `"match_game_room_ready"` = `"match_game_room_ready"`

### NEXT_TURN

> `readonly` **NEXT_TURN**: `"next_turn"` = `"next_turn"`

### READY_FOR_MATCH

> `readonly` **READY_FOR_MATCH**: `"ready_for_match"` = `"ready_for_match"`

### RECORD_RESULT

> `readonly` **RECORD_RESULT**: `"record_result"` = `"record_result"`

### REGISTER_PLAYER

> `readonly` **REGISTER_PLAYER**: `"register_player"` = `"register_player"`

### REMATCH

> `readonly` **REMATCH**: `"rematch"` = `"rematch"`

Resets the game state for a rematch within the same room.

### REMATCH_ACCEPT

> `readonly` **REMATCH_ACCEPT**: `"rematch_accept"` = `"rematch_accept"`

### REMATCH_DECLINE

> `readonly` **REMATCH_DECLINE**: `"rematch_decline"` = `"rematch_decline"`

### REMATCH_REQUEST

> `readonly` **REMATCH_REQUEST**: `"rematch_request"` = `"rematch_request"`

### START_TOURNAMENT

> `readonly` **START_TOURNAMENT**: `"start_tournament"` = `"start_tournament"`

### UNDO

> `readonly` **UNDO**: `"undo"` = `"undo"`

### UNREADY_FOR_MATCH

> `readonly` **UNREADY_FOR_MATCH**: `"unready_for_match"` = `"unready_for_match"`

### UNREGISTER_PLAYER

> `readonly` **UNREGISTER_PLAYER**: `"unregister_player"` = `"unregister_player"`

### WEBRTC_SIGNAL

> `readonly` **WEBRTC_SIGNAL**: `"webrtc_signal"` = `"webrtc_signal"`

WebRTC SDP offer/answer relayed between peers for camera streaming.
