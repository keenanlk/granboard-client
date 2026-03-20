[**Documentation**](../../../../../../README.md)

***

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/engine/atw.types.ts](../README.md) / ATWState

# Interface: ATWState

Defined in: [engine/atw.types.ts:57](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L57)

Complete mutable state for an Around the World game in progress.

## Properties

### currentPlayerIndex

> **currentPlayerIndex**: `number`

Defined in: [engine/atw.types.ts:60](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L60)

***

### currentRound

> **currentRound**: `number`

Defined in: [engine/atw.types.ts:61](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L61)

***

### currentRoundDarts

> **currentRoundDarts**: [`ATWThrownDart`](ATWThrownDart.md)[]

Defined in: [engine/atw.types.ts:62](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L62)

***

### firstFinishRound

> **firstFinishRound**: `number` \| `null`

Defined in: [engine/atw.types.ts:66](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L66)

The round in which the first player finished

***

### options

> **options**: [`ATWOptions`](ATWOptions.md)

Defined in: [engine/atw.types.ts:58](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L58)

***

### players

> **players**: [`ATWPlayer`](ATWPlayer.md)[]

Defined in: [engine/atw.types.ts:59](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L59)

***

### winners

> **winners**: `string`[] \| `null`

Defined in: [engine/atw.types.ts:64](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L64)

null = game ongoing, string[] = winner name(s)
