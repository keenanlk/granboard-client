[**Documentation**](../../../README.md)

---

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / X01Controller

# Class: X01Controller

Defined in: [controllers/X01Controller.ts:10](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/controllers/X01Controller.ts#L10)

Controller for X01 (301/501/etc.) game mode.

## Implements

- [`GameController`](../interfaces/GameController.md)

## Constructors

### Constructor

> **new X01Controller**(): `X01Controller`

#### Returns

`X01Controller`

## Methods

### onDartHit()

> **onDartHit**(`segment`): `void`

Defined in: [controllers/X01Controller.ts:11](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/controllers/X01Controller.ts#L11)

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

Defined in: [controllers/X01Controller.ts:32](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/controllers/X01Controller.ts#L32)

Advance to the next player's turn.

#### Returns

`void`

#### Implementation of

[`GameController`](../interfaces/GameController.md).[`onNextTurn`](../interfaces/GameController.md#onnextturn)
