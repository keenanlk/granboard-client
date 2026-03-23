[**Documentation**](../../../../../../README.md)

---

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/board/BoardGeometry.ts](../README.md) / segmentCenter

# Function: segmentCenter()

> **segmentCenter**(`segmentId`): `object`

Defined in: [board/BoardGeometry.ts:44](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/board/BoardGeometry.ts#L44)

Returns the (x, y) center of a segment in mm, origin at bull center.
Coordinate system: x = right, y = up, θ = clockwise from top.
x = r·sin(θ), y = r·cos(θ)

Used by the throw simulator as the "aim point" before Gaussian noise is applied.

## Parameters

### segmentId

[`SegmentID`](../../Dartboard.ts/type-aliases/SegmentID.md)

## Returns

`object`

### x

> **x**: `number`

### y

> **y**: `number`
