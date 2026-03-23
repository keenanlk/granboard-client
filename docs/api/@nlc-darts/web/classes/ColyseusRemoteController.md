[**Documentation**](../../../README.md)

---

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / ColyseusRemoteController

# Class: ColyseusRemoteController

Defined in: [controllers/ColyseusRemoteController.ts:10](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/controllers/ColyseusRemoteController.ts#L10)

Controller used by BOTH players in online mode (host and guest).
With Colyseus, both players send actions to the server — the host's
only distinction is creating the room. The server owns all game state.

## Implements

- [`GameController`](../interfaces/GameController.md)

## Constructors

### Constructor

> **new ColyseusRemoteController**(`room`): `ColyseusRemoteController`

Defined in: [controllers/ColyseusRemoteController.ts:13](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/controllers/ColyseusRemoteController.ts#L13)

#### Parameters

##### room

`Room`

#### Returns

`ColyseusRemoteController`

## Methods

### onDartHit()

> **onDartHit**(`segment`): `void`

Defined in: [controllers/ColyseusRemoteController.ts:17](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/controllers/ColyseusRemoteController.ts#L17)

Handle a dart landing on a board segment.

#### Parameters

##### segment

[`Segment`](../../engine/src/board/Dartboard.ts/interfaces/Segment.md)

#### Returns

`void`

#### Implementation of

[`GameController`](../interfaces/GameController.md).[`onDartHit`](../interfaces/GameController.md#ondarthit)

---

### onNextTurn()

> **onNextTurn**(): `void`

Defined in: [controllers/ColyseusRemoteController.ts:21](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/controllers/ColyseusRemoteController.ts#L21)

Advance to the next player's turn.

#### Returns

`void`

#### Implementation of

[`GameController`](../interfaces/GameController.md).[`onNextTurn`](../interfaces/GameController.md#onnextturn)

---

### sendUndo()

> **sendUndo**(): `void`

Defined in: [controllers/ColyseusRemoteController.ts:25](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/controllers/ColyseusRemoteController.ts#L25)

#### Returns

`void`
