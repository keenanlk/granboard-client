[**Documentation**](../../../../../README.md)

***

[Documentation](../../../../../README.md) / [@nlc-darts/server](../../../README.md) / [rooms/BaseGameRoom](../README.md) / BaseGameRoom

# Abstract Class: BaseGameRoom\<TState, TOptions\>

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:44](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L44)

Abstract base for all game rooms.
Concrete subclasses provide the engine and game-specific helpers.

## Extends

- `Room`

## Extended by

- [`X01Room`](../../X01Room/classes/X01Room.md)
- [`CricketRoom`](../../CricketRoom/classes/CricketRoom.md)

## Type Parameters

### TState

`TState` *extends* `object`

### TOptions

`TOptions`

## Constructors

### Constructor

> **new BaseGameRoom**\<`TState`, `TOptions`\>(): `BaseGameRoom`\<`TState`, `TOptions`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:99

#### Returns

`BaseGameRoom`\<`TState`, `TOptions`\>

#### Inherited from

`Room.constructor`

## Properties

### \_events

> **\_events**: `EventEmitter`\<\[`never`\]\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:80

**`Internal`**

#### Inherited from

[`X01Room`](../../X01Room/classes/X01Room.md).[`_events`](../../X01Room/classes/X01Room.md#_events)

***

### \_reconnections

> `protected` **\_reconnections**: `object`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:88

#### Index Signature

\[`reconnectionToken`: `string`\]: \[`string`, `Deferred`\<`any`\>\]

#### Inherited from

`Room._reconnections`

***

### autoDispose

> **autoDispose**: `boolean`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:56

Automatically dispose the room when last client disconnects.

#### Default

```ts
true
```

#### Inherited from

[`X01Room`](../../X01Room/classes/X01Room.md).[`autoDispose`](../../X01Room/classes/X01Room.md#autodispose)

***

### clients

> **clients**: `ClientArray`\<`any`, `any`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:78

The array of connected clients.

#### See

[instance](https://docs.colyseus.io/colyseus/server/room/#client|Client)

#### Inherited from

`Room.clients`

***

### clock

> **clock**: `ClockTimer`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:44

Timing events tied to the room instance.
Intervals and timeouts are cleared when the room is disposed.

#### Inherited from

[`X01Room`](../../X01Room/classes/X01Room.md).[`clock`](../../X01Room/classes/X01Room.md#clock)

***

### engine

> `abstract` `protected` **engine**: [`GameEngine`](../../../../engine/src/engine/GameEngine.ts/interfaces/GameEngine.md)\<`TState`, `TOptions`\>

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:49](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L49)

Game engine that drives state transitions for this room type.

***

### gameOptions

> `protected` **gameOptions**: `TOptions`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:56](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L56)

Parsed game options for the current match.

***

### gameState

> `protected` **gameState**: `TState`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:54](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L54)

Current authoritative game state.

***

### listing

> **listing**: `RoomCache`\<`any`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:39

#### Inherited from

`Room.listing`

***

### log

> `protected` **log**: [`Logger`](../../../../logger/interfaces/Logger.md)

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:51](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L51)

Scoped logger instance for this room.

***

### maxClients

> **maxClients**: `number`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:50

Maximum number of clients allowed to connect into the room. When room reaches this limit,
it is locked automatically. Unless the room was explicitly locked by you via `lock()` method,
the room will be unlocked as soon as a client disconnects from it.

#### Inherited from

[`X01Room`](../../X01Room/classes/X01Room.md).[`maxClients`](../../X01Room/classes/X01Room.md#maxclients)

***

### patchRate

> **patchRate**: `number`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:62

Frequency to send the room state to connected clients, in milliseconds.

#### Default

```ts
50ms (20fps)
```

#### Inherited from

[`X01Room`](../../X01Room/classes/X01Room.md).[`patchRate`](../../X01Room/classes/X01Room.md#patchrate)

***

### playerIds

> `protected` **playerIds**: (`string` \| `null`)[] = `[]`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:64](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L64)

Supabase user IDs for each player (null for guests).

***

### playerMap

> `protected` **playerMap**: `Map`\<`string`, `number`\>

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:60](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L60)

Maps Colyseus session IDs to player seat indices.

***

### playerNames

> `protected` **playerNames**: `string`[] = `[]`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:62](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L62)

Ordered display names for each player.

***

### presence

> **presence**: `Presence`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:72

The presence instance. Check Presence API for more details.

#### See

