[**Documentation**](../../../../../../README.md)

---

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/engine/x01.types.ts](../README.md) / Player

# Interface: Player

Defined in: [engine/x01.types.ts:33](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L33)

A player's state in an X01 game.

## Properties

### name

> **name**: `string`

Defined in: [engine/x01.types.ts:34](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L34)

---

### opened

> **opened**: `boolean`

Defined in: [engine/x01.types.ts:37](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L37)

For double-in: whether the player has opened by hitting a double. Always true if doubleIn=false.

---

### rounds

> **rounds**: `object`[]

Defined in: [engine/x01.types.ts:38](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L38)

#### darts

> **darts**: `object`[]

#### openedBefore

> **openedBefore**: `boolean`

Player's opened state at the START of this round — used to restore on cross-turn undo.

#### score

> **score**: `number`

---

### score

> **score**: `number`

Defined in: [engine/x01.types.ts:35](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L35)

---

### totalDartsThrown

> **totalDartsThrown**: `number`

Defined in: [engine/x01.types.ts:45](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L45)

Total darts thrown this game (all darts, including busts and double-in misses).
