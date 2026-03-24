[**Documentation**](../../../../../../README.md)

***

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/bot/Bot.ts](../README.md) / Bot

# Class: Bot

Defined in: [bot/Bot.ts:29](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/bot/Bot.ts#L29)

A Bot player that uses a statistical Gaussian throw model to simulate realistic darts.

Each bot has a skill level (σ in mm). The lower the σ, the tighter the grouping:
  - Pro (6mm): hits intended segment the vast majority of the time
  - Advanced (12mm): regularly hits target, occasional adjacent segment
  - Intermediate (25mm): frequently hits the right number but rarely the intended ring
  - Beginner (50mm): wide scatter, often misses the target number entirely

Usage:
  const bot = new Bot("CPU", BotSkill.Intermediate);
  const hitSegmentId = bot.throwX01(score, opts, opened);
  store.addDart(CreateSegment(hitSegmentId));

## Constructors

### Constructor

> **new Bot**(`name`, `skill`): `Bot`

Defined in: [bot/Bot.ts:33](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/bot/Bot.ts#L33)

#### Parameters

##### name

`string`

##### skill

[`BotSkill`](../../bot.types.ts/type-aliases/BotSkill.md)

#### Returns

`Bot`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [bot/Bot.ts:30](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/bot/Bot.ts#L30)

***

### sigma

> `readonly` **sigma**: `number`

Defined in: [bot/Bot.ts:31](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/bot/Bot.ts#L31)

## Methods

### throwATW()

> **throwATW**(`currentTarget`, `onThrow?`): [`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)

Defined in: [bot/Bot.ts:89](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/bot/Bot.ts#L89)

Pick a target for Around the World and simulate a throw.
Returns the SegmentID where the dart actually lands (may miss target).

#### Parameters

##### currentTarget

`number`

##### onThrow?

(`target`, `actual`) => `void`

#### Returns

[`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)

***

### throwCricket()

> **throwCricket**(`myMarks`, `allPlayers`, `myIndex`, `onThrow?`, `cutThroat?`): [`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)

Defined in: [bot/Bot.ts:58](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/bot/Bot.ts#L58)

Pick a target for Cricket and simulate a throw.
Returns the SegmentID where the dart actually lands (may miss target).

#### Parameters

##### myMarks

`Record`\<[`CricketTarget`](../../../engine/cricket.types.ts/type-aliases/CricketTarget.md), `number`\>

##### allPlayers

[`CricketPlayer`](../../../engine/cricket.types.ts/interfaces/CricketPlayer.md)[]

##### myIndex

`number`

##### onThrow?

(`target`, `actual`) => `void`

##### cutThroat?

`boolean`

#### Returns

[`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)

***

### throwHighScore()

> **throwHighScore**(`splitBull`, `onThrow?`): [`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)

Defined in: [bot/Bot.ts:75](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/bot/Bot.ts#L75)

Pick a target for High Score and simulate a throw.
Returns the SegmentID where the dart actually lands (may miss target).

#### Parameters

##### splitBull

`boolean`

##### onThrow?

(`target`, `actual`) => `void`

#### Returns

[`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)

***

### throwTicTacToe()

> **throwTicTacToe**(`grid`, `owner`, `myIndex`, `myMarks`, `opponentMarks`, `onThrow?`): [`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)

Defined in: [bot/Bot.ts:103](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/bot/Bot.ts#L103)

Pick a target for Tic Tac Toe and simulate a throw.
Returns the SegmentID where the dart actually lands (may miss target).

#### Parameters

##### grid

`number`[]

##### owner

(`0` \| `1` \| `null`)[]

##### myIndex

`number`

##### myMarks

`number`[]

##### opponentMarks

`number`[]

##### onThrow?

(`target`, `actual`) => `void`

#### Returns

[`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)

***

### throwX01()

> **throwX01**(`score`, `opts`, `opened`, `onThrow?`): [`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)

Defined in: [bot/Bot.ts:42](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/bot/Bot.ts#L42)

Pick a target for X01 and simulate a throw.
Returns the SegmentID where the dart actually lands (may miss target).

#### Parameters

##### score

`number`

##### opts

[`X01Options`](../../../engine/x01.types.ts/interfaces/X01Options.md)

##### opened

`boolean`

##### onThrow?

(`target`, `actual`) => `void`

#### Returns

[`SegmentID`](../../../board/Dartboard.ts/type-aliases/SegmentID.md)
