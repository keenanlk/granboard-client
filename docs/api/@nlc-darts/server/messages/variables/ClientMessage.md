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

### DART_HIT

> `readonly` **DART_HIT**: `"dart_hit"` = `"dart_hit"`

### NEXT_TURN

> `readonly` **NEXT_TURN**: `"next_turn"` = `"next_turn"`

### REMATCH_ACCEPT

> `readonly` **REMATCH_ACCEPT**: `"rematch_accept"` = `"rematch_accept"`

### REMATCH_DECLINE

> `readonly` **REMATCH_DECLINE**: `"rematch_decline"` = `"rematch_decline"`

### REMATCH_REQUEST

> `readonly` **REMATCH_REQUEST**: `"rematch_request"` = `"rematch_request"`

### UNDO

> `readonly` **UNDO**: `"undo"` = `"undo"`

### WEBRTC_SIGNAL

> `readonly` **WEBRTC_SIGNAL**: `"webrtc_signal"` = `"webrtc_signal"`

WebRTC SDP offer/answer relayed between peers for camera streaming.
