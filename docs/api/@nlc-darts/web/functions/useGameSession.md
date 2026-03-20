[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / useGameSession

# Function: useGameSession()

> **useGameSession**(`__namedParameters`): `object`

Defined in: [hooks/useGameSession.ts:41](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useGameSession.ts#L41)

Shared session hook for all game modes.
Handles: controller lifecycle, per-turn recording, turn delay (remove darts countdown),
winner-triggered final-round recording + session save, and localStorage persistence.

Each game screen provides:
  - onInit        — called first: startGame() + any game-specific init (e.g. LED open numbers)
  - createController — factory for the game-specific controller
  - extractRound  — reads current store state and returns dart data for recording
  - winner        — current winner(s) from the store (null while game is live)
  - getFinalScores — reads final scores from the store when the game ends
  - getSerializableState — returns the store's serializable state for persistence

## Parameters

### \_\_namedParameters

#### botSkills?

([`BotSkill`](../../engine/src/bot/bot.types.ts/type-aliases/BotSkill.md) \| `null`)[]

#### createController

() => [`GameController`](../interfaces/GameController.md)

#### currentLegIndex?

`number`

#### extractRound

() => `RoundExtract`

#### gameType

`"x01"` \| `"cricket"` \| `"highscore"` \| `"atw"` \| `"tictactoe"`

#### getFinalScores

() => `number`[]

#### getSerializableState

() => `unknown`

#### legResults?

[`LegResult`](../../engine/src/lib/setTypes.ts/interfaces/LegResult.md)[]

#### onBeforeNextTurn?

() => `void`

Called at the start of onNextTurn — use to dismiss awards/overlays

#### onInit

() => `void`

#### online?

`boolean`

When true, uses shorter delay with no numeric countdown

#### onTurnDelayStart?

() => `void`

Called when the between-turn delay starts (for online broadcast)

#### options

`unknown`

#### playerIds

(`string` \| `null`)[]

#### playerNames

`string`[]

#### setConfig?

[`SetConfig`](../../engine/src/lib/setTypes.ts/interfaces/SetConfig.md)

#### shouldSkipDelay?

() => `boolean`

If provided, called before triggering turn delay. Return true to skip the delay.

#### winner

`string`[] \| `null`

## Returns

### countdown

> **countdown**: `number`

### handleNextTurn

> **handleNextTurn**: () => `void`

#### Returns

`void`

### isTransitioning

> **isTransitioning**: `boolean`

### triggerRemoteDelay

> **triggerRemoteDelay**: () => `void`

Trigger the turn delay overlay without going through the controller.
 Used by remote players when they receive a turn_delay broadcast.
 Intentionally ignores shouldSkipDelay — that only controls the
 local turn flow, not delays triggered by the host.

#### Returns

`void`
