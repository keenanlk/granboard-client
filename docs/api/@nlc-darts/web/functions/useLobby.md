[**Documentation**](../../../README.md)

---

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / useLobby

# Function: useLobby()

> **useLobby**(): `object`

Defined in: [hooks/useLobby.ts:8](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useLobby.ts#L8)

Manages lobby lifecycle: auto-expire invites, countdown timers.

## Returns

`object`

### acceptInvite

> **acceptInvite**: (`invite`) => `void` = `handleAcceptInvite`

#### Parameters

##### invite

[`Invite`](../interfaces/Invite.md)

#### Returns

`void`

### connectionStatus

> **connectionStatus**: `ConnectionStatus`

### currentRoom

> **currentRoom**: [`Room`](../interfaces/Room.md) \| `null`

### declineInvite

> **declineInvite**: (`invite`) => `void` = `handleDeclineInvite`

#### Parameters

##### invite

[`Invite`](../interfaces/Invite.md)

#### Returns

`void`

### dismissSentInvite

> **dismissSentInvite**: () => `void`

#### Returns

`void`

### goOffline

> **goOffline**: () => `Promise`\<`void`\>

#### Returns

`Promise`\<`void`\>

### goOnline

> **goOnline**: (`displayName`) => `Promise`\<`void`\>

#### Parameters

##### displayName

`string`

#### Returns

`Promise`\<`void`\>

### onlinePlayers

> **onlinePlayers**: [`OnlinePlayer`](../interfaces/OnlinePlayer.md)[]

### pendingInvite

> **pendingInvite**: [`Invite`](../interfaces/Invite.md) \| `null`

### receivedCountdown

> **receivedCountdown**: `number` \| `null`

### sendInvite

> **sendInvite**: (`toId`, `gameType`, `gameOptions`) => `void` = `handleSendInvite`

#### Parameters

##### toId

`string`

##### gameType

[`OnlineGameType`](../type-aliases/OnlineGameType.md)

##### gameOptions

`unknown`

#### Returns

`void`

### sentCountdown

> **sentCountdown**: `number` \| `null`

### sentInvite

> **sentInvite**: [`Invite`](../interfaces/Invite.md) \| `null`
