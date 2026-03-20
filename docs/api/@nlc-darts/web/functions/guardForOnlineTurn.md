[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / guardForOnlineTurn

# Function: guardForOnlineTurn()

> **guardForOnlineTurn**(`inner`, `localIndex`, `getCurrent`): [`GameController`](../interfaces/GameController.md)

Defined in: [controllers/OnlineTurnGuard.ts:18](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/apps/web/src/controllers/OnlineTurnGuard.ts#L18)

Wraps a GameController so that onDartHit is only forwarded when it's
the local player's turn. In online mode each player has their own
physical board — dart hits should be ignored when it's the opponent's
turn.

onNextTurn is always forwarded because either player can trigger it
(e.g. pressing the board reset button or the UI button), and the
host also receives remote next-turn requests via the channel.

## Parameters

### inner

[`GameController`](../interfaces/GameController.md)

The real controller to delegate to

### localIndex

`number`

The local player's index (host = 0, remote = 1)

### getCurrent

() => `number`

Returns the current player index from the store

## Returns

[`GameController`](../interfaces/GameController.md)
