[**Documentation**](../../../../../../README.md)

---

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/engine/x01Engine.ts](../README.md) / X01Engine

# Class: X01Engine

Defined in: [engine/x01Engine.ts:70](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01Engine.ts#L70)

Game engine for X01 (301/501/etc.) implementing the GameEngine interface.

## Implements

- [`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md)\<[`X01State`](../../x01.types.ts/interfaces/X01State.md), [`X01Options`](../../x01.types.ts/interfaces/X01Options.md)\>

## Constructors

### Constructor

> **new X01Engine**(): `X01Engine`

#### Returns

`X01Engine`

## Methods

### addDart()

> **addDart**(`state`, `segment`): `Partial`\<[`X01State`](../../x01.types.ts/interfaces/X01State.md)\>

Defined in: [engine/x01Engine.ts:90](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01Engine.ts#L90)

Apply a dart throw. Returns only the fields that changed.

#### Parameters

##### state

[`X01State`](../../x01.types.ts/interfaces/X01State.md)

##### segment

[`Segment`](../../../board/Dartboard.ts/interfaces/Segment.md)

#### Returns

`Partial`\<[`X01State`](../../x01.types.ts/interfaces/X01State.md)\>

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`addDart`](../../GameEngine.ts/interfaces/GameEngine.md#adddart)

---

### nextTurn()

> **nextTurn**(`state`): `Partial`\<[`X01State`](../../x01.types.ts/interfaces/X01State.md)\>

Defined in: [engine/x01Engine.ts:216](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01Engine.ts#L216)

Commit the current player's turn and advance to the next player. Returns only the fields that changed.

#### Parameters

##### state

[`X01State`](../../x01.types.ts/interfaces/X01State.md)

#### Returns

`Partial`\<[`X01State`](../../x01.types.ts/interfaces/X01State.md)\>

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`nextTurn`](../../GameEngine.ts/interfaces/GameEngine.md#nextturn)

---

### startGame()

> **startGame**(`options`, `playerNames`): [`X01State`](../../x01.types.ts/interfaces/X01State.md)

Defined in: [engine/x01Engine.ts:71](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01Engine.ts#L71)

Create fresh initial state for a new game.

#### Parameters

##### options

[`X01Options`](../../x01.types.ts/interfaces/X01Options.md)

##### playerNames

`string`[]

#### Returns

[`X01State`](../../x01.types.ts/interfaces/X01State.md)

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`startGame`](../../GameEngine.ts/interfaces/GameEngine.md#startgame)

---

### undoLastDart()

> **undoLastDart**(`state`): `Partial`\<[`X01State`](../../x01.types.ts/interfaces/X01State.md)\>

Defined in: [engine/x01Engine.ts:156](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01Engine.ts#L156)

Reverse the last dart thrown in the current turn. Returns only the fields that changed.

#### Parameters

##### state

[`X01State`](../../x01.types.ts/interfaces/X01State.md)

#### Returns

`Partial`\<[`X01State`](../../x01.types.ts/interfaces/X01State.md)\>

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`undoLastDart`](../../GameEngine.ts/interfaces/GameEngine.md#undolastdart)
