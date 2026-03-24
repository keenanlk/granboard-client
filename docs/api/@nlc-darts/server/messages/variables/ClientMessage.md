[**Documentation**](../../../../README.md)

***

[Documentation](../../../../README.md) / [@nlc-darts/server](../../README.md) / [messages](../README.md) / ClientMessage

# Variable: ClientMessage

> `const` **ClientMessage**: `object`

Defined in: [apps/server/src/messages.ts:2](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/messages.ts#L2)

Client → Server action types

## Type Declaration

### CAMERA\_STATUS

> `readonly` **CAMERA\_STATUS**: `"camera_status"` = `"camera_status"`

Notifies opponent whether this player's camera is active.

### CREATE\_TOURNAMENT

> `readonly` **CREATE\_TOURNAMENT**: `"create_tournament"` = `"create_tournament"`

### DART\_HIT

> `readonly` **DART\_HIT**: `"dart_hit"` = `"dart_hit"`

### MATCH\_GAME\_RESULT

> `readonly` **MATCH\_GAME\_RESULT**: `"match_game_result"` = `"match_game_result"`

### MATCH\_GAME\_ROOM\_READY

> `readonly` **MATCH\_GAME\_ROOM\_READY**: `"match_game_room_ready"` = `"match_game_room_ready"`

### NEXT\_LEG\_ACCEPT

> `readonly` **NEXT\_LEG\_ACCEPT**: `"next_leg_accept"` = `"next_leg_accept"`

### NEXT\_LEG\_REQUEST

> `readonly` **NEXT\_LEG\_REQUEST**: `"next_leg_request"` = `"next_leg_request"`

### NEXT\_TURN

> `readonly` **NEXT\_TURN**: `"next_turn"` = `"next_turn"`

### READY\_FOR\_MATCH

> `readonly` **READY\_FOR\_MATCH**: `"ready_for_match"` = `"ready_for_match"`

### RECORD\_RESULT

> `readonly` **RECORD\_RESULT**: `"record_result"` = `"record_result"`

### REGISTER\_PLAYER

> `readonly` **REGISTER\_PLAYER**: `"register_player"` = `"register_player"`

### REMATCH

> `readonly` **REMATCH**: `"rematch"` = `"rematch"`

Resets the game state for a rematch within the same room.

### REMATCH\_ACCEPT

> `readonly` **REMATCH\_ACCEPT**: `"rematch_accept"` = `"rematch_accept"`

### REMATCH\_DECLINE

> `readonly` **REMATCH\_DECLINE**: `"rematch_decline"` = `"rematch_decline"`

### REMATCH\_REQUEST

> `readonly` **REMATCH\_REQUEST**: `"rematch_request"` = `"rematch_request"`

### START\_TOURNAMENT

> `readonly` **START\_TOURNAMENT**: `"start_tournament"` = `"start_tournament"`

### UNDO

> `readonly` **UNDO**: `"undo"` = `"undo"`

### UNREADY\_FOR\_MATCH

> `readonly` **UNREADY\_FOR\_MATCH**: `"unready_for_match"` = `"unready_for_match"`

### UNREGISTER\_PLAYER

> `readonly` **UNREGISTER\_PLAYER**: `"unregister_player"` = `"unregister_player"`

### WEBRTC\_SIGNAL

> `readonly` **WEBRTC\_SIGNAL**: `"webrtc_signal"` = `"webrtc_signal"`

WebRTC SDP offer/answer relayed between peers for camera streaming.
