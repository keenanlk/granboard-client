[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / OnlineRemoteController

# Class: OnlineRemoteController

Defined in: [controllers/OnlineRemoteController.ts:11](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/apps/web/src/controllers/OnlineRemoteController.ts#L11)

Controller used by the remote (non-host) player in online mode.
Instead of mutating local game state, it sends messages to the host
via the Supabase room channel. The host processes all darts and
broadcasts state updates back.

## Implements

- [`GameController`](../interfaces/GameController.md)

## Constructors

### Constructor

> **new OnlineRemoteController**(`channel`): `OnlineRemoteController`

Defined in: [controllers/OnlineRemoteController.ts:14](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/apps/web/src/controllers/OnlineRemoteController.ts#L14)

#### Parameters

##### channel

`RealtimeChannel`

#### Returns

`OnlineRemoteController`

## Properties

### channel

> **channel**: `RealtimeChannel`

Defined in: [controllers/OnlineRemoteController.ts:12](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/apps/web/src/controllers/OnlineRemoteController.ts#L12)

## Methods

### onDartHit()

> **onDartHit**(`segment`): `void`

Defined in: [controllers/OnlineRemoteController.ts:18](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/apps/web/src/controllers/OnlineRemoteController.ts#L18)

Handle a dart landing on a board segment.

#### Parameters

##### segment

[`Segment`](../../engine/src/board/Dartboard.ts/interfaces/Segment.md)

#### Returns

`void`

#### Implementation of

[`GameController`](../interfaces/GameController.md).[`onDartHit`](../interfaces/GameController.md#ondarthit)

***

### onNextTurn()

> **onNextTurn**(): `void`

Defined in: [controllers/OnlineRemoteController.ts:35](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/apps/web/src/controllers/OnlineRemoteController.ts#L35)

Advance to the next player's turn.

#### Returns

`void`

#### Implementation of

[`GameController`](../interfaces/GameController.md).[`onNextTurn`](../interfaces/GameController.md#onnextturn)

***

### sendUndo()

> **sendUndo**(): `void`

Defined in: [controllers/OnlineRemoteController.ts:43](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/apps/web/src/controllers/OnlineRemoteController.ts#L43)

#### Returns

`void`
