[**Documentation**](../../../README.md)

---

[Documentation](../../../README.md) / [@nlc-darts/web](../README.md) / GameEventMap

# Type Alias: GameEventMap

> **GameEventMap** = `object`

Defined in: [events/GameEvents.ts:4](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/events/GameEvents.ts#L4)

Map of game event names to their payload types.

## Properties

### bust

> **bust**: `Record`\<`string`, `never`\>

Defined in: [events/GameEvents.ts:6](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/events/GameEvents.ts#L6)

---

### dart_hit

> **dart_hit**: `object`

Defined in: [events/GameEvents.ts:5](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/events/GameEvents.ts#L5)

#### effectiveMarks?

> `optional` **effectiveMarks?**: `number`

#### segment

> **segment**: [`Segment`](../../engine/src/board/Dartboard.ts/interfaces/Segment.md)

---

### game_start

> **game_start**: `Record`\<`string`, `never`\>

Defined in: [events/GameEvents.ts:11](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/events/GameEvents.ts#L11)

---

### game_won

> **game_won**: `object`

Defined in: [events/GameEvents.ts:7](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/events/GameEvents.ts#L7)

#### playerName

> **playerName**: `string`

---

### next_turn

> **next_turn**: `Record`\<`string`, `never`\>

Defined in: [events/GameEvents.ts:8](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/events/GameEvents.ts#L8)

---

### open_numbers

> **open_numbers**: `object`

Defined in: [events/GameEvents.ts:10](https://github.com/keenanlk/granboard-client/blob/main/apps/web/src/events/GameEvents.ts#L10)

Cricket only: numbers the current player has open (closed by them, not yet by all)

#### numbers

> **numbers**: `number`[]
