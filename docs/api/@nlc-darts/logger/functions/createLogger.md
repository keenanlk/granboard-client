[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/logger](../README.md) / createLogger

# Function: createLogger()

> **createLogger**(`opts`): `Logger`\<`never`, `boolean`\>

Defined in: [index.ts:13](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/logger/src/index.ts#L13)

Create a pino logger instance.

## Parameters

### opts

#### browser?

`boolean`

When `true`, enables pino's browser transport.

#### level?

`string`

Minimum log level (defaults to `"info"`).

## Returns

`Logger`\<`never`, `boolean`\>

A configured pino [Logger](../interfaces/Logger.md).
