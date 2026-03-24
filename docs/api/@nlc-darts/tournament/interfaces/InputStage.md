[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/tournament](../README.md) / [](../README.md) / InputStage

# Interface: InputStage

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/input.d.ts:28

Used to create a stage.

## Properties

### name

> **name**: `string`

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/input.d.ts:36

Name of the stage.

***

### number?

> `optional` **number?**: `number`

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/input.d.ts:40

The number of the stage in its tournament. Is determined if not given.

***

### seeding?

> `optional` **seeding?**: `Seeding`

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/input.d.ts:42

Contains participants or `null` for BYEs.

***

### seedingIds?

> `optional` **seedingIds?**: `IdSeeding`

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/input.d.ts:43

***

### settings?

> `optional` **settings?**: `StageSettings`

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/input.d.ts:45

Contains optional settings specific to each stage type.

***

### tournamentId

> **tournamentId**: `Id`

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/input.d.ts:34

ID of the parent tournament.

Used to determine the `number` property of a stage related to a tournament.

***

### type

> **type**: [`StageType`](../type-aliases/StageType.md)

Defined in: node\_modules/.pnpm/brackets-model@1.6.2/node\_modules/brackets-model/dist/input.d.ts:38

Type of stage.
