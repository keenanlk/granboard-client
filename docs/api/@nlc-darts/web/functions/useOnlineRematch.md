[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / useOnlineRematch

# Function: useOnlineRematch()

> **useOnlineRematch**(`onlineConfig`): `object`

Defined in: [hooks/useOnlineRematch.ts:16](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useOnlineRematch.ts#L16)

Manages the online rematch handshake via the room broadcast channel.
Returns the current rematch state and actions.

## Parameters

### onlineConfig

`OnlineConfig` \| `undefined`

## Returns

`object`

### acceptRematch

> **acceptRematch**: () => `void`

#### Returns

`void`

### declineRematch

> **declineRematch**: () => `void`

#### Returns

`void`

### rematchState

> **rematchState**: [`RematchState`](../type-aliases/RematchState.md) = `state`

### requestRematch

> **requestRematch**: () => `void`

#### Returns

`void`
