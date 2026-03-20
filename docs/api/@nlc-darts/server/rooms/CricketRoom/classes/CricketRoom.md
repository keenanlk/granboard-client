[**Documentation**](../../../../../README.md)

***

[Documentation](../../../../../README.md) / [@nlc-darts/server](../../../README.md) / [rooms/CricketRoom](../README.md) / CricketRoom

# Class: CricketRoom

Defined in: [apps/server/src/rooms/CricketRoom.ts:15](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/CricketRoom.ts#L15)

Colyseus room for Cricket dart games.

## Extends

- [`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md)\<[`CricketState`](../../../../engine/src/engine/cricket.types.ts/interfaces/CricketState.md), [`CricketOptions`](../../../../engine/src/engine/cricket.types.ts/interfaces/CricketOptions.md)\>

## Constructors

### Constructor

> **new CricketRoom**(): `CricketRoom`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:99

#### Returns

`CricketRoom`

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`constructor`](../../BaseGameRoom/classes/BaseGameRoom.md#constructor)

## Properties

### \_events

> **\_events**: `EventEmitter`\<\[`never`\]\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:80

**`Internal`**

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`_events`](../../BaseGameRoom/classes/BaseGameRoom.md#_events)

***

### \_reconnections

> `protected` **\_reconnections**: `object`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:88

#### Index Signature

\[`reconnectionToken`: `string`\]: \[`string`, `Deferred`\<`any`\>\]

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`_reconnections`](../../BaseGameRoom/classes/BaseGameRoom.md#_reconnections)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`autoDispose`](../../BaseGameRoom/classes/BaseGameRoom.md#autodispose)

***

### clients

> **clients**: `ClientArray`\<`any`, `any`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:78

The array of connected clients.

#### See

[instance](https://docs.colyseus.io/colyseus/server/room/#client|Client)

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`clients`](../../BaseGameRoom/classes/BaseGameRoom.md#clients)

***

### clock

> **clock**: `ClockTimer`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:44

Timing events tied to the room instance.
Intervals and timeouts are cleared when the room is disposed.

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`clock`](../../BaseGameRoom/classes/BaseGameRoom.md#clock)

***

### engine

> `protected` **engine**: [`CricketEngine`](../../../../engine/src/engine/cricketEngine.ts/classes/CricketEngine.md) = `cricketEngine`

Defined in: [apps/server/src/rooms/CricketRoom.ts:16](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/CricketRoom.ts#L16)

Game engine that drives state transitions for this room type.

#### Overrides

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`engine`](../../BaseGameRoom/classes/BaseGameRoom.md#engine)

***

### gameOptions

> `protected` **gameOptions**: [`CricketOptions`](../../../../engine/src/engine/cricket.types.ts/interfaces/CricketOptions.md)

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:43](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L43)

Parsed game options for the current match.

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`gameOptions`](../../BaseGameRoom/classes/BaseGameRoom.md#gameoptions)

***

### gameState

> `protected` **gameState**: [`CricketState`](../../../../engine/src/engine/cricket.types.ts/interfaces/CricketState.md)

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:41](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L41)

Current authoritative game state.

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`gameState`](../../BaseGameRoom/classes/BaseGameRoom.md#gamestate)

***

### listing

> **listing**: `RoomCache`\<`any`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:39

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`listing`](../../BaseGameRoom/classes/BaseGameRoom.md#listing)

***

### log

> `protected` **log**: [`Logger`](../../../../logger/interfaces/Logger.md)

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:38](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L38)

Scoped logger instance for this room.

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`log`](../../BaseGameRoom/classes/BaseGameRoom.md#log)

***

### maxClients

> **maxClients**: `number`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:50

Maximum number of clients allowed to connect into the room. When room reaches this limit,
it is locked automatically. Unless the room was explicitly locked by you via `lock()` method,
the room will be unlocked as soon as a client disconnects from it.

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`maxClients`](../../BaseGameRoom/classes/BaseGameRoom.md#maxclients)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`patchRate`](../../BaseGameRoom/classes/BaseGameRoom.md#patchrate)

***

### playerIds

> `protected` **playerIds**: (`string` \| `null`)[] = `[]`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:51](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L51)

Supabase user IDs for each player (null for guests).

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`playerIds`](../../BaseGameRoom/classes/BaseGameRoom.md#playerids)

***

### playerMap

> `protected` **playerMap**: `Map`\<`string`, `number`\>

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:47](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L47)

Maps Colyseus session IDs to player seat indices.

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`playerMap`](../../BaseGameRoom/classes/BaseGameRoom.md#playermap)

***

### playerNames

> `protected` **playerNames**: `string`[] = `[]`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:49](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L49)

Ordered display names for each player.

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`playerNames`](../../BaseGameRoom/classes/BaseGameRoom.md#playernames)

***

### presence

> **presence**: `Presence`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:72

The presence instance. Check Presence API for more details.

#### See

[API](https://docs.colyseus.io/colyseus/server/presence/|Presence)

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`presence`](../../BaseGameRoom/classes/BaseGameRoom.md#presence)

***

### reservedSeats

> `protected` **reservedSeats**: `object`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:82

#### Index Signature

\[`sessionId`: `string`\]: \[`any`, `any`, `boolean`?, `boolean`?\]

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`reservedSeats`](../../BaseGameRoom/classes/BaseGameRoom.md#reservedseats)

***

### reservedSeatTimeouts

> `protected` **reservedSeatTimeouts**: `object`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:85

#### Index Signature

\[`sessionId`: `string`\]: `Timeout`

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`reservedSeatTimeouts`](../../BaseGameRoom/classes/BaseGameRoom.md#reservedseattimeouts)

***

### seatReservationTime

> `protected` **seatReservationTime**: `number`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:81

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`seatReservationTime`](../../BaseGameRoom/classes/BaseGameRoom.md#seatreservationtime)

***

### state

> **state**: `any`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:66

The state instance you provided to `setState()`.

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`state`](../../BaseGameRoom/classes/BaseGameRoom.md#state)

***

### supabaseRoomId

> `protected` **supabaseRoomId**: `string` \| `null` = `null`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:53](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L53)

Supabase room row ID for recording results, if available.

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`supabaseRoomId`](../../BaseGameRoom/classes/BaseGameRoom.md#supabaseroomid)

***

### undoStack

> `protected` **undoStack**: [`CricketState`](../../../../engine/src/engine/cricket.types.ts/interfaces/CricketState.md)[] = `[]`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:45](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L45)

Stack of previous states used for undo support.

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`undoStack`](../../BaseGameRoom/classes/BaseGameRoom.md#undostack)

## Accessors

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`locked`](../../BaseGameRoom/classes/BaseGameRoom.md#locked)

***

### metadata

#### Get Signature

> **get** **metadata**(): `Metadata`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:38

##### Returns

`Metadata`

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`metadata`](../../BaseGameRoom/classes/BaseGameRoom.md#metadata)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`roomId`](../../BaseGameRoom/classes/BaseGameRoom.md#roomid)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`roomName`](../../BaseGameRoom/classes/BaseGameRoom.md#roomname)

## Methods

### \_\_init()

> `protected` **\_\_init**(): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:104

**`Internal`**

This method is called by the MatchMaker before onCreate()

#### Returns

`void`

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`__init`](../../BaseGameRoom/classes/BaseGameRoom.md#__init)

***

### \_decrementClientCount()

> `protected` **\_decrementClientCount**(): `Promise`\<`boolean`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:264

#### Returns

`Promise`\<`boolean`\>

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`_decrementClientCount`](../../BaseGameRoom/classes/BaseGameRoom.md#_decrementclientcount)

***

### \_dequeueAfterPatchMessages()

> `protected` **\_dequeueAfterPatchMessages**(): `void`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:255

#### Returns

`void`

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`_dequeueAfterPatchMessages`](../../BaseGameRoom/classes/BaseGameRoom.md#_dequeueafterpatchmessages)

***

### \_dispose()

> `protected` **\_dispose**(): `Promise`\<`any`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:258

#### Returns

`Promise`\<`any`\>

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`_dispose`](../../BaseGameRoom/classes/BaseGameRoom.md#_dispose)

***

### \_disposeIfEmpty()

> `protected` **\_disposeIfEmpty**(): `boolean`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:257

#### Returns

`boolean`

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`_disposeIfEmpty`](../../BaseGameRoom/classes/BaseGameRoom.md#_disposeifempty)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`_forciblyCloseClient`](../../BaseGameRoom/classes/BaseGameRoom.md#_forciblycloseclient)

***

### \_incrementClientCount()

> `protected` **\_incrementClientCount**(): `Promise`\<`void`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:263

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`_incrementClientCount`](../../BaseGameRoom/classes/BaseGameRoom.md#_incrementclientcount)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`_onAfterLeave`](../../BaseGameRoom/classes/BaseGameRoom.md#_onafterleave)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`_onJoin`](../../BaseGameRoom/classes/BaseGameRoom.md#_onjoin)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`_onLeave`](../../BaseGameRoom/classes/BaseGameRoom.md#_onleave)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`_onMessage`](../../BaseGameRoom/classes/BaseGameRoom.md#_onmessage)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`_reserveSeat`](../../BaseGameRoom/classes/BaseGameRoom.md#_reserveseat)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`allowReconnection`](../../BaseGameRoom/classes/BaseGameRoom.md#allowreconnection)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`broadcast`](../../BaseGameRoom/classes/BaseGameRoom.md#broadcast)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`broadcastBytes`](../../BaseGameRoom/classes/BaseGameRoom.md#broadcastbytes)

***

### broadcastPatch()

> **broadcastPatch**(): `boolean`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:230

Checks whether mutations have occurred in the state, and broadcast them to all connected clients.

#### Returns

`boolean`

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`broadcastPatch`](../../BaseGameRoom/classes/BaseGameRoom.md#broadcastpatch)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`checkReconnectionToken`](../../BaseGameRoom/classes/BaseGameRoom.md#checkreconnectiontoken)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`disconnect`](../../BaseGameRoom/classes/BaseGameRoom.md#disconnect)

***

### emitGameEvents()

> `protected` **emitGameEvents**(`state`, `segment`): `void`

Defined in: [apps/server/src/rooms/CricketRoom.ts:28](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/CricketRoom.ts#L28)

Subclass hook: generate game events after a dart is processed.

#### Parameters

##### state

[`CricketState`](../../../../engine/src/engine/cricket.types.ts/interfaces/CricketState.md)

##### segment

[`Segment`](../../../../engine/src/board/Dartboard.ts/interfaces/Segment.md)

#### Returns

`void`

#### Overrides

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`emitGameEvents`](../../BaseGameRoom/classes/BaseGameRoom.md#emitgameevents)

***

### hasReachedMaxClients()

> **hasReachedMaxClients**(): `boolean`

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:176

Returns whether the sum of connected clients and reserved seats exceeds maximum number of clients.

#### Returns

`boolean`

boolean

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`hasReachedMaxClients`](../../BaseGameRoom/classes/BaseGameRoom.md#hasreachedmaxclients)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`hasReservedSeat`](../../BaseGameRoom/classes/BaseGameRoom.md#hasreservedseat)

***

### lock()

> **lock**(): `Promise`\<`void`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:216

Locking the room will remove it from the pool of available rooms for new clients to connect to.

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`lock`](../../BaseGameRoom/classes/BaseGameRoom.md#lock)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`onAuth`](../../BaseGameRoom/classes/BaseGameRoom.md#onauth)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`onBeforePatch`](../../BaseGameRoom/classes/BaseGameRoom.md#onbeforepatch)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`onBeforeShutdown`](../../BaseGameRoom/classes/BaseGameRoom.md#onbeforeshutdown)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`onCacheRoom`](../../BaseGameRoom/classes/BaseGameRoom.md#oncacheroom)

***

### onCreate()

> **onCreate**(`options`): `void`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:66](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L66)

#### Parameters

##### options

`RoomCreateOptions`

#### Returns

`void`

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`onCreate`](../../BaseGameRoom/classes/BaseGameRoom.md#oncreate)

***

### onDispose()

> **onDispose**(): `void`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:167](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L167)

#### Returns

`void`

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`onDispose`](../../BaseGameRoom/classes/BaseGameRoom.md#ondispose)

***

### onJoin()

> **onJoin**(`client`): `void`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:122](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L122)

#### Parameters

##### client

`Client`

#### Returns

`void`

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`onJoin`](../../BaseGameRoom/classes/BaseGameRoom.md#onjoin)

***

### onLeave()

> **onLeave**(`client`, `code?`): `Promise`\<`void`\>

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:136](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L136)

#### Parameters

##### client

`Client`

##### code?

`number`

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`onLeave`](../../BaseGameRoom/classes/BaseGameRoom.md#onleave)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`onMessage`](../../BaseGameRoom/classes/BaseGameRoom.md#onmessage)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`onMessage`](../../BaseGameRoom/classes/BaseGameRoom.md#onmessage)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`onRestoreRoom`](../../BaseGameRoom/classes/BaseGameRoom.md#onrestoreroom)

***

### onTurnChanged()

> `protected` **onTurnChanged**(): `void`

Defined in: [apps/server/src/rooms/CricketRoom.ts:51](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/CricketRoom.ts#L51)

Subclass hook: called after nextTurn for game-specific events.

#### Returns

`void`

#### Overrides

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`onTurnChanged`](../../BaseGameRoom/classes/BaseGameRoom.md#onturnchanged)

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

`RoomException`\<`CricketRoom`\>

##### methodName

`"onCreate"` \| `"onAuth"` \| `"onJoin"` \| `"onLeave"` \| `"onDispose"` \| `"onMessage"` \| `"setSimulationInterval"` \| `"setInterval"` \| `"setTimeout"`

#### Returns

`void`

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`onUncaughtException`](../../BaseGameRoom/classes/BaseGameRoom.md#onuncaughtexception)

***

### parseOptions()

> `protected` **parseOptions**(`raw`): [`CricketOptions`](../../../../engine/src/engine/cricket.types.ts/interfaces/CricketOptions.md)

Defined in: [apps/server/src/rooms/CricketRoom.ts:18](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/CricketRoom.ts#L18)

Subclass hook: extract typed options from the raw create payload.

#### Parameters

##### raw

`unknown`

#### Returns

[`CricketOptions`](../../../../engine/src/engine/cricket.types.ts/interfaces/CricketOptions.md)

#### Overrides

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`parseOptions`](../../BaseGameRoom/classes/BaseGameRoom.md#parseoptions)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`resetAutoDisposeTimeout`](../../BaseGameRoom/classes/BaseGameRoom.md#resetautodisposetimeout)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`send`](../../BaseGameRoom/classes/BaseGameRoom.md#send)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`sendFullState`](../../BaseGameRoom/classes/BaseGameRoom.md#sendfullstate)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`setMetadata`](../../BaseGameRoom/classes/BaseGameRoom.md#setmetadata)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`setPatchRate`](../../BaseGameRoom/classes/BaseGameRoom.md#setpatchrate)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`setPrivate`](../../BaseGameRoom/classes/BaseGameRoom.md#setprivate)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`setSeatReservationTime`](../../BaseGameRoom/classes/BaseGameRoom.md#setseatreservationtime)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`setSerializer`](../../BaseGameRoom/classes/BaseGameRoom.md#setserializer)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`setSimulationInterval`](../../BaseGameRoom/classes/BaseGameRoom.md#setsimulationinterval)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`setState`](../../BaseGameRoom/classes/BaseGameRoom.md#setstate)

***

### unlock()

> **unlock**(): `Promise`\<`void`\>

Defined in: node\_modules/.pnpm/@colyseus+core@0.16.24\_@colyseus+schema@3.0.76\_@pm2+io@6.1.0/node\_modules/@colyseus/core/build/Room.d.ts:220

Unlocking the room returns it to the pool of available rooms for new clients to connect to.

#### Returns

`Promise`\<`void`\>

#### Inherited from

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`unlock`](../../BaseGameRoom/classes/BaseGameRoom.md#unlock)

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

[`BaseGameRoom`](../../BaseGameRoom/classes/BaseGameRoom.md).[`onAuth`](../../BaseGameRoom/classes/BaseGameRoom.md#onauth-1)
