[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / useBotTurn

# Function: useBotTurn()

> **useBotTurn**(`__namedParameters`): `void`

Defined in: [hooks/useBotTurn.ts:20](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/apps/web/src/hooks/useBotTurn.ts#L20)

## Parameters

### \_\_namedParameters

#### bots

`Map`\<`number`, [`Bot`](../../engine/src/bot/Bot.ts/classes/Bot.md)\>

Map of player index → Bot instance. Human players are absent from the map.

#### currentPlayerIndex

`number`

#### dartsThrown

`number`

#### getThrow

(`bot`) => [`Segment`](../../engine/src/board/Dartboard.ts/interfaces/Segment.md)

Stable callback (useCallback). Called with the current bot; returns the segment thrown.

#### hasWinner

`boolean`

#### isBust

`boolean`

#### isTransitioning

`boolean`

#### onNextTurn

() => `void`

Stable callback (useCallback). Reads live store state to pick and simulate the throw.

## Returns

`void`
