[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / useAwardDetection

# Function: useAwardDetection()

> **useAwardDetection**(`trigger`, `detect`): \[[`AwardType`](../../engine/src/lib/awards.ts/type-aliases/AwardType.md) \| `null`, () => `void`\]

Defined in: [hooks/useAwardDetection.ts:10](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/apps/web/src/hooks/useAwardDetection.ts#L10)

Manages award detection state. When `trigger` flips to true, runs
the `detect` callback and stores the result as pendingAward.

Returns [pendingAward, dismissAward].

## Parameters

### trigger

`boolean`

### detect

() => [`AwardType`](../../engine/src/lib/awards.ts/type-aliases/AwardType.md) \| `null`

## Returns

\[[`AwardType`](../../engine/src/lib/awards.ts/type-aliases/AwardType.md) \| `null`, () => `void`\]
