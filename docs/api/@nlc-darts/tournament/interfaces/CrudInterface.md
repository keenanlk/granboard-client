[**Documentation**](../../../README.md)

***

[Documentation](../../../README.md) / [@nlc-darts/tournament](../README.md) / [](../README.md) / CrudInterface

# Interface: CrudInterface

Defined in: node\_modules/.pnpm/brackets-manager@1.9.1/node\_modules/brackets-manager/dist/types.d.ts:139

This CRUD interface is used by the manager to abstract storage.

## Methods

### delete()

#### Call Signature

> **delete**\<`T`\>(`table`): `Promise`\<`boolean`\>

Defined in: node\_modules/.pnpm/brackets-manager@1.9.1/node\_modules/brackets-manager/dist/types.d.ts:195

Empties a table completely.

##### Type Parameters

###### T

`T` *extends* keyof [`DataTypes`](DataTypes.md)

##### Parameters

###### table

`T`

Where to delete everything.

##### Returns

`Promise`\<`boolean`\>

#### Call Signature

> **delete**\<`T`\>(`table`, `filter`): `Promise`\<`boolean`\>

Defined in: node\_modules/.pnpm/brackets-manager@1.9.1/node\_modules/brackets-manager/dist/types.d.ts:202

Delete data in a table, based on a filter.

##### Type Parameters

###### T

`T` *extends* keyof [`DataTypes`](DataTypes.md)

##### Parameters

###### table

`T`

Where to delete in.

###### filter

`Partial`\<[`DataTypes`](DataTypes.md)\[`T`\]\>

An object to filter data.

##### Returns

`Promise`\<`boolean`\>

***

### insert()

#### Call Signature

> **insert**\<`T`\>(`table`, `value`): `Promise`\<`number`\>

Defined in: node\_modules/.pnpm/brackets-manager@1.9.1/node\_modules/brackets-manager/dist/types.d.ts:146

Inserts a value in the database and returns its id.

##### Type Parameters

###### T

`T` *extends* keyof [`DataTypes`](DataTypes.md)

##### Parameters

###### table

`T`

Where to insert.

###### value

`OmitId`\<[`DataTypes`](DataTypes.md)\[`T`\]\>

What to insert.

##### Returns

`Promise`\<`number`\>

#### Call Signature

> **insert**\<`T`\>(`table`, `values`): `Promise`\<`boolean`\>

Defined in: node\_modules/.pnpm/brackets-manager@1.9.1/node\_modules/brackets-manager/dist/types.d.ts:153

Inserts multiple values in the database.

##### Type Parameters

###### T

`T` *extends* keyof [`DataTypes`](DataTypes.md)

##### Parameters

###### table

`T`

Where to insert.

###### values

`OmitId`\<[`DataTypes`](DataTypes.md)\[`T`\]\>[]

What to insert.

##### Returns

`Promise`\<`boolean`\>

***

### select()

#### Call Signature

> **select**\<`T`\>(`table`): `Promise`\<[`DataTypes`](DataTypes.md)\[`T`\][] \| `null`\>

Defined in: node\_modules/.pnpm/brackets-manager@1.9.1/node\_modules/brackets-manager/dist/types.d.ts:159

Gets all data from a table in the database.

##### Type Parameters

###### T

`T` *extends* keyof [`DataTypes`](DataTypes.md)

##### Parameters

###### table

`T`

Where to get from.

##### Returns

`Promise`\<[`DataTypes`](DataTypes.md)\[`T`\][] \| `null`\>

#### Call Signature

> **select**\<`T`\>(`table`, `id`): `Promise`\<[`DataTypes`](DataTypes.md)\[`T`\] \| `null`\>

Defined in: node\_modules/.pnpm/brackets-manager@1.9.1/node\_modules/brackets-manager/dist/types.d.ts:166

Gets specific data from a table in the database.

##### Type Parameters

###### T

`T` *extends* keyof [`DataTypes`](DataTypes.md)

##### Parameters

###### table

`T`

Where to get from.

###### id

`Id`

What to get.

##### Returns

`Promise`\<[`DataTypes`](DataTypes.md)\[`T`\] \| `null`\>

#### Call Signature

> **select**\<`T`\>(`table`, `filter`): `Promise`\<[`DataTypes`](DataTypes.md)\[`T`\][] \| `null`\>

Defined in: node\_modules/.pnpm/brackets-manager@1.9.1/node\_modules/brackets-manager/dist/types.d.ts:173

Gets data from a table in the database with a filter.

##### Type Parameters

###### T

`T` *extends* keyof [`DataTypes`](DataTypes.md)

##### Parameters

###### table

`T`

Where to get from.

###### filter

`Partial`\<[`DataTypes`](DataTypes.md)\[`T`\]\>

An object to filter data.

##### Returns

`Promise`\<[`DataTypes`](DataTypes.md)\[`T`\][] \| `null`\>

***

### update()

#### Call Signature

> **update**\<`T`\>(`table`, `id`, `value`): `Promise`\<`boolean`\>

Defined in: node\_modules/.pnpm/brackets-manager@1.9.1/node\_modules/brackets-manager/dist/types.d.ts:181

Updates data in a table.

##### Type Parameters

###### T

`T` *extends* keyof [`DataTypes`](DataTypes.md)

##### Parameters

###### table

`T`

Where to update.

###### id

`Id`

What to update.

###### value

[`DataTypes`](DataTypes.md)\[`T`\]

How to update.

##### Returns

`Promise`\<`boolean`\>

#### Call Signature

> **update**\<`T`\>(`table`, `filter`, `value`): `Promise`\<`boolean`\>

Defined in: node\_modules/.pnpm/brackets-manager@1.9.1/node\_modules/brackets-manager/dist/types.d.ts:189

Updates data in a table.

##### Type Parameters

###### T

`T` *extends* keyof [`DataTypes`](DataTypes.md)

##### Parameters

###### table

`T`

Where to update.

###### filter

`Partial`\<[`DataTypes`](DataTypes.md)\[`T`\]\>

An object to filter data.

###### value

`Partial`\<[`DataTypes`](DataTypes.md)\[`T`\]\>

How to update.

##### Returns

`Promise`\<`boolean`\>
