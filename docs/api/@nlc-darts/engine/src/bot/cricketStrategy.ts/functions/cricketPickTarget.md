[**Documentation**](../../../../../../README.md)

---

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/bot/cricketStrategy.ts](../README.md) / cricketPickTarget

# Function: cricketPickTarget()

> **cricketPickTarget**(`myMarks`, `allPlayers`, `myIndex`, `cutThroat?`): [`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)

Defined in: [bot/cricketStrategy.ts:120](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/bot/cricketStrategy.ts#L120)

Cricket targeting strategy with three game-state modes.

Catch-up mode (behind ≥40): prioritise scoring on numbers I already own
Race mode (score close): balanced — close high numbers, deny threats
Lockdown mode (ahead ≥25): deny opponent comeback lanes aggressively

For each candidate target a weighted score is computed combining:

- scoringValue: points I can earn per dart right now
- closureValue: marks still needed to close (progress + eventual scoring)
- denialValue: urgency of shutting down opponent's scoring lane

The highest-scoring candidate wins.

## Parameters

### myMarks

`Record`\<[`CricketTarget`](../../../engine/cricket.types.ts/type-aliases/CricketTarget.md), `number`\>

### allPlayers

[`CricketPlayer`](../../../engine/cricket.types.ts/interfaces/CricketPlayer.md)[]

### myIndex

`number`

### cutThroat?

`boolean`

## Returns

[`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)
