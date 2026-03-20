[**Documentation**](../../../../../../README.md)

***

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/engine/highScoreEngine.ts](../README.md) / HighScoreEngine

# Class: HighScoreEngine

Defined in: [engine/highScoreEngine.ts:39](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/highScoreEngine.ts#L39)

Game engine for High Score mode implementing the GameEngine interface.

## Implements

- [`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md)\<[`HighScoreState`](../../highScore.types.ts/interfaces/HighScoreState.md), [`HighScoreOptions`](../../highScore.types.ts/interfaces/HighScoreOptions.md)\>

## Constructors

### Constructor

> **new HighScoreEngine**(): `HighScoreEngine`

#### Returns

`HighScoreEngine`

## Methods

### addDart()

> **addDart**(`state`, `segment`): `Partial`\<[`HighScoreState`](../../highScore.types.ts/interfaces/HighScoreState.md)\>

Defined in: [engine/highScoreEngine.ts:60](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/highScoreEngine.ts#L60)

Apply a dart throw. Returns only the fields that changed.

#### Parameters

##### state

[`HighScoreState`](../../highScore.types.ts/interfaces/HighScoreState.md)

##### segment

[`Segment`](../../../board/Dartboard.ts/interfaces/Segment.md)

#### Returns

`Partial`\<[`HighScoreState`](../../highScore.types.ts/interfaces/HighScoreState.md)\>

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`addDart`](../../GameEngine.ts/interfaces/GameEngine.md#adddart)

***

### nextTurn()

> **nextTurn**(`state`): `Partial`\<[`HighScoreState`](../../highScore.types.ts/interfaces/HighScoreState.md)\>

Defined in: [engine/highScoreEngine.ts:75](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/highScoreEngine.ts#L75)

Commit the current player's turn and advance to the next player. Returns only the fields that changed.

#### Parameters

##### state

[`HighScoreState`](../../highScore.types.ts/interfaces/HighScoreState.md)

#### Returns

`Partial`\<[`HighScoreState`](../../highScore.types.ts/interfaces/HighScoreState.md)\>

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`nextTurn`](../../GameEngine.ts/interfaces/GameEngine.md#nextturn)

***

### startGame()

> **startGame**(`options`, `playerNames`): [`HighScoreState`](../../highScore.types.ts/interfaces/HighScoreState.md)

Defined in: [engine/highScoreEngine.ts:43](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/highScoreEngine.ts#L43)

Create fresh initial state for a new game.

#### Parameters

##### options

[`HighScoreOptions`](../../highScore.types.ts/interfaces/HighScoreOptions.md)

##### playerNames

`string`[]

#### Returns

[`HighScoreState`](../../highScore.types.ts/interfaces/HighScoreState.md)

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`startGame`](../../GameEngine.ts/interfaces/GameEngine.md#startgame)

***

### undoLastDart()

> **undoLastDart**(`state`): `Partial`\<[`HighScoreState`](../../highScore.types.ts/interfaces/HighScoreState.md)\>

Defined in: [engine/highScoreEngine.ts:68](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/highScoreEngine.ts#L68)

Reverse the last dart thrown in the current turn. Returns only the fields that changed.

#### Parameters

##### state

[`HighScoreState`](../../highScore.types.ts/interfaces/HighScoreState.md)

#### Returns

`Partial`\<[`HighScoreState`](../../highScore.types.ts/interfaces/HighScoreState.md)\>

#### Implementation of

[`GameEngine`](../../GameEngine.ts/interfaces/GameEngine.md).[`undoLastDart`](../../GameEngine.ts/interfaces/GameEngine.md#undolastdart)
