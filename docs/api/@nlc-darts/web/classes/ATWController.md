[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / ATWController

# Class: ATWController

Defined in: [controllers/ATWController.ts:23](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/apps/web/src/controllers/ATWController.ts#L23)

Controller for Around the World game mode.

## Implements

- [`GameController`](../interfaces/GameController.md)

## Constructors

### Constructor

> **new ATWController**(): `ATWController`

#### Returns

`ATWController`

## Methods

### onDartHit()

> **onDartHit**(`segment`): `void`

Defined in: [controllers/ATWController.ts:24](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/apps/web/src/controllers/ATWController.ts#L24)

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

Defined in: [controllers/ATWController.ts:49](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/apps/web/src/controllers/ATWController.ts#L49)

Advance to the next player's turn.

#### Returns

`void`

#### Implementation of

[`GameController`](../interfaces/GameController.md).[`onNextTurn`](../interfaces/GameController.md#onnextturn)
