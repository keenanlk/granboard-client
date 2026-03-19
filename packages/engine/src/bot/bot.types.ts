/**
 * Bot skill levels expressed as throw standard deviation (σ) in mm.
 * Lower σ = tighter grouping = more accurate.
 *
 * Calibrated for Granboard soft-tip dimensions (BDO/WDF playing area).
 * PPD measured via `npm run sim` (501, 1000-game average):
 *   Beginner    100mm — casual player, wide scatter                               (~10 PPD)
 *   Intermediate 36mm — regular pub player, lands in the right region              (~16 PPD)
 *   Club         28mm — league/club player, often hits intended number             (~19.5 PPD)
 *   County       24mm — competitive club player                                    (~22.5 PPD)
 *   Advanced     20mm — strong club player, consistent in the right segment        (~26 PPD)
 *   SemiPro    15.5mm — county/semi-pro, reliably hits intended ring               (~33 PPD)
 *   Pro          11mm — elite player, tight grouping                               (~42 PPD)
 */
export const BotSkill = {
  Beginner: 100,
  Intermediate: 36,
  Club: 28,
  County: 24,
  Advanced: 20,
  SemiPro: 15.5,
  Pro: 11,
} as const;
export type BotSkill = (typeof BotSkill)[keyof typeof BotSkill];
