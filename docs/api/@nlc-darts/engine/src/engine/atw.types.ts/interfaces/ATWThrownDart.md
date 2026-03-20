[**Documentation**](../../../../../../README.md)

***

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/engine/atw.types.ts](../README.md) / ATWThrownDart

# Interface: ATWThrownDart

Defined in: [engine/atw.types.ts:25](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L25)

A single dart thrown during an Around the World game.

## Properties

### advanced

> **advanced**: `number`

Defined in: [engine/atw.types.ts:30](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L30)

Number of positions advanced (0 if miss)

***

### hit

> **hit**: `boolean`

Defined in: [engine/atw.types.ts:28](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L28)

true if the dart hit the current target

***

### previousTargetIndex

> **previousTargetIndex**: `number`

Defined in: [engine/atw.types.ts:32](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L32)

targetIndex before this dart was thrown (for undo)

***

### segment

> **segment**: [`Segment`](../../../board/Dartboard.ts/interfaces/Segment.md)

Defined in: [engine/atw.types.ts:26](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/atw.types.ts#L26)
