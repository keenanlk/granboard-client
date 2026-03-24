[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / useTournament

# Function: useTournament()

> **useTournament**(): `object`

Defined in: [hooks/useTournament.ts:7](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useTournament.ts#L7)

Thin selector hook for tournament state.
Replaces useTournamentRoom.

## Returns

`object`

### bracketData

> **bracketData**: `ValueToArray`\<[`DataTypes`](../../tournament/interfaces/DataTypes.md)\> \| `null`

### clearMatchAlert

> **clearMatchAlert**: () => `void`

#### Returns

`void`

### clearMatchCountdown

> **clearMatchCountdown**: () => `void`

#### Returns

`void`

### clearMatchGameRoom

> **clearMatchGameRoom**: () => `void`

#### Returns

`void`

### clearMatchStart

> **clearMatchStart**: () => `void`

#### Returns

`void`

### connect

> **connect**: (`tournamentId?`) => `Promise`\<`void`\>

#### Parameters

##### tournamentId?

`string`

#### Returns

`Promise`\<`void`\>

### connected

> **connected**: `boolean`

### createTournament

> **createTournament**: (`data`) => `void`

#### Parameters

##### data

###### createdBy

`string`

###### format

`string`

###### maxParticipants?

`number` \| `null`

###### name

`string`

###### registrationDeadline?

`string` \| `null`

###### scheduledAt?

`string` \| `null`

###### visibility?

`"public"` \| `"private"`

#### Returns

`void`

### disconnect

> **disconnect**: () => `void`

#### Returns

`void`

### error

> **error**: `string` \| `null`

### matchAlert

> **matchAlert**: `MatchAlert` \| `null`

### matchCountdown

> **matchCountdown**: `MatchCountdown` \| `null`

### matchGameRoom

> **matchGameRoom**: \{ `colyseusRoomId`: `string`; `matchId`: `number`; \} \| `null`

### matchReadyState

> **matchReadyState**: `MatchReadyState` \| `null`

### matchStart

> **matchStart**: `MatchStart` \| `null`

### participantUserMap

> **participantUserMap**: `Record`\<`number`, `string`\> \| `null`

### readyForMatch

> **readyForMatch**: (`matchId`, `userId`, `tournamentId`) => `void`

#### Parameters

##### matchId

`number`

##### userId

`string`

##### tournamentId

`string`

#### Returns

`void`

### recordResult

> **recordResult**: (`matchId`, `opponent1Score`, `opponent2Score`) => `void`

#### Parameters

##### matchId

`number`

##### opponent1Score

`number`

##### opponent2Score

`number`

#### Returns

`void`

### registerPlayer

> **registerPlayer**: (`tournamentId`, `userId`) => `void`

#### Parameters

##### tournamentId

`string`

##### userId

`string`

#### Returns

`void`

### registrationUpdate

> **registrationUpdate**: `RegistrationUpdate` \| `null`

### reportMatchGameResult

> **reportMatchGameResult**: (`matchId`, `winnerUserId`, `legResults`) => `void`

#### Parameters

##### matchId

`number`

##### winnerUserId

`string`

##### legResults

`object`[]

#### Returns

`void`

### sendGameRoomReady

> **sendGameRoomReady**: (`matchId`, `colyseusRoomId`) => `void`

#### Parameters

##### matchId

`number`

##### colyseusRoomId

`string`

#### Returns

`void`

### startTournament

> **startTournament**: (`tournamentId`, `userId`) => `void`

#### Parameters

##### tournamentId

`string`

##### userId

`string`

#### Returns

`void`

### tournamentCreated

> **tournamentCreated**: `TournamentCreatedEvent` \| `null`

### tournamentPhase

> **tournamentPhase**: `TournamentPhase`

### unreadyForMatch

> **unreadyForMatch**: (`matchId`, `userId`) => `void`

#### Parameters

##### matchId

`number`

##### userId

`string`

#### Returns

`void`

### unregisterPlayer

> **unregisterPlayer**: (`tournamentId`, `userId`) => `void`

#### Parameters

##### tournamentId

`string`

##### userId

`string`

#### Returns

`void`
