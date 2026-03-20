[**Documentation**](../../../../../../README.md)

***

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/engine/atwEngine.ts](../README.md) / ATWEngine

# Class: ATWEngine

Defined in: [engine/atwEngine.ts:86](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atwEngine.ts#L86)

Game engine for Around the World (ATW) mode implementing the GameEngine interface.

## Implements

- [`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md)\<[`ATWState`](../../atw.types.ts/interfaces/ATWState.md), [`ATWOptions`](../../atw.types.ts/interfaces/ATWOptions.md)\>

## Constructors

### Constructor

> **new ATWEngine**(): `ATWEngine`

#### Returns

`ATWEngine`

## Methods

### addDart()

> **addDart**(`state`, `segment`): `Partial`\<[`ATWState`](../../atw.types.ts/interfaces/ATWState.md)\>

Defined in: [engine/atwEngine.ts:107](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atwEngine.ts#L107)

Apply a dart throw. Returns only the fields that changed.

#### Parameters

##### state

[`ATWState`](../../atw.types.ts/interfaces/ATWState.md)

##### segment

[`Segment`](../../../board/Dartboard.ts/interfaces/Segment.md)

#### Returns

`Partial`\<[`ATWState`](../../atw.types.ts/interfaces/ATWState.md)\>

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`addDart`](../../GameEngine.ts/interfaces/GameEngine.md#adddart)

***

### nextTurn()

> **nextTurn**(`state`): `Partial`\<[`ATWState`](../../atw.types.ts/interfaces/ATWState.md)\>

Defined in: [engine/atwEngine.ts:201](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atwEngine.ts#L201)

Commit the current player's turn and advance to the next player. Returns only the fields that changed.

#### Parameters

##### state

[`ATWState`](../../atw.types.ts/interfaces/ATWState.md)

#### Returns

`Partial`\<[`ATWState`](../../atw.types.ts/interfaces/ATWState.md)\>

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`nextTurn`](../../GameEngine.ts/interfaces/GameEngine.md#nextturn)

***

### startGame()

> **startGame**(`options`, `playerNames`): [`ATWState`](../../atw.types.ts/interfaces/ATWState.md)

Defined in: [engine/atwEngine.ts:87](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atwEngine.ts#L87)

Create fresh initial state for a new game.

#### Parameters

##### options

[`ATWOptions`](../../atw.types.ts/interfaces/ATWOptions.md)

##### playerNames

`string`[]

#### Returns

[`ATWState`](../../atw.types.ts/interfaces/ATWState.md)

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`startGame`](../../GameEngine.ts/interfaces/GameEngine.md#startgame)

***

### undoLastDart()

> **undoLastDart**(`state`): `Partial`\<[`ATWState`](../../atw.types.ts/interfaces/ATWState.md)\>

Defined in: [engine/atwEngine.ts:162](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atwEngine.ts#L162)

Reverse the last dart thrown in the current turn. Returns only the fields that changed.

#### Parameters

##### state

[`ATWState`](../../atw.types.ts/interfaces/ATWState.md)

#### Returns

`Partial`\<[`ATWState`](../../atw.types.ts/interfaces/ATWState.md)\>

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`undoLastDart`](../../GameEngine.ts/interfaces/GameEngine.md#undolastdart)
