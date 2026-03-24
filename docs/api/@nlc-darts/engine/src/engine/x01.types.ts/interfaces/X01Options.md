[**Documentation**](../../../../../../README.md)

---

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/engine/x01.types.ts](../README.md) / X01Options

# Interface: X01Options

Defined in: [engine/x01.types.ts:4](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L4)

Configuration options for an X01 game (301, 501, 701).

## Properties

### doubleIn

> **doubleIn**: `boolean`

Defined in: [engine/x01.types.ts:13](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L13)

Must hit a double (or bull) before scoring begins. Default: false.

---

### doubleOut

> **doubleOut**: `boolean`

Defined in: [engine/x01.types.ts:9](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L9)

Final dart must be a double (or bull) to win. Default: false.

---

### masterOut

> **masterOut**: `boolean`

Defined in: [engine/x01.types.ts:11](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L11)

Final dart must be a double, triple, or bull to win. Default: false.

---

### splitBull

> **splitBull**: `boolean`

Defined in: [engine/x01.types.ts:7](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L7)

When false (default), outer bull scores 50 same as double bull. When true, bulls are split (outer = 25, inner = 50).

---

### startingScore

> **startingScore**: `301` \| `501` \| `701`

Defined in: [engine/x01.types.ts:5](https://github.com/keenanlk/granboard-client/blob/main/packages/engine/src/engine/x01.types.ts#L5)
