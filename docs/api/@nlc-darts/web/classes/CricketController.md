[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / CricketController

# Class: CricketController

Defined in: [controllers/CricketController.ts:19](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/apps/web/src/controllers/CricketController.ts#L19)

Controller for Cricket game mode.

## Implements

- [`GameController`](../interfaces/GameController.md)

## Constructors

### Constructor

> **new CricketController**(): `CricketController`

#### Returns

`CricketController`

## Methods

### onDartHit()

> **onDartHit**(`segment`): `void`

Defined in: [controllers/CricketController.ts:20](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/apps/web/src/controllers/CricketController.ts#L20)

Handle a dart landing on a board segment.

#### Parameters

##### segment

[`Segment`](../../engine/src/board/Dartboard.ts/interfaces/Segment.md)

#### Returns

`void`

#### Implementation of

[`GameController`](../interfaces/GameController.md).[`onDartHit`](../interfaces/GameController.md#ondarthit)

***

### onNextTurn()

> **onNextTurn**(): `void`

Defined in: [controllers/CricketController.ts:43](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/apps/web/src/controllers/CricketController.ts#L43)

Advance to the next player's turn.

#### Returns

`void`

#### Implementation of

[`GameController`](../interfaces/GameController.md).[`onNextTurn`](../interfaces/GameController.md#onnextturn)
