[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / FullState

# Type Alias: FullState\<TState, TOptions\>

> **FullState**\<`TState`, `TOptions`\> = `TState` & `object` & [`GameStoreActions`](../interfaces/GameStoreActions.md)\<`TState`, `TOptions`\>

Defined in: [store/createGameStore.ts:18](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/store/createGameStore.ts#L18)

Full Zustand store state: game state + undo stack + standard actions.

## Type Declaration

### undoStack

> **undoStack**: `TState`[]

## Type Parameters

### TState

`TState`

### TOptions

`TOptions`
