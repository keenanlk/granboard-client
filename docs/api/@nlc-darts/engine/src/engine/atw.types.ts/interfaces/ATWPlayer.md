[**Documentation**](../../../../../../README.md)

---

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/engine/atw.types.ts](../README.md) / ATWPlayer

# Interface: ATWPlayer

Defined in: [engine/atw.types.ts:43](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L43)

A player's state in an Around the World game.

## Properties

### currentTarget

> **currentTarget**: `number`

Defined in: [engine/atw.types.ts:48](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L48)

The current target number (1-20 or 25 for Bull)

---

### finished

> **finished**: `boolean`

Defined in: [engine/atw.types.ts:49](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L49)

---

### finishedInRound

> **finishedInRound**: `number` \| `null`

Defined in: [engine/atw.types.ts:51](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L51)

The round in which this player finished (null if not finished)

---

### name

> **name**: `string`

Defined in: [engine/atw.types.ts:44](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L44)

---

### rounds

> **rounds**: [`ATWRound`](ATWRound.md)[]

Defined in: [engine/atw.types.ts:52](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L52)

---

### targetIndex

> **targetIndex**: `number`

Defined in: [engine/atw.types.ts:46](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L46)

0-20 = in progress, 21 = finished

---

### totalDartsThrown

> **totalDartsThrown**: `number`

Defined in: [engine/atw.types.ts:53](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L53)
