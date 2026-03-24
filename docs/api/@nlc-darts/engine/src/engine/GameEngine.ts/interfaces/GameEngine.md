[**Documentation**](../../../../../../README.md)

***

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/engine/GameEngine.ts](../README.md) / GameEngine

# Interface: GameEngine\<TState, TOptions\>

Defined in: [engine/GameEngine.ts:15](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/GameEngine.ts#L15)

Contract every game engine must implement.

All methods are pure — they take state + inputs and return the fields that
changed, with zero side effects. This makes engines:
  - Fully testable without React or Zustand
  - Safe to run server-side for multiplayer
  - Replayable: any game can be reconstructed by replaying dart events

## Type Parameters

### TState

`TState`

The game-specific state shape (data only, no actions).

### TOptions

`TOptions`

The game-specific options/config shape.

## Methods

### addDart()

> **addDart**(`state`, `segment`): `Partial`\<`TState`\>

Defined in: [engine/GameEngine.ts:20](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/GameEngine.ts#L20)

Apply a dart throw. Returns only the fields that changed.

#### Parameters

##### state

`TState`

##### segment

[`Segment`](../../../board/Dartboard.ts/interfaces/Segment.md)

#### Returns

`Partial`\<`TState`\>

***

### nextTurn()

> **nextTurn**(`state`): `Partial`\<`TState`\>

Defined in: [engine/GameEngine.ts:26](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/GameEngine.ts#L26)

Commit the current player's turn and advance to the next player. Returns only the fields that changed.

#### Parameters

##### state

`TState`

#### Returns

`Partial`\<`TState`\>

***

### startGame()

> **startGame**(`options`, `playerNames`): `TState`

Defined in: [engine/GameEngine.ts:17](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/GameEngine.ts#L17)

Create fresh initial state for a new game.

#### Parameters

##### options

`TOptions`

##### playerNames

`string`[]

#### Returns

`TState`

***

### undoLastDart()

> **undoLastDart**(`state`): `Partial`\<`TState`\>

Defined in: [engine/GameEngine.ts:23](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/GameEngine.ts#L23)

Reverse the last dart thrown in the current turn. Returns only the fields that changed.

#### Parameters

##### state

`TState`

#### Returns

`Partial`\<`TState`\>