[API](https://docs.colyseus.io/colyseus/server/presence/|Presence)

#### Inherited from

[`X01Room`](../../X01Room/classes/X01Room.md).[`presence`](../../X01Room/classes/X01Room.md#presence)

***

### reservedSeats

> `protected` **reservedSeats**: `object`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:82

#### Index Signature

\[`sessionId`: `string`\]: \[`any`, `any`, `boolean`?, `boolean`?\]

#### Inherited from

`Room.reservedSeats`

***

### reservedSeatTimeouts

> `protected` **reservedSeatTimeouts**: `object`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:85

#### Index Signature

\[`sessionId`: `string`\]: `Timeout`

#### Inherited from

`Room.reservedSeatTimeouts`

***

### seatReservationTime

> `protected` **seatReservationTime**: `number`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:81

#### Inherited from

[`X01Room`](../../X01Room/classes/X01Room.md).[`seatReservationTime`](../../X01Room/classes/X01Room.md#seatreservationtime)

***

### state

> **state**: `any`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:66

The state instance you provided to `setState()`.

#### Inherited from

`Room.state`

***

### supabaseRoomId

> `protected` **supabaseRoomId**: `string` \| `null` = `null`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:66](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L66)

Supabase room row ID for recording results, if available.

***

### undoStack

> `protected` **undoStack**: `TState`[] = `[]`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:58](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L58)

Stack of previous states used for undo support.

## Accessors

### gameTypeName

#### Get Signature

> **get** `abstract` `protected` **gameTypeName**(): `string`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:417](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L417)

Determine the game type string for the game_results table.

##### Returns

`string`

***

### locked

#### Get Signature

> **get** **locked**(): `boolean`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:37

This property will change on these situations:
- The maximum number of allowed clients has been reached (`maxClients`)
- You manually locked, or unlocked the room using lock() or `unlock()`.

##### Returns

`boolean`

#### Inherited from

`Room.locked`

***

### metadata

#### Get Signature

> **get** **metadata**(): `Metadata`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:38

##### Returns

`Metadata`

#### Inherited from

`Room.metadata`

***

### roomId

#### Get Signature

> **get** **roomId**(): `string`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:123

A unique, auto-generated, 9-character-long id of the room.
You may replace `this.roomId` during `onCreate()`.

##### Returns

`string`

roomId string

#### Set Signature

> **set** **roomId**(`roomId`): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:130

Setting the roomId, is restricted in room lifetime except upon room creation.

##### Parameters

###### roomId

`string`

##### Returns

`void`

roomId string

#### Inherited from

`Room.roomId`

***

### roomName

#### Get Signature

> **get** **roomName**(): `string`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:110

The name of the room you provided as first argument for `gameServer.define()`.

##### Returns

`string`

roomName string

#### Set Signature

> **set** **roomName**(`roomName`): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:116

Setting the name of the room. Overwriting this property is restricted.

##### Parameters

###### roomName

`string`

##### Returns

`void`

#### Inherited from

`Room.roomName`

## Methods

### \_\_init()

> `protected` **\_\_init**(): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:104

**`Internal`**

This method is called by the MatchMaker before onCreate()

#### Returns

`void`

#### Inherited from

`Room.__init`

***

### \_decrementClientCount()

> `protected` **\_decrementClientCount**(): `Promise`\<`boolean`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:264

#### Returns

`Promise`\<`boolean`\>

#### Inherited from

`Room._decrementClientCount`

***

### \_dequeueAfterPatchMessages()

> `protected` **\_dequeueAfterPatchMessages**(): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:255

#### Returns

`void`

#### Inherited from

`Room._dequeueAfterPatchMessages`

***

### \_dispose()

> `protected` **\_dispose**(): `Promise`\<`any`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:258

#### Returns

`Promise`\<`any`\>

#### Inherited from

`Room._dispose`

***

### \_disposeIfEmpty()

> `protected` **\_disposeIfEmpty**(): `boolean`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:257

#### Returns

`boolean`

#### Inherited from

`Room._disposeIfEmpty`

***

### \_forciblyCloseClient()

> `protected` **\_forciblyCloseClient**(`client`, `closeCode`): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:260

#### Parameters

##### client

`Client`\<`any`, `any`\> & `ClientPrivate`

##### closeCode

`number`

#### Returns

`void`

#### Inherited from

`Room._forciblyCloseClient`

***

### \_incrementClientCount()

> `protected` **\_incrementClientCount**(): `Promise`\<`void`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:263

#### Returns

`Promise`\<`void`\>

#### Inherited from

`Room._incrementClientCount`

***

### \_onAfterLeave()

> `protected` **\_onAfterLeave**(`client`): `Promise`\<`void`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:262

#### Parameters

##### client

`Client`

#### Returns

