[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / Granboard

# Class: Granboard

Defined in: [board/Granboard.ts:236](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/board/Granboard.ts#L236)

BLE client for connecting to and communicating with a GranBoard dartboard.

## Constructors

### Constructor

> **new Granboard**(): `Granboard`

Defined in: [board/Granboard.ts:239](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/board/Granboard.ts#L239)

#### Returns

`Granboard`

## Properties

### segmentHitCallback?

> `optional` **segmentHitCallback?**: (`segment`) => `void`

Defined in: [board/Granboard.ts:237](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/board/Granboard.ts#L237)

#### Parameters

##### segment

[`Segment`](../../engine/src/board/Dartboard.ts/interfaces/Segment.md)

#### Returns

`void`

## Methods

### sendCommand()

> **sendCommand**(`bytes`): `Promise`\<`void`\>

Defined in: [board/Granboard.ts:253](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/board/Granboard.ts#L253)

#### Parameters

##### bytes

`number`[]

#### Returns

`Promise`\<`void`\>

***

### setSegmentHitCallback()

> **setSegmentHitCallback**(`cb`): `void`

Defined in: [board/Granboard.ts:247](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/board/Granboard.ts#L247)

#### Parameters

##### cb

((`segment`) => `void`) \| `undefined`

#### Returns

`void`

***

### ConnectToBoard()

> `static` **ConnectToBoard**(): `Promise`\<`Granboard`\>

Defined in: [board/Granboard.ts:267](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/board/Granboard.ts#L267)

#### Returns

`Promise`\<`Granboard`\>

***

### TryAutoReconnect()

> `static` **TryAutoReconnect**(): `Promise`\<`Granboard`\>

Defined in: [board/Granboard.ts:276](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/board/Granboard.ts#L276)

#### Returns

`Promise`\<`Granboard`\>
