[**Documentation**](../../../README.md)

---

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / useOnlineSync

# Function: useOnlineSync()

> **useOnlineSync**(`__namedParameters`): `object`

Defined in: [hooks/useOnlineSync.ts:45](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useOnlineSync.ts#L45)

Core online sync hook — always safe to call (no-op when onlineConfig is null).

Host mode: Listens for dart_hit / action_request messages from remote, and
exposes broadcastState() to send full state after each mutation.
Also forwards game events (LED/sound triggers) to the remote.

Remote mode: Listens for state_update messages and calls restoreState().
Also re-emits forwarded game events on the local event bus.

## Parameters

### \_\_namedParameters

[`UseOnlineSyncOptions`](../interfaces/UseOnlineSyncOptions.md)

## Returns

### broadcastState

> **broadcastState**: () => `void`

#### Returns

`void`

### broadcastTurnDelay

> **broadcastTurnDelay**: () => `void`

Host calls this when the between-turn delay starts so remote shows its own countdown

#### Returns

`void`

### isOnline

> **isOnline**: `boolean` = `!!onlineConfig`
