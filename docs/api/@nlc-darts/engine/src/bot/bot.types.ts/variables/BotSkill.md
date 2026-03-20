[**Documentation**](../../../../../../README.md)

***

[Documentation](../../../../../../README.md) / [@nlc-darts/engine](../../../../README.md) / [src/bot/bot.types.ts](../README.md) / BotSkill

# Variable: BotSkill

> `const` **BotSkill**: `object`

Defined in: [bot/bot.types.ts:15](https://github.com/keenanlk/granboard-client/blob/f6e472bfd4df75add5b30dc8b55157c64591398f/packages/engine/src/bot/bot.types.ts#L15)

Bot skill levels expressed as throw standard deviation (σ) in mm.
Lower σ = tighter grouping = more accurate.

Calibrated for Granboard soft-tip dimensions (BDO/WDF playing area).
PPD measured via `npm run sim` (501, 1000-game average):
  Beginner    100mm — casual player, wide scatter                               (~10 PPD)
  Intermediate 36mm — regular pub player, lands in the right region              (~16 PPD)
  Club         28mm — league/club player, often hits intended number             (~19.5 PPD)
  County       24mm — competitive club player                                    (~22.5 PPD)
  Advanced     20mm — strong club player, consistent in the right segment        (~26 PPD)
  SemiPro    15.5mm — county/semi-pro, reliably hits intended ring               (~33 PPD)
  Pro          11mm — elite player, tight grouping                               (~42 PPD)

## Type Declaration

### Advanced

> `readonly` **Advanced**: `20` = `20`

### Beginner

> `readonly` **Beginner**: `100` = `100`

### Club

> `readonly` **Club**: `28` = `28`

### County

> `readonly` **County**: `24` = `24`

### Intermediate

> `readonly` **Intermediate**: `36` = `36`

### Pro

> `readonly` **Pro**: `11` = `11`

### SemiPro

> `readonly` **SemiPro**: `15.5` = `15.5`
