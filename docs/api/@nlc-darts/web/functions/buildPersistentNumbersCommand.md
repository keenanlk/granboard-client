[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / buildPersistentNumbersCommand

# Function: buildPersistentNumbersCommand()

> **buildPersistentNumbersCommand**(`dartNumbers`, `colorByte`): `number`[]

Defined in: [board/GranboardLED.ts:150](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/board/GranboardLED.ts#L150)

Persistently light a set of dart numbers using the 20-byte direct state format
(same format as buildClearCommand). Byte index n-1 = dart number n; non-zero
byte = lit, 0 = off. No timeout — stays lit until cleared or overwritten.
Only covers numbers 1–20; bull is not addressable via this format.
colorByte: board color index (0x01–0x07, exact mapping TBD by testing).

## Parameters

### dartNumbers

`number`[]

### colorByte

`number`

## Returns

`number`[]
