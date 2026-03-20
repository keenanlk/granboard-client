[**Documentation**](../../../../../../README.md)

***

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/bot/x01OutChart.ts](../README.md) / SINGLE\_OUT\_CHART

# Variable: SINGLE\_OUT\_CHART

> `const` **SINGLE\_OUT\_CHART**: `Partial`\<`Record`\<`number`, [`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)\>\>

Defined in: [bot/x01OutChart.ts:24](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/bot/x01OutChart.ts#L24)

First-dart target for every reachable checkout in soft-tip X01 single-out (any out)
with split bull OFF (both bull zones score 50).

B  = Bull  — aim DBL_BULL (centre); either zone scores 50 when split bull is off
T# = Triple of that number
S# = Outer single of that number

Scores not present (179, 178, 176, …) have no valid checkout path within 3 darts.
The strategy falls back to aiming bull for those gaps.

The bot re-evaluates this table on every dart, so only the first-dart target is
stored here — intermediate scores after a hit also have entries in this table.

Source: '01 Out Chart — Soft-Tip Single Out (split bull off)
