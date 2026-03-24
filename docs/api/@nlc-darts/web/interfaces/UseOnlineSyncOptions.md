[**Documentation**](../../../README.md)

---

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / UseOnlineSyncOptions

# Interface: UseOnlineSyncOptions

Defined in: [hooks/useOnlineSync.ts:21](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useOnlineSync.ts#L21)

Options for the [useOnlineSync](../functions/useOnlineSync.md) hook.

## Properties

### getSerializableState

> **getSerializableState**: () => `unknown`

Defined in: [hooks/useOnlineSync.ts:24](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useOnlineSync.ts#L24)

#### Returns

`unknown`

---

### onGameEnded?

> `optional` **onGameEnded?**: (`winners`) => `void`

Defined in: [hooks/useOnlineSync.ts:29](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useOnlineSync.ts#L29)

#### Parameters

##### winners

`string`[]

#### Returns

`void`

---

### onlineConfig

> **onlineConfig**: [`OnlineConfig`](OnlineConfig.md) \| `null` \| `undefined`

Defined in: [hooks/useOnlineSync.ts:23](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useOnlineSync.ts#L23)

Pass null/undefined for offline games — hook becomes a no-op

---

### onOpponentDisconnected?

> `optional` **onOpponentDisconnected?**: () => `void`

Defined in: [hooks/useOnlineSync.ts:30](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useOnlineSync.ts#L30)

#### Returns

`void`

---

### onRemoteDartHit?

> `optional` **onRemoteDartHit?**: (`segment`) => `void`

Defined in: [hooks/useOnlineSync.ts:26](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useOnlineSync.ts#L26)

#### Parameters

##### segment

[`Segment`](../../engine/src/board/Dartboard.ts/interfaces/Segment.md)

#### Returns

`void`

---

### onRemoteNextTurn?

> `optional` **onRemoteNextTurn?**: () => `void`

Defined in: [hooks/useOnlineSync.ts:28](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useOnlineSync.ts#L28)

#### Returns

`void`

---

### onRemoteUndo?

> `optional` **onRemoteUndo?**: () => `void`

Defined in: [hooks/useOnlineSync.ts:27](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useOnlineSync.ts#L27)

#### Returns

`void`

---

### onTurnDelay?

> `optional` **onTurnDelay?**: () => `void`

Defined in: [hooks/useOnlineSync.ts:32](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useOnlineSync.ts#L32)

Remote: called when host starts the between-turn delay

#### Returns

`void`

---

### restoreState

> **restoreState**: (`state`) => `void`

Defined in: [hooks/useOnlineSync.ts:25](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useOnlineSync.ts#L25)

#### Parameters

##### state

`unknown`

#### Returns

`void`