`Promise`\<`void`\>

#### Inherited from

`Room._onAfterLeave`

***

### \_onJoin()

> **\_onJoin**(`client`, `authContext`): `Promise`\<`void`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:240

#### Parameters

##### client

`Client`\<`any`, `any`\> & `ClientPrivate`

##### authContext

`AuthContext`

#### Returns

`Promise`\<`void`\>

#### Inherited from

`Room._onJoin`

***

### \_onLeave()

> `protected` **\_onLeave**(`client`, `code?`): `Promise`\<`any`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:261

#### Parameters

##### client

`Client`

##### code?

`number`

#### Returns

`Promise`\<`any`\>

#### Inherited from

`Room._onLeave`

***

### \_onMessage()

> `protected` **\_onMessage**(`client`, `buffer`): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:259

#### Parameters

##### client

`Client`\<`any`, `any`\> & `ClientPrivate`

##### buffer

`Buffer`

#### Returns

`void`

#### Inherited from

`Room._onMessage`

***

### \_reserveSeat()

> `protected` **\_reserveSeat**(`sessionId`, `joinOptions?`, `authData?`, `seconds?`, `allowReconnection?`, `devModeReconnection?`): `Promise`\<`boolean`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:256

#### Parameters

##### sessionId

`string`

##### joinOptions?

`any`

##### authData?

`any`

##### seconds?

`number`

##### allowReconnection?

`boolean`

##### devModeReconnection?

`boolean`

#### Returns

`Promise`\<`boolean`\>

#### Inherited from

`Room._reserveSeat`

***

### allowReconnection()

> **allowReconnection**(`previousClient`, `seconds`): `Deferred`\<`Client`\<`any`, `any`\>\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:251

Allow the specified client to reconnect into the room. Must be used inside `onLeave()` method.
If seconds is provided, the reconnection is going to be cancelled after the provided amount of seconds.

#### Parameters

##### previousClient

`Client`

The client which is to be waiting until re-connection happens.

##### seconds

`number` \| `"manual"`

Timeout period on re-connection in seconds.

#### Returns

`Deferred`\<`Client`\<`any`, `any`\>\>

Deferred<Client> - The differed is a promise like type.
 This type can forcibly reject the promise by calling `.reject()`.

#### Inherited from

`Room.allowReconnection`

***

### broadcast()

> **broadcast**(`type`, `message?`, `options?`): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:222

#### Parameters

##### type

`string` \| `number`

##### message?

`any`

##### options?

`IBroadcastOptions`

#### Returns

`void`

#### Inherited from

`Room.broadcast`

***

### broadcastBytes()

> **broadcastBytes**(`type`, `message`, `options`): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:226

Broadcast bytes (UInt8Arrays) to a particular room

#### Parameters

##### type

`string` \| `number`

##### message

`Uint8Array`

##### options

`IBroadcastOptions`

#### Returns

`void`

#### Inherited from

`Room.broadcastBytes`

***

### broadcastPatch()

> **broadcastPatch**(): `boolean`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:230

Checks whether mutations have occurred in the state, and broadcast them to all connected clients.

#### Returns

`boolean`

#### Inherited from

`Room.broadcastPatch`

***

### checkReconnectionToken()

> **checkReconnectionToken**(`reconnectionToken`): `string`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:190

#### Parameters

##### reconnectionToken

`string`

#### Returns

`string`

#### Inherited from

`Room.checkReconnectionToken`

***

### disconnect()

> **disconnect**(`closeCode?`): `Promise`\<`any`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:239

Disconnect all connected clients, and then dispose the room.

#### Parameters

##### closeCode?

`number`

WebSocket close code (default = 4000, which is a "consented leave")

#### Returns

`Promise`\<`any`\>

Promise<void>

#### Inherited from

`Room.disconnect`

***

### emitGameEvents()

> `abstract` `protected` **emitGameEvents**(`state`, `segment`): `void`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:79](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L79)

Subclass hook: generate game events after a dart is processed.

#### Parameters

##### state

`TState`

##### segment

[`Segment`](../../../../engine/src/board/Dartboard.ts/interfaces/Segment.md)

#### Returns

`void`

***

### extractPlayerGameStats()

> `abstract` `protected` **extractPlayerGameStats**(`state`, `playerIndex`): `object`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:82](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L82)

Subclass hook: extract per-player stats at game end for recording.

#### Parameters

##### state

`TState`

##### playerIndex

`number`

#### Returns

`object`

##### totalDarts

> **totalDarts**: `number`

##### totalMarks

> **totalMarks**: `number`

##### totalRounds

> **totalRounds**: `number`

