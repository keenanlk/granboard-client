[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / dbGetSessionsForPlayer

# Function: dbGetSessionsForPlayer()

> **dbGetSessionsForPlayer**(`playerId`): `Promise`\<[`GameSessionRecord`](../../engine/src/db/db.types.ts/interfaces/GameSessionRecord.md)[]\>

Defined in: [db/db.ts:109](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/db/db.ts#L109)

Retrieve all game sessions that include the given player.

## Parameters

### playerId

`string`

Player record ID to filter by.

## Returns

`Promise`\<[`GameSessionRecord`](../../engine/src/db/db.types.ts/interfaces/GameSessionRecord.md)[]\>

Sessions ordered by play date.
