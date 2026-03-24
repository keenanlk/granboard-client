[**Documentation**](../../../../../../README.md)

***

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/db/db.types.ts](../README.md) / GameSessionRecord

# Interface: GameSessionRecord

Defined in: [db/db.types.ts:27](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/db/db.types.ts#L27)

A complete persisted game session with participants and round history.

## Properties

### gameType

> **gameType**: `"x01"` \| `"cricket"` \| `"highscore"` \| `"atw"` \| `"tictactoe"`

Defined in: [db/db.types.ts:29](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/db/db.types.ts#L29)

***

### id

> **id**: `string`

Defined in: [db/db.types.ts:28](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/db/db.types.ts#L28)

***

### options

> **options**: `unknown`

Defined in: [db/db.types.ts:31](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/db/db.types.ts#L31)

***

### participants

> **participants**: `object`[]

Defined in: [db/db.types.ts:32](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/db/db.types.ts#L32)

#### finalScore

> **finalScore**: `number`

#### isWinner

> **isWinner**: `boolean`

#### name

> **name**: `string`

#### playerId

> **playerId**: `string` \| `null`

***

### playedAt

> **playedAt**: `number`

Defined in: [db/db.types.ts:30](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/db/db.types.ts#L30)

***

### rounds

> **rounds**: [`RoundRecord`](RoundRecord.md)[]

Defined in: [db/db.types.ts:38](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/db/db.types.ts#L38)
