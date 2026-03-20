[**Documentation**](../../../../../../README.md)

***

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/board/Dartboard.ts](../README.md) / SegmentTypeToString

# Function: SegmentTypeToString()

> **SegmentTypeToString**(`type`, `shorthand`): `""` \| `"D"` \| `"Double"` \| `"T"` \| `"Triple"`

Defined in: [board/Dartboard.ts:148](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/board/Dartboard.ts#L148)

Converts a segment type to its display string.

## Parameters

### type

[`SegmentType`](../type-aliases/SegmentType.md)

The segment type (Single, Double, Triple).

### shorthand

`boolean`

If true, returns "D"/"T"; otherwise "Double"/"Triple".

## Returns

`""` \| `"D"` \| `"Double"` \| `"T"` \| `"Triple"`

The display string, or empty string for singles.
