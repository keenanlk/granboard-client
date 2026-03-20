[**Documentation**](../../../../../../README.md)

***

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/board/BoardGeometry.ts](../README.md) / coordToSegmentId

# Function: coordToSegmentId()

> **coordToSegmentId**(`x`, `y`): [`SegmentID`](../../Dartboard.ts/type-aliases/SegmentID.md)

Defined in: [board/BoardGeometry.ts:75](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/board/BoardGeometry.ts#L75)

Maps an (x, y) board coordinate (mm, origin at bull center) to the SegmentID it lands on.
Uses clockwise-from-top angle: θ = atan2(x, y).
Ring boundaries follow BDO/WDF spec.

## Parameters

### x

`number`

### y

`number`

## Returns

[`SegmentID`](../../Dartboard.ts/type-aliases/SegmentID.md)
