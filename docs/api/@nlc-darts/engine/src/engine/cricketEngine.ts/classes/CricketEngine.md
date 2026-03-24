[**Documentation**](../../../../../../README.md)

---

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/engine/cricketEngine.ts](../README.md) / CricketEngine

# Class: CricketEngine

Defined in: [engine/cricketEngine.ts:154](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/cricketEngine.ts#L154)

Game engine for Cricket (standard, cut-throat, and single-bull variants) implementing the GameEngine interface.

## Implements

- [`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md)\<[`CricketState`](../../cricket.types.ts/interfaces/CricketState.md), [`CricketOptions`](../../cricket.types.ts/interfaces/CricketOptions.md)\>

## Constructors

### Constructor

> **new CricketEngine**(): `CricketEngine`

#### Returns

`CricketEngine`

## Methods

### addDart()

> **addDart**(`state`, `segment`): `Partial`\<[`CricketState`](../../cricket.types.ts/interfaces/CricketState.md)\>

Defined in: [engine/cricketEngine.ts:173](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/cricketEngine.ts#L173)

Apply a dart throw. Returns only the fields that changed.

#### Parameters

##### state

[`CricketState`](../../cricket.types.ts/interfaces/CricketState.md)

##### segment

[`Segment`](../../../board/Dartboard.ts/interfaces/Segment.md)

#### Returns

`Partial`\<[`CricketState`](../../cricket.types.ts/interfaces/CricketState.md)\>

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`addDart`](../../GameEngine.ts/interfaces/GameEngine.md#adddart)

---

### nextTurn()

> **nextTurn**(`state`): `Partial`\<[`CricketState`](../../cricket.types.ts/interfaces/CricketState.md)\>

Defined in: [engine/cricketEngine.ts:287](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/cricketEngine.ts#L287)

Commit the current player's turn and advance to the next player. Returns only the fields that changed.

#### Parameters

##### state

[`CricketState`](../../cricket.types.ts/interfaces/CricketState.md)

#### Returns

`Partial`\<[`CricketState`](../../cricket.types.ts/interfaces/CricketState.md)\>

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`nextTurn`](../../GameEngine.ts/interfaces/GameEngine.md#nextturn)

---

### startGame()

> **startGame**(`options`, `playerNames`): [`CricketState`](../../cricket.types.ts/interfaces/CricketState.md)

Defined in: [engine/cricketEngine.ts:155](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/cricketEngine.ts#L155)

Create fresh initial state for a new game.

#### Parameters

##### options

[`CricketOptions`](../../cricket.types.ts/interfaces/CricketOptions.md)

##### playerNames

`string`[]

#### Returns

[`CricketState`](../../cricket.types.ts/interfaces/CricketState.md)

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`startGame`](../../GameEngine.ts/interfaces/GameEngine.md#startgame)

---

### undoLastDart()

> **undoLastDart**(`state`): `Partial`\<[`CricketState`](../../cricket.types.ts/interfaces/CricketState.md)\>

Defined in: [engine/cricketEngine.ts:248](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/cricketEngine.ts#L248)

Reverse the last dart thrown in the current turn. Returns only the fields that changed.

#### Parameters

##### state

[`CricketState`](../../cricket.types.ts/interfaces/CricketState.md)

#### Returns

`Partial`\<[`CricketState`](../../cricket.types.ts/interfaces/CricketState.md)\>

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`undoLastDart`](../../GameEngine.ts/interfaces/GameEngine.md#undolastdart)
