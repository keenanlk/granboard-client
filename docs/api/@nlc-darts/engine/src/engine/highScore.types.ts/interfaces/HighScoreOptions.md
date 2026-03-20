[**Documentation**](../../../../../../README.md)

***

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/engine/highScore.types.ts](../README.md) / HighScoreOptions

# Interface: HighScoreOptions

Defined in: [engine/highScore.types.ts:4](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/highScore.types.ts#L4)

Configuration options for a High Score game.

## Properties

### rounds

> **rounds**: `number`

Defined in: [engine/highScore.types.ts:5](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/highScore.types.ts#L5)

***

### splitBull

> **splitBull**: `boolean`

Defined in: [engine/highScore.types.ts:9](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/highScore.types.ts#L9)

When false (default), outer bull scores 50 same as double bull. When true, bulls are split (outer = 25, inner = 50).

***

### tieRule

> **tieRule**: `"stand"` \| `"playoff"`

Defined in: [engine/highScore.types.ts:7](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/highScore.types.ts#L7)

If tied at end: "stand" = shared win, "playoff" = one-dart playoff
