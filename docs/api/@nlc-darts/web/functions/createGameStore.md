[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / createGameStore

# Function: createGameStore()

> **createGameStore**\<`TState`, `TOptions`\>(`engine`, `defaultState`): `UseBoundStore`\<`StoreApi`\<`FullState`\>\>

Defined in: [store/createGameStore.ts:23](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/store/createGameStore.ts#L23)

Creates a Zustand game store wired to a GameEngine.

Handles undo stack, serialization, and all standard game actions so that
individual stores only need to supply their engine + default state.

## Type Parameters

### TState

`TState` *extends* `object`

### TOptions

`TOptions`

## Parameters

### engine

[`GameEngine`](../../engine/src/engine/GameEngine.ts/interfaces/GameEngine.md)\<`TState`, `TOptions`\>

### defaultState

`TState`

## Returns

`UseBoundStore`\<`StoreApi`\<`FullState`\>\>
