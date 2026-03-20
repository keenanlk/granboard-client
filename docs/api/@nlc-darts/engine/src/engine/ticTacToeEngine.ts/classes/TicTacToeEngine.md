[**Documentation**](../../../../../../README.md)

***

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/engine/ticTacToeEngine.ts](../README.md) / TicTacToeEngine

# Class: TicTacToeEngine

Defined in: [engine/ticTacToeEngine.ts:105](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/ticTacToeEngine.ts#L105)

Game engine for Tic-Tac-Toe darts mode implementing the GameEngine interface.

## Implements

- [`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md)\<[`TicTacToeState`](../../ticTacToe.types.ts/interfaces/TicTacToeState.md), [`TicTacToeOptions`](../../ticTacToe.types.ts/interfaces/TicTacToeOptions.md)\>

## Constructors

### Constructor

> **new TicTacToeEngine**(): `TicTacToeEngine`

#### Returns

`TicTacToeEngine`

## Methods

### addDart()

> **addDart**(`state`, `segment`): `Partial`\<[`TicTacToeState`](../../ticTacToe.types.ts/interfaces/TicTacToeState.md)\>

Defined in: [engine/ticTacToeEngine.ts:129](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/ticTacToeEngine.ts#L129)

Apply a dart throw. Returns only the fields that changed.

#### Parameters

##### state

[`TicTacToeState`](../../ticTacToe.types.ts/interfaces/TicTacToeState.md)

##### segment

[`Segment`](../../../board/Dartboard.ts/interfaces/Segment.md)

#### Returns

`Partial`\<[`TicTacToeState`](../../ticTacToe.types.ts/interfaces/TicTacToeState.md)\>

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`addDart`](../../GameEngine.ts/interfaces/GameEngine.md#adddart)

***

### nextTurn()

> **nextTurn**(`state`): `Partial`\<[`TicTacToeState`](../../ticTacToe.types.ts/interfaces/TicTacToeState.md)\>

Defined in: [engine/ticTacToeEngine.ts:240](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/ticTacToeEngine.ts#L240)

Commit the current player's turn and advance to the next player. Returns only the fields that changed.

#### Parameters

##### state

[`TicTacToeState`](../../ticTacToe.types.ts/interfaces/TicTacToeState.md)

#### Returns

`Partial`\<[`TicTacToeState`](../../ticTacToe.types.ts/interfaces/TicTacToeState.md)\>

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`nextTurn`](../../GameEngine.ts/interfaces/GameEngine.md#nextturn)

***

### startGame()

> **startGame**(`options`, `playerNames`): [`TicTacToeState`](../../ticTacToe.types.ts/interfaces/TicTacToeState.md)

Defined in: [engine/ticTacToeEngine.ts:109](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/ticTacToeEngine.ts#L109)

Create fresh initial state for a new game.

#### Parameters

##### options

[`TicTacToeOptions`](../../ticTacToe.types.ts/interfaces/TicTacToeOptions.md)

##### playerNames

`string`[]

#### Returns

[`TicTacToeState`](../../ticTacToe.types.ts/interfaces/TicTacToeState.md)

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`startGame`](../../GameEngine.ts/interfaces/GameEngine.md#startgame)

***

### undoLastDart()

> **undoLastDart**(`state`): `Partial`\<[`TicTacToeState`](../../ticTacToe.types.ts/interfaces/TicTacToeState.md)\>

Defined in: [engine/ticTacToeEngine.ts:199](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/ticTacToeEngine.ts#L199)

Reverse the last dart thrown in the current turn. Returns only the fields that changed.

#### Parameters

##### state

[`TicTacToeState`](../../ticTacToe.types.ts/interfaces/TicTacToeState.md)

#### Returns

`Partial`\<[`TicTacToeState`](../../ticTacToe.types.ts/interfaces/TicTacToeState.md)\>

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`undoLastDart`](../../GameEngine.ts/interfaces/GameEngine.md#undolastdart)
