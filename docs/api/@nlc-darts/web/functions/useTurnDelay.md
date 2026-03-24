[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / useTurnDelay

# Function: useTurnDelay()

> **useTurnDelay**(`online?`): `object`

Defined in: [hooks/useTurnDelay.ts:16](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/hooks/useTurnDelay.ts#L16)

Manages the between-turn delay (remove darts countdown).
Call triggerDelay(afterDelay) to start the overlay + LED countdown.
afterDelay is called once the countdown finishes.

## Parameters

### online?

`boolean` = `false`

When true, uses a shorter delay (2.5s) and hides the
               numeric countdown — only shows who's up next.

## Returns

`object`

### countdown

> **countdown**: `number`

### isTransitioning

> **isTransitioning**: `boolean`

### triggerDelay

> **triggerDelay**: (`afterDelay`) => `void`

#### Parameters

##### afterDelay

() => `void`

#### Returns

`void`
