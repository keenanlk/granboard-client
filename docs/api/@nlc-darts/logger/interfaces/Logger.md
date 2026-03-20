[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/logger](../README.md) / Logger

# Interface: Logger

Defined in: [types.ts:2](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/logger/src/types.ts#L2)

Structured logger interface compatible with pino.

## Methods

### child()

> **child**(`bindings`): `Logger`

Defined in: [types.ts:12](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/logger/src/types.ts#L12)

Create a child logger with additional bound context.

#### Parameters

##### bindings

`Record`\<`string`, `unknown`\>

#### Returns

`Logger`

***

### debug()

> **debug**(`obj`, `msg?`): `void`

Defined in: [types.ts:4](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/logger/src/types.ts#L4)

Log a message at the debug level.

#### Parameters

##### obj

`Record`\<`string`, `unknown`\>

##### msg?

`string`

#### Returns

`void`

***

### error()

> **error**(`obj`, `msg?`): `void`

Defined in: [types.ts:10](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/logger/src/types.ts#L10)

Log a message at the error level.

#### Parameters

##### obj

`Record`\<`string`, `unknown`\>

##### msg?

`string`

#### Returns

`void`

***

### info()

> **info**(`obj`, `msg?`): `void`

Defined in: [types.ts:6](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/logger/src/types.ts#L6)

Log a message at the info level.

#### Parameters

##### obj

`Record`\<`string`, `unknown`\>

##### msg?

`string`

#### Returns

`void`

***

### warn()

> **warn**(`obj`, `msg?`): `void`

Defined in: [types.ts:8](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/logger/src/types.ts#L8)

Log a message at the warn level.

#### Parameters

##### obj

`Record`\<`string`, `unknown`\>

##### msg?

`string`

#### Returns

`void`
