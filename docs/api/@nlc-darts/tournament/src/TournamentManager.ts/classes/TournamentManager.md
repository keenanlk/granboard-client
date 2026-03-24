[**Documentation**](../../../../../README.md)

***

[Documentation](../../../../../README.md) / [@nlc-darts/tournament](../../../README.md) / [src/TournamentManager.ts](../README.md) / TournamentManager

# Class: TournamentManager

Defined in: [packages/tournament/src/TournamentManager.ts:30](https://github.com/keenanlk/granboard-client/blob/d5695851d4d546aa392a93978d8e88df978914ad/packages/tournament/src/TournamentManager.ts#L30)

## Constructors

### Constructor

> **new TournamentManager**(`storage`): `TournamentManager`

Defined in: [packages/tournament/src/TournamentManager.ts:33](https://github.com/keenanlk/granboard-client/blob/d5695851d4d546aa392a93978d8e88df978914ad/packages/tournament/src/TournamentManager.ts#L33)

#### Parameters

##### storage

[`CrudInterface`](../../../interfaces/CrudInterface.md)

#### Returns

`TournamentManager`

## Accessors

### brackets

#### Get Signature

> **get** **brackets**(): `BracketsManager`

Defined in: [packages/tournament/src/TournamentManager.ts:133](https://github.com/keenanlk/granboard-client/blob/d5695851d4d546aa392a93978d8e88df978914ad/packages/tournament/src/TournamentManager.ts#L133)

Gets the underlying BracketsManager for advanced operations.

##### Returns

`BracketsManager`

## Methods

### createStage()

> **createStage**(`tournamentId`, `format`, `participantNames`): `Promise`\<`void`\>

Defined in: [packages/tournament/src/TournamentManager.ts:45](https://github.com/keenanlk/granboard-client/blob/d5695851d4d546aa392a93978d8e88df978914ad/packages/tournament/src/TournamentManager.ts#L45)

Creates bracket structure for a tournament.
Participants must already be inserted into storage before calling this.

#### Parameters

##### tournamentId

`string` \| `number`

The tournament_id used by brackets-manager (can be number or string).

##### format

[`StageType`](../../../type-aliases/StageType.md)

Tournament format.

##### participantNames

`string`[]

Ordered list of participant names (seeding order).

#### Returns

`Promise`\<`void`\>

***

### getBracketData()

> **getBracketData**(`tournamentId`): `Promise`\<`ValueToArray`\<[`DataTypes`](../../../interfaces/DataTypes.md)\>\>

Defined in: [packages/tournament/src/TournamentManager.ts:91](https://github.com/keenanlk/granboard-client/blob/d5695851d4d546aa392a93978d8e88df978914ad/packages/tournament/src/TournamentManager.ts#L91)

Gets the full bracket data for a tournament.

#### Parameters

##### tournamentId

`string` \| `number`

#### Returns

`Promise`\<`ValueToArray`\<[`DataTypes`](../../../interfaces/DataTypes.md)\>\>

***

### getMatches()

> **getMatches**(`tournamentId`): `Promise`\<[`Match`](../../../interfaces/Match.md)[]\>

Defined in: [packages/tournament/src/TournamentManager.ts:125](https://github.com/keenanlk/granboard-client/blob/d5695851d4d546aa392a93978d8e88df978914ad/packages/tournament/src/TournamentManager.ts#L125)

Gets all matches for a tournament.

#### Parameters

##### tournamentId

`string` \| `number`

#### Returns

`Promise`\<[`Match`](../../../interfaces/Match.md)[]\>

***

### recordResult()

> **recordResult**(`matchId`, `result`): `Promise`\<`void`\>

Defined in: [packages/tournament/src/TournamentManager.ts:74](https://github.com/keenanlk/granboard-client/blob/d5695851d4d546aa392a93978d8e88df978914ad/packages/tournament/src/TournamentManager.ts#L74)

Records the result of a match.

#### Parameters

##### matchId

`number`

##### result

[`MatchResult`](../../types.ts/interfaces/MatchResult.md)

#### Returns

`Promise`\<`void`\>
