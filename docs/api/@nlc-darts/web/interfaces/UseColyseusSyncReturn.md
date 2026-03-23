[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / UseColyseusSyncReturn

# Interface: UseColyseusSyncReturn

Defined in: [hooks/useColyseusSync.ts:42](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useColyseusSync.ts#L42)

Return value from the [useColyseusSync](../functions/useColyseusSync.md) hook.

## Properties

### isOnline

> **isOnline**: `boolean`

Defined in: [hooks/useColyseusSync.ts:47](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useColyseusSync.ts#L47)

***

### room

> **room**: `Room`\<`any`\> \| `null`

Defined in: [hooks/useColyseusSync.ts:43](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useColyseusSync.ts#L43)

***

### sendDart

> **sendDart**: (`segmentId`) => `void`

Defined in: [hooks/useColyseusSync.ts:44](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useColyseusSync.ts#L44)

#### Parameters

##### segmentId

`number`

#### Returns

`void`

***

### sendNextTurn

> **sendNextTurn**: () => `void`

Defined in: [hooks/useColyseusSync.ts:45](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useColyseusSync.ts#L45)

#### Returns

`void`

***

### sendUndo

> **sendUndo**: () => `void`

Defined in: [hooks/useColyseusSync.ts:46](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useColyseusSync.ts#L46)

#### Returns

`void`
