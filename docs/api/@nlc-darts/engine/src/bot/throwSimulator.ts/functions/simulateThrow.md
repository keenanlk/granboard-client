[**Documentation**](../../../../../../README.md)

---

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/bot/throwSimulator.ts](../README.md) / simulateThrow

# Function: simulateThrow()

> **simulateThrow**(`targetId`, `sigma`): [`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)

Defined in: [bot/throwSimulator.ts:25](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/bot/throwSimulator.ts#L25)

Simulates a single dart throw aimed at `targetId` with `sigma` mm standard deviation.

Steps:

1. Look up the physical (x, y) center of the target segment in mm.
2. Add independent Gaussian noise N(0, σ²) to x and y — models hand tremor and release variation.
3. Convert the resulting board coordinate back to a SegmentID.

Returns the SegmentID where the dart actually lands (may differ from the target).

## Parameters

### targetId

[`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)

### sigma

`number`

## Returns

[`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)
