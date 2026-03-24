[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/tournament](../README.md) / [](../README.md) / MatchGame

# Interface: MatchGame

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/storage.d.ts:76

A game of a match.

## Extends

- `MatchResults`

## Properties

### id

> **id**: `Id`

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/storage.d.ts:78

ID of the match game.

***

### number

> **number**: `number`

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/storage.d.ts:84

The number of the match game in its parent match.

***

### opponent1

> **opponent1**: `ParticipantResult` \| `null`

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/other.d.ts:41

First opponent of the match.

#### Inherited from

`MatchResults.opponent1`

***

### opponent2

> **opponent2**: `ParticipantResult` \| `null`

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/other.d.ts:43

Second opponent of the match.

#### Inherited from

`MatchResults.opponent2`

***

### parent\_id

> **parent\_id**: `Id`

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/storage.d.ts:82

ID of the parent match.

***

### stage\_id

> **stage\_id**: `Id`

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/storage.d.ts:80

ID of the parent stage.

***

### status

> **status**: [`Status`](../enumerations/Status.md)

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/other.d.ts:39

Status of the match.

#### Inherited from

`MatchResults.status`
