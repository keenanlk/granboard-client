[**Documentation**](../../../README.md)

---

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / GameController

# Interface: GameController

Defined in: [controllers/GameController.ts:4](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/controllers/GameController.ts#L4)

Common interface implemented by all game-mode controllers.

## Methods

### onDartHit()

> **onDartHit**(`segment`): `void`

Defined in: [controllers/GameController.ts:6](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/controllers/GameController.ts#L6)

Handle a dart landing on a board segment.

#### Parameters

##### segment

[`Segment`](../../engine/src/board/Dartboard.ts/interfaces/Segment.md)

#### Returns

`void`

---

### onNextTurn()

> **onNextTurn**(): `void`

Defined in: [controllers/GameController.ts:8](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/controllers/GameController.ts#L8)

Advance to the next player's turn.

#### Returns

`void`
