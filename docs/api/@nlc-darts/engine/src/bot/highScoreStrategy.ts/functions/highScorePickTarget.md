[**Documentation**](../../../../../../README.md)

***

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/bot/highScoreStrategy.ts](../README.md) / highScorePickTarget

# Function: highScorePickTarget()

> **highScorePickTarget**(`splitBull`): [`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)

Defined in: [bot/highScoreStrategy.ts:11](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/bot/highScoreStrategy.ts#L11)

High Score targeting strategy: aim for the highest expected-value segment.

When splitBull is OFF both bull zones score 50, making the combined bull area
a larger target than the triple-20 ring — so aiming bull has better expected
value on soft-tip boards.  When splitBull is ON the outer bull only scores 25,
making TRP_20 (60 pts) the better default.

## Parameters

### splitBull

`boolean`

## Returns

[`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)
