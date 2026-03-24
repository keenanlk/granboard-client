[**Documentation**](../../../README.md)

---

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / GameStoreActions

# Interface: GameStoreActions\<TState, TOptions\>

Defined in: [store/createGameStore.ts:7](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/store/createGameStore.ts#L7)

Standard actions available on every game store.

## Type Parameters

### TState

`TState`

### TOptions

`TOptions`

## Properties

### addDart

> **addDart**: (`segment`) => `void`

Defined in: [store/createGameStore.ts:9](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/store/createGameStore.ts#L9)

#### Parameters

##### segment

[`Segment`](../../engine/src/board/Dartboard.ts/interfaces/Segment.md)

#### Returns

`void`

---

### getSerializableState

> **getSerializableState**: () => `TState` & `object`

Defined in: [store/createGameStore.ts:13](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/store/createGameStore.ts#L13)

#### Returns

`TState` & `object`

---

### nextTurn

> **nextTurn**: () => `void`

Defined in: [store/createGameStore.ts:11](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/store/createGameStore.ts#L11)

#### Returns

`void`

---

### resetGame

> **resetGame**: () => `void`

Defined in: [store/createGameStore.ts:12](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/store/createGameStore.ts#L12)

#### Returns

`void`

---

### restoreState

> **restoreState**: (`saved`) => `void`

Defined in: [store/createGameStore.ts:14](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/store/createGameStore.ts#L14)

#### Parameters

##### saved

`TState` & `object`

#### Returns

`void`

---

### startGame

> **startGame**: (`options`, `playerNames`) => `void`

Defined in: [store/createGameStore.ts:8](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/store/createGameStore.ts#L8)

#### Parameters

##### options

`TOptions`

##### playerNames

`string`[]

#### Returns

`void`

---

### undoLastDart

> **undoLastDart**: () => `void`

Defined in: [store/createGameStore.ts:10](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/store/createGameStore.ts#L10)

#### Returns

`void`
