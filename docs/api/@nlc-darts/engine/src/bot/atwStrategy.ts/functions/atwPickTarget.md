[**Documentation**](../../../../../../README.md)

***

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/bot/atwStrategy.ts](../README.md) / atwPickTarget

# Function: atwPickTarget()

> **atwPickTarget**(`currentTarget`): [`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)

Defined in: [bot/atwStrategy.ts:9](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/bot/atwStrategy.ts#L9)

ATW targeting strategy: aim at the current target number.

For numbers 1-20, aim at the triple ring (best advancement per dart).
For bull (25), aim at double bull (inner bull).

## Parameters

### currentTarget

`number`

## Returns

[`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)
