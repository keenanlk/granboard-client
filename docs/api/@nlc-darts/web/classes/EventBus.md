[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / EventBus

# Class: EventBus\<EventMap\>

Defined in: [events/gameEventBus.ts:5](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/events/gameEventBus.ts#L5)

## Type Parameters

### EventMap

`EventMap` *extends* `Record`\<`string`, `unknown`\>

## Constructors

### Constructor

> **new EventBus**\<`EventMap`\>(): `EventBus`\<`EventMap`\>

#### Returns

`EventBus`\<`EventMap`\>

## Methods

### emit()

> **emit**\<`K`\>(`type`, `payload`): `void`

Defined in: [events/gameEventBus.ts:24](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/events/gameEventBus.ts#L24)

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### type

`K`

##### payload

`EventMap`\[`K`\]

#### Returns

`void`

***

### off()

> **off**\<`K`\>(`type`, `handler`): `void`

Defined in: [events/gameEventBus.ts:17](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/events/gameEventBus.ts#L17)

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### type

`K`

##### handler

[`Handler`](../type-aliases/Handler.md)\<`EventMap`\[`K`\]\>

#### Returns

`void`

***

### on()

> **on**\<`K`\>(`type`, `handler`): () => `void`

Defined in: [events/gameEventBus.ts:8](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/events/gameEventBus.ts#L8)

#### Type Parameters

##### K

`K` *extends* `string`

#### Parameters

##### type

`K`

##### handler

[`Handler`](../type-aliases/Handler.md)\<`EventMap`\[`K`\]\>

#### Returns

() => `void`
