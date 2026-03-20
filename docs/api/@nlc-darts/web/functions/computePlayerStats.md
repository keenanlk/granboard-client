[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / computePlayerStats

# Function: computePlayerStats()

> **computePlayerStats**(`sessions`, `playerId`): [`PlayerStats`](../../engine/src/db/db.types.ts/interfaces/PlayerStats.md)

Defined in: [db/playerStats.ts:10](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/apps/web/src/db/playerStats.ts#L10)

Compute aggregate stats for a player across all their recorded sessions.

## Parameters

### sessions

[`GameSessionRecord`](../../engine/src/db/db.types.ts/interfaces/GameSessionRecord.md)[]

Game session records to aggregate.

### playerId

`string`

The player to compute stats for.

## Returns

[`PlayerStats`](../../engine/src/db/db.types.ts/interfaces/PlayerStats.md)

Aggregated stats broken down by game type.
