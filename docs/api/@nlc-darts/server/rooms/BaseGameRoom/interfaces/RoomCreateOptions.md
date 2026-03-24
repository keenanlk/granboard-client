[**Documentation**](../../../../../README.md)

***

[Documentation](../../../../../README.md) / [@nlc-darts/server](../../../README.md) / [rooms/BaseGameRoom](../README.md) / RoomCreateOptions

# Interface: RoomCreateOptions

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:29](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L29)

Options passed when creating a game room.

## Properties

### gameOptions

> **gameOptions**: `unknown`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:31](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L31)

Game-specific options blob, parsed by each room subclass.

***

### playerIds

> **playerIds**: (`string` \| `null`)[]

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:35](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L35)

Supabase user IDs for each player (null for guests).

***

### playerNames

> **playerNames**: `string`[]

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:33](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L33)

Display names for each player, ordered by seat index.

***

### roomId?

> `optional` **roomId?**: `string`

Defined in: [apps/server/src/rooms/BaseGameRoom.ts:37](https://github.com/keenanlk/granboard-client/blob/main/apps/server/src/rooms/BaseGameRoom.ts#L37)

Supabase room ID used to record match results.
