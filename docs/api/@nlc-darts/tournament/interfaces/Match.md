[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/tournament](../README.md) / [](../README.md) / Match

# Interface: Match

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/storage.d.ts:59

A match of a round.

## Extends

- `MatchResults`

## Properties

### child\_count

> **child\_count**: `number`

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/storage.d.ts:71

The count of match games this match has. Can be `0` if it's a simple match, or a positive number for "Best Of" matches.

***

### group\_id

> **group\_id**: `Id`

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/storage.d.ts:65

ID of the parent group.

***

### id

> **id**: `Id`

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/storage.d.ts:61

ID of the match.

***

### number

> **number**: `number`

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/storage.d.ts:69

The number of the match in its round.

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

### round\_id

> **round\_id**: `Id`

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/storage.d.ts:67

ID of the parent round.

***

### stage\_id

> **stage\_id**: `Id`

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/storage.d.ts:63

ID of the parent stage.

***

### status

> **status**: [`Status`](../enumerations/Status.md)

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/other.d.ts:39

Status of the match.

#### Inherited from

`MatchResults.status`
