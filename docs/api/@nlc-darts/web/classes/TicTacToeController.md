[**Documentation**](../../../README.md)

---

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / TicTacToeController

# Class: TicTacToeController

Defined in: [controllers/TicTacToeController.ts:19](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/controllers/TicTacToeController.ts#L19)

Controller for Tic-Tac-Toe game mode.

## Implements

- [`GameController`](../interfaces/GameController.md)

## Constructors

### Constructor

> **new TicTacToeController**(): `TicTacToeController`

#### Returns

`TicTacToeController`

## Methods

### onDartHit()

> **onDartHit**(`segment`): `void`

Defined in: [controllers/TicTacToeController.ts:20](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/controllers/TicTacToeController.ts#L20)

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

Defined in: [controllers/TicTacToeController.ts:45](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/controllers/TicTacToeController.ts#L45)

Advance to the next player's turn.

#### Returns

`void`

#### Implementation of

[`GameController`](../interfaces/GameController.md).[`onNextTurn`](../interfaces/GameController.md#onnextturn)
