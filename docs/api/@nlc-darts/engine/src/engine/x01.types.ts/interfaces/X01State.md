[**Documentation**](../../../../../../README.md)

---

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/engine/x01.types.ts](../README.md) / X01State

# Interface: X01State

Defined in: [engine/x01.types.ts:49](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L49)

Complete mutable state for an X01 game in progress.

## Properties

### currentPlayerIndex

> **currentPlayerIndex**: `number`

Defined in: [engine/x01.types.ts:52](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L52)

---

### currentRoundDarts

> **currentRoundDarts**: [`ThrownDart`](ThrownDart.md)[]

Defined in: [engine/x01.types.ts:53](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L53)

---

### isBust

> **isBust**: `boolean`

Defined in: [engine/x01.types.ts:58](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L58)

---

### players

> **players**: [`Player`](Player.md)[]

Defined in: [engine/x01.types.ts:51](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L51)

---

### turnStartOpened

> **turnStartOpened**: `boolean`[]

Defined in: [engine/x01.types.ts:57](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L57)

Opened state of each player at the start of the current turn — used for undo.

---

### turnStartScores

> **turnStartScores**: `number`[]

Defined in: [engine/x01.types.ts:55](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L55)

Score of each player at the start of the current turn — used to reset on bust.

---

### winner

> **winner**: `string` \| `null`

Defined in: [engine/x01.types.ts:59](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L59)

---

### x01Options

> **x01Options**: [`X01Options`](X01Options.md)

Defined in: [engine/x01.types.ts:50](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L50)
