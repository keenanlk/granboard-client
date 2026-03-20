[**Documentation**](../../../../../../README.md)

***

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/engine/cricket.types.ts](../README.md) / CricketOptions

# Interface: CricketOptions

Defined in: [engine/cricket.types.ts:9](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/cricket.types.ts#L9)

Configuration options for a Cricket game.

## Properties

### cutThroat

> **cutThroat**: `boolean`

Defined in: [engine/cricket.types.ts:15](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/cricket.types.ts#L15)

Cut-throat mode: points go to opponents, lowest score wins. Default: false.

***

### roundLimit

> **roundLimit**: `number`

Defined in: [engine/cricket.types.ts:13](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/cricket.types.ts#L13)

Maximum rounds per player. 0 = unlimited. Default: 20.

***

### singleBull

> **singleBull**: `boolean`

Defined in: [engine/cricket.types.ts:11](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/engine/cricket.types.ts#L11)

Both outer and inner bull count as 1 mark. Default: false (outer=1, inner=2).