##### totalScore

> **totalScore**: `number`

***

### hasReachedMaxClients()

> **hasReachedMaxClients**(): `boolean`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:176

Returns whether the sum of connected clients and reserved seats exceeds maximum number of clients.

#### Returns

`boolean`

boolean

#### Inherited from

`Room.hasReachedMaxClients`

***

### hasReservedSeat()

> **hasReservedSeat**(`sessionId`, `reconnectionToken?`): `boolean`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:189

#### Parameters

##### sessionId

`string`

##### reconnectionToken?

`string`

#### Returns

`boolean`

#### Inherited from

`Room.hasReservedSeat`

***

### lock()

> **lock**(): `Promise`\<`void`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:216

Locking the room will remove it from the pool of available rooms for new clients to connect to.

#### Returns

`Promise`\<`void`\>

#### Inherited from

`Room.lock`

***

### onAuth()

> **onAuth**(`client`, `options`, `context`): `any`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:149

#### Parameters

##### client

`Client`\<`any`, `any`\>

##### options

`any`

##### context

`AuthContext`

#### Returns

`any`

#### Inherited from

`Room.onAuth`

***

### onBeforePatch()?

> `optional` **onBeforePatch**(`state`): `void` \| `Promise`\<`any`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:131

#### Parameters

##### state

`any`

#### Returns

`void` \| `Promise`\<`any`\>

#### Inherited from

`Room.onBeforePatch`

***

### onBeforeShutdown()

> **onBeforeShutdown**(): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:157

This method is called during graceful shutdown of the server process
You may override this method to dispose the room in your own way.

Once process reaches room count of 0, the room process will be terminated.

#### Returns

`void`

#### Inherited from

`Room.onBeforeShutdown`

***

### onCacheRoom()?

> `optional` **onCacheRoom**(): `any`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:165

devMode: When `devMode` is enabled, `onCacheRoom` method is called during
graceful shutdown.

Implement this method to return custom data to be cached. `onRestoreRoom`
will be called with the data returned by `onCacheRoom`

#### Returns

`any`

#### Inherited from

`Room.onCacheRoom`

***

### onCreate()

> **onCreate**(`options`): `void`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:92](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L92)

#### Parameters

##### options

[`RoomCreateOptions`](../interfaces/RoomCreateOptions.md)

#### Returns

`void`

#### Overrides

`Room.onCreate`

***

### onDispose()

> **onDispose**(): `void`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:225](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L225)

#### Returns

`void`

#### Overrides

`Room.onDispose`

***

### onJoin()

> **onJoin**(`client`): `void`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:169](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L169)

#### Parameters

##### client

`Client`

#### Returns

`void`

#### Overrides

`Room.onJoin`

***

### onLeave()

> **onLeave**(`client`, `consented?`): `Promise`\<`void`\>

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:186](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L186)

#### Parameters

##### client

`Client`

##### consented?

`boolean`

#### Returns

`Promise`\<`void`\>

#### Overrides

`Room.onLeave`

***

### onMessage()

#### Call Signature

> **onMessage**\<`T`\>(`messageType`, `callback`): `any`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:231

##### Type Parameters

###### T

`T` = `any`

##### Parameters

###### messageType

`"*"`

###### callback

(`client`, `type`, `message`) => `void`

##### Returns

`any`

##### Inherited from

`Room.onMessage`

#### Call Signature

> **onMessage**\<`T`\>(`messageType`, `callback`, `validate?`): `any`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:232

##### Type Parameters

###### T

`T` = `any`

##### Parameters

###### messageType

`string` \| `number`

###### callback

(`client`, `message`) => `void`

###### validate?

(`message`) => `T`

##### Returns

`any`

##### Inherited from

`Room.onMessage`

***

### onRestoreRoom()?

> `optional` **onRestoreRoom**(`cached?`): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:170

devMode: When `devMode` is enabled, `onRestoreRoom` method is called during
process startup, with the data returned by the `onCacheRoom` method.

#### Parameters

##### cached?

`any`

#### Returns

`void`

#### Inherited from

`Room.onRestoreRoom`

***

### onTurnChanged()

> `protected` **onTurnChanged**(): `void`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:400](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L400)

Subclass hook: called after nextTurn for game-specific events.

#### Returns

`void`

***

### onUncaughtException()?

> `optional` **onUncaughtException**(`error`, `methodName`): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:148

Define a custom exception handler.
If defined, all lifecycle hooks will be wrapped by try/catch, and the exception will be forwarded to this method.

These methods will be wrapped by try/catch:
- `onMessage`
- `onAuth` / `onJoin` / `onLeave` / `onCreate` / `onDispose`
- `clock.setTimeout` / `clock.setInterval`
- `setSimulationInterval`

