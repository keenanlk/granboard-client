[**Documentation**](../../../../../../README.md)

***

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/engine/cricket.types.ts](../README.md) / CricketThrownDart

# Interface: CricketThrownDart

Defined in: [engine/cricket.types.ts:26](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/cricket.types.ts#L26)

A single dart thrown during a Cricket game, with mark and scoring details.

## Properties

### effectiveMarks

> **effectiveMarks**: `number`

Defined in: [engine/cricket.types.ts:31](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/cricket.types.ts#L31)

***

### marksAdded

> **marksAdded**: `number`

Defined in: [engine/cricket.types.ts:29](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/cricket.types.ts#L29)

***

### marksEarned

> **marksEarned**: `number`

Defined in: [engine/cricket.types.ts:30](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/cricket.types.ts#L30)

***

### pointsDistributed?

> `optional` **pointsDistributed?**: `object`[]

Defined in: [engine/cricket.types.ts:34](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/cricket.types.ts#L34)

Cut-throat only: which opponents received points (for undo).

#### playerIndex

> **playerIndex**: `number`

#### points

> **points**: `number`

***

### pointsScored

> **pointsScored**: `number`

Defined in: [engine/cricket.types.ts:32](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/cricket.types.ts#L32)

***

### segment

> **segment**: [`Segment`](../../../board/Dartboard.ts/interfaces/Segment.md)

Defined in: [engine/cricket.types.ts:27](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/cricket.types.ts#L27)

***

### target

> **target**: `15` \| `16` \| `17` \| `18` \| `19` \| `20` \| `25` \| `null`

Defined in: [engine/cricket.types.ts:28](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/cricket.types.ts#L28)
