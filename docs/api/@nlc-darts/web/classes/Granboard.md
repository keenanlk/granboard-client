[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / Granboard

# Class: Granboard

Defined in: [board/Granboard.ts:242](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/board/Granboard.ts#L242)

BLE client for connecting to and communicating with a GranBoard dartboard.

## Constructors

### Constructor

> **new Granboard**(): `Granboard`

Defined in: [board/Granboard.ts:245](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/board/Granboard.ts#L245)

#### Returns

`Granboard`

## Properties

### segmentHitCallback?

> `optional` **segmentHitCallback?**: (`segment`) => `void`

Defined in: [board/Granboard.ts:243](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/board/Granboard.ts#L243)

#### Parameters

##### segment

[`Segment`](../../engine/src/board/Dartboard.ts/interfaces/Segment.md)

#### Returns

`void`

## Methods

### sendCommand()

> **sendCommand**(`bytes`): `Promise`\<`void`\>

Defined in: [board/Granboard.ts:259](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/board/Granboard.ts#L259)

#### Parameters

##### bytes

`number`[]

#### Returns

`Promise`\<`void`\>

***

### setSegmentHitCallback()

> **setSegmentHitCallback**(`cb`): `void`

Defined in: [board/Granboard.ts:253](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/board/Granboard.ts#L253)

#### Parameters

##### cb

((`segment`) => `void`) \| `undefined`

#### Returns

`void`

***

### ConnectToBoard()

> `static` **ConnectToBoard**(): `Promise`\<`Granboard`\>

Defined in: [board/Granboard.ts:273](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/board/Granboard.ts#L273)

#### Returns

`Promise`\<`Granboard`\>

***

### TryAutoReconnect()

> `static` **TryAutoReconnect**(): `Promise`\<`Granboard`\>

Defined in: [board/Granboard.ts:282](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/board/Granboard.ts#L282)

#### Returns

`Promise`\<`Granboard`\>
