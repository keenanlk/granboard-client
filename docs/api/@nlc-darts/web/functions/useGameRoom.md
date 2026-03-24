[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / useGameRoom

# Function: useGameRoom()

> **useGameRoom**(`onlineConfig`, `callbacks?`): `object`

Defined in: [hooks/useGameRoom.ts:11](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useGameRoom.ts#L11)

Thin selector hook for game room state.
Replaces useColyseusSync + useOnlineRematch + useOnlineNextLeg.

## Parameters

### onlineConfig

[`OnlineConfig`](../interfaces/OnlineConfig.md) \| `null` \| `undefined`

### callbacks?

#### onGameEnded?

(`winner`) => `void`

#### onOpponentDisconnected?

() => `void`

#### onTurnDelay?

() => `void`

#### restoreState

(`state`) => `void`

## Returns

`object`

### acceptRematch

> **acceptRematch**: () => `void`

#### Returns

`void`

### colyseusPhase

> **colyseusPhase**: `ColyseusPhase`

### declineRematch

> **declineRematch**: () => `void`

#### Returns

`void`

### getRoom

> **getRoom**: () => `Room`\<`any`\> \| `null`

#### Returns

`Room`\<`any`\> \| `null`

### isHost

> **isHost**: `boolean`

### isOnline

> **isOnline**: `boolean` = `!!onlineConfig`

### nextLegPhase

> **nextLegPhase**: `NextLegPhase`

### rematchPhase

> **rematchPhase**: `RematchPhase`

### requestNextLeg

> **requestNextLeg**: () => `void`

#### Returns

`void`

### requestRematch

> **requestRematch**: () => `void`

#### Returns

`void`

### resetNextLeg

> **resetNextLeg**: () => `void`

#### Returns

`void`

### resetRematch

> **resetRematch**: () => `void`

#### Returns

`void`

### room

> **room**: `Room`\<`any`\> \| `null`

### roomPhase

> **roomPhase**: `RoomPhase`

### sendDart

> **sendDart**: (`segmentId`) => `void`

#### Parameters

##### segmentId

`number`

#### Returns

`void`

### sendNextTurn

> **sendNextTurn**: () => `void`

#### Returns

`void`

### sendUndo

> **sendUndo**: () => `void`

#### Returns

`void`