(Experimental: this feature is subject to change in the future - we're currently getting feedback to improve it)

#### Parameters

##### error

`RoomException`\<`BaseGameRoom`\<`TState`, `TOptions`\>\>

##### methodName

`"onCreate"` \| `"onAuth"` \| `"onJoin"` \| `"onLeave"` \| `"onDispose"` \| `"onMessage"` \| `"setSimulationInterval"` \| `"setInterval"` \| `"setTimeout"`

#### Returns

`void`

#### Inherited from

`Room.onUncaughtException`

***

### parseOptions()

> `abstract` `protected` **parseOptions**(`raw`): `TOptions`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:76](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L76)

Subclass hook: extract typed options from the raw create payload.

#### Parameters

##### raw

`unknown`

#### Returns

`TOptions`

***

### resetAutoDisposeTimeout()

> `protected` **resetAutoDisposeTimeout**(`timeoutInSeconds?`): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:252

#### Parameters

##### timeoutInSeconds?

`number`

#### Returns

`void`

#### Inherited from

`Room.resetAutoDisposeTimeout`

***

### send()

> **send**(`client`, `type`, `message`, `options?`): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:221

#### Parameters

##### client

`Client`

##### type

`string` \| `number`

##### message

`any`

##### options?

`ISendOptions`

#### Returns

`void`

#### Inherited from

`Room.send`

***

### sendFullState()

> `protected` **sendFullState**(`client`): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:254

#### Parameters

##### client

`Client`

#### Returns

`void`

#### Inherited from

`Room.sendFullState`

***

### setMetadata()

> **setMetadata**(`meta`): `Promise`\<`void`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:211

#### Parameters

##### meta

`Partial`\<`Metadata`\>

#### Returns

`Promise`\<`void`\>

#### Inherited from

`Room.setMetadata`

***

### ~~setPatchRate()~~

> **setPatchRate**(`milliseconds`): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:205

#### Parameters

##### milliseconds

`number` \| `null`

#### Returns

`void`

#### Deprecated

Use `.patchRate=` instead.

#### Inherited from

`Room.setPatchRate`

***

### setPrivate()

> **setPrivate**(`bool?`): `Promise`\<`void`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:212

#### Parameters

##### bool?

`boolean`

#### Returns

`Promise`\<`void`\>

#### Inherited from

`Room.setPrivate`

***

### setSeatReservationTime()

> **setSeatReservationTime**(`seconds`): `this`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:188

Set the number of seconds a room can wait for a client to effectively join the room.
You should consider how long your `onAuth()` will have to wait for setting a different seat reservation time.
The default value is 15 seconds. You may set the `COLYSEUS_SEAT_RESERVATION_TIME`
environment variable if you'd like to change the seat reservation time globally.

#### Parameters

##### seconds

`number`

number of seconds.

#### Returns

`this`

The modified Room object.

#### Default

```ts
15 seconds
```

#### Inherited from

`Room.setSeatReservationTime`

***

### setSerializer()

> **setSerializer**(`serializer`): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:210

#### Parameters

##### serializer

`Serializer`\<`any`\>

#### Returns

`void`

#### Inherited from

`Room.setSerializer`

***

### setSimulationInterval()

> **setSimulationInterval**(`onTickCallback?`, `delay?`): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:201

(Optional) Set a simulation interval that can change the state of the game.
The simulation interval is your game loop.

#### Parameters

##### onTickCallback?

`SimulationCallback`

You can implement your physics or world updates here!
 This is a good place to update the room state.

##### delay?

`number`

Interval delay on executing `onTickCallback` in milliseconds.

#### Returns

`void`

#### Default

```ts
16.6ms (60fps)
```

#### Inherited from

`Room.setSimulationInterval`

***

### ~~setState()~~

> **setState**(`newState`): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:209

#### Parameters

##### newState

`any`

#### Returns

`void`

#### Deprecated

Use `.state =` instead.

#### Inherited from

`Room.setState`

***

### unlock()

> **unlock**(): `Promise`\<`void`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:220

Unlocking the room returns it to the pool of available rooms for new clients to connect to.

#### Returns

`Promise`\<`void`\>

#### Inherited from

`Room.unlock`

***

### onAuth()

> `static` **onAuth**(`token`, `options`, `context`): `Promise`\<`unknown`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:150

#### Parameters

##### token

`string`

##### options

`any`

##### context

`AuthContext`

#### Returns

`Promise`\<`unknown`\>

#### Inherited from

`Room.onAuth`
