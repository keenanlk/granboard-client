[**Documentation**](../../../../../../README.md)

---

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/bot/x01Strategy.ts](../README.md) / x01PickTarget

# Function: x01PickTarget()

> **x01PickTarget**(`score`, `opts`, `opened`): [`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)

Defined in: [bot/x01Strategy.ts:42](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/bot/x01Strategy.ts#L42)

X01 targeting strategy: chooses the best SegmentID for a bot to aim at given the current score.

Decision rules (evaluated in order):

1. doubleIn + not yet opened → must hit a double first → aim DBL_20.
2. Single out + split bull off → look up the outchart (optimal soft-tip checkout path).
   Gaps in the chart (unreachable 3-dart scores like 179) fall back to aiming bull.
   Scores ≤ 40 fall through to Rule 6 when not in the chart.
3. score = 50 → aim DBL_BULL (doubleOut/masterOut bull finish).
4. masterOut and score ≤ 60 and score divisible by 3 → aim TRP\_(score/3).
5. doubleOut or masterOut, score ≤ 40 and even → aim DBL\_(score/2).
6. doubleOut or masterOut, score ≤ 40 and odd → aim OUTER_1 (leaves even finish).
7. Standard out endgame for small scores (split bull on, or chart miss ≤ 40).
8. Default: aim bull when split bull off (larger combined target), T20 when on.

## Parameters

### score

`number`

### opts

[`X01Options`](../../../engine/x01.types.ts/interfaces/X01Options.md)

### opened

`boolean`

## Returns

[`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)
