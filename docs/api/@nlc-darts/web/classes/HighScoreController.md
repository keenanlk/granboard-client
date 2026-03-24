[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / HighScoreController

# Class: HighScoreController

Defined in: [controllers/HighScoreController.ts:10](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/controllers/HighScoreController.ts#L10)

Controller for High Score game mode.

## Implements

- [`GameController`](../interfaces/GameController.md)

## Constructors

### Constructor

> **new HighScoreController**(): `HighScoreController`

#### Returns

`HighScoreController`

## Methods

### onDartHit()

> **onDartHit**(`segment`): `void`

Defined in: [controllers/HighScoreController.ts:11](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/controllers/HighScoreController.ts#L11)

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

Defined in: [controllers/HighScoreController.ts:17](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/controllers/HighScoreController.ts#L17)

Advance to the next player's turn.

#### Returns

`void`

#### Implementation of

[`GameController`](../interfaces/GameController.md).[`onNextTurn`](../interfaces/GameController.md#onnextturn)
