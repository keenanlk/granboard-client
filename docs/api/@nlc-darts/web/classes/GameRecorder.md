[**Documentation**](../../../README.md)

---

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / GameRecorder

# Class: GameRecorder

Defined in: [db/gameRecorder.ts:12](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/db/gameRecorder.ts#L12)

Accumulates round data during a game and saves the session to IndexedDB when finished.

## Constructors

### Constructor

> **new GameRecorder**(`gameType`, `playerNames`, `playerIds`, `options`): `GameRecorder`

Defined in: [db/gameRecorder.ts:20](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/db/gameRecorder.ts#L20)

#### Parameters

##### gameType

`"x01"` \| `"cricket"` \| `"highscore"` \| `"atw"` \| `"tictactoe"`

##### playerNames

`string`[]

##### playerIds

(`string` \| `null`)[]

##### options

`unknown`

#### Returns

`GameRecorder`

## Methods

### recordRound()

> **recordRound**(`playerIndex`, `darts`, `roundScore`): `void`

Defined in: [db/gameRecorder.ts:34](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/db/gameRecorder.ts#L34)

Call this before nextTurn() — captures the just-completed round for a player.

#### Parameters

##### playerIndex

`number`

##### darts

[`RecordedDart`](../../engine/src/db/db.types.ts/interfaces/RecordedDart.md)[]

##### roundScore

`number`

#### Returns

`void`

---

### save()

> **save**(`winnerNames`, `finalScores`): `Promise`\<`void`\>

Defined in: [db/gameRecorder.ts:47](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/db/gameRecorder.ts#L47)

Call when the game ends. Only writes to DB if at least one named player is in the game.

#### Parameters

##### winnerNames

`string`[]

##### finalScores

`number`[]

#### Returns

`Promise`\<`void`\>
