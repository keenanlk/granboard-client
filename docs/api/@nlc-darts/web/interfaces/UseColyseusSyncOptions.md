[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / UseColyseusSyncOptions

# Interface: UseColyseusSyncOptions

Defined in: [hooks/useColyseusSync.ts:33](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useColyseusSync.ts#L33)

Options for the [useColyseusSync](../functions/useColyseusSync.md) hook.

## Properties

### onGameEnded?

> `optional` **onGameEnded?**: (`winner`) => `void`

Defined in: [hooks/useColyseusSync.ts:36](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useColyseusSync.ts#L36)

#### Parameters

##### winner

`string`

#### Returns

`void`

***

### onlineConfig

> **onlineConfig**: [`OnlineConfig`](OnlineConfig.md) \| `null` \| `undefined`

Defined in: [hooks/useColyseusSync.ts:34](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useColyseusSync.ts#L34)

***

### onOpponentDisconnected?

> `optional` **onOpponentDisconnected?**: () => `void`

Defined in: [hooks/useColyseusSync.ts:37](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useColyseusSync.ts#L37)

#### Returns

`void`

***

### onTurnDelay?

> `optional` **onTurnDelay?**: () => `void`

Defined in: [hooks/useColyseusSync.ts:38](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useColyseusSync.ts#L38)

#### Returns

`void`

***

### restoreState

> **restoreState**: (`state`) => `void`

Defined in: [hooks/useColyseusSync.ts:35](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useColyseusSync.ts#L35)

#### Parameters

##### state

`unknown`

#### Returns

`void`
