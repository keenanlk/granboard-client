[**Documentation**](../../../../../../README.md)

***

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/engine/highScore.types.ts](../README.md) / HighScoreState

# Interface: HighScoreState

Defined in: [engine/highScore.types.ts:33](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/highScore.types.ts#L33)

Complete mutable state for a High Score game in progress.

## Properties

### currentPlayerIndex

> **currentPlayerIndex**: `number`

Defined in: [engine/highScore.types.ts:36](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/highScore.types.ts#L36)

***

### currentRound

> **currentRound**: `number`

Defined in: [engine/highScore.types.ts:37](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/highScore.types.ts#L37)

***

### currentRoundDarts

> **currentRoundDarts**: [`HighScoreThrownDart`](HighScoreThrownDart.md)[]

Defined in: [engine/highScore.types.ts:38](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/highScore.types.ts#L38)

***

### inPlayoff

> **inPlayoff**: `boolean`

Defined in: [engine/highScore.types.ts:42](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/highScore.types.ts#L42)

true when tied players are throwing 1-dart playoff

***

### options

> **options**: [`HighScoreOptions`](HighScoreOptions.md)

Defined in: [engine/highScore.types.ts:34](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/highScore.types.ts#L34)

***

### players

> **players**: [`HighScorePlayer`](HighScorePlayer.md)[]

Defined in: [engine/highScore.types.ts:35](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/highScore.types.ts#L35)

***

### playoffDarts

> **playoffDarts**: `object`[]

Defined in: [engine/highScore.types.ts:43](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/highScore.types.ts#L43)

#### playerIndex

> **playerIndex**: `number`

#### value

> **value**: `number`

***

### winners

> **winners**: `string`[] \| `null`

Defined in: [engine/highScore.types.ts:40](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/highScore.types.ts#L40)

null = game ongoing, string[] = winner name(s)
