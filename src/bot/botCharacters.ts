import type { BotSkill } from "./throwSimulator.ts";
import { BotSkill as Skills } from "./throwSimulator.ts";

export interface BotCharacter {
  /** Display name shown on scoreboard */
  name: string;
  /** Short label for skill selector badges */
  label: string;
  /** Neon color (CSS color value) */
  color: string;
  /** Glow color for box-shadow / text-shadow (usually same hue, lower opacity) */
  glow: string;
  /** Dim background tint */
  dim: string;
  /** CSS animation class name (defined in index.css) */
  animationClass: string;
  /** Estimated PPD for display */
  ppd: string;
}

const CHARACTERS: Record<number, BotCharacter> = {
  [Skills.Beginner]: {
    name: "Flicker",
    label: "FLICKER",
    color: "#b8a080",
    glow: "rgba(184, 160, 128, 0.4)",
    dim: "rgba(184, 160, 128, 0.08)",
    animationClass: "neon-flicker",
    ppd: "~12",
  },
  [Skills.Intermediate]: {
    name: "Glow",
    label: "GLOW",
    color: "#f472b6",
    glow: "rgba(244, 114, 182, 0.5)",
    dim: "rgba(244, 114, 182, 0.08)",
    animationClass: "neon-glow",
    ppd: "~17",
  },
  [Skills.Club]: {
    name: "Buzz",
    label: "BUZZ",
    color: "#4ade80",
    glow: "rgba(74, 222, 128, 0.5)",
    dim: "rgba(74, 222, 128, 0.08)",
    animationClass: "neon-buzz",
    ppd: "~22",
  },
  [Skills.County]: {
    name: "Flash",
    label: "FLASH",
    color: "#22d3ee",
    glow: "rgba(34, 211, 238, 0.5)",
    dim: "rgba(34, 211, 238, 0.08)",
    animationClass: "neon-flash",
    ppd: "~26",
  },
  [Skills.Advanced]: {
    name: "Volt",
    label: "VOLT",
    color: "#818cf8",
    glow: "rgba(129, 140, 248, 0.6)",
    dim: "rgba(129, 140, 248, 0.1)",
    animationClass: "neon-volt",
    ppd: "~32",
  },
  [Skills.SemiPro]: {
    name: "Blaze",
    label: "BLAZE",
    color: "#fb923c",
    glow: "rgba(251, 146, 60, 0.6)",
    dim: "rgba(251, 146, 60, 0.1)",
    animationClass: "neon-blaze",
    ppd: "~39",
  },
  [Skills.Pro]: {
    name: "Nova",
    label: "NOVA",
    color: "#fbbf24",
    glow: "rgba(251, 191, 36, 0.7)",
    dim: "rgba(251, 191, 36, 0.12)",
    animationClass: "neon-nova",
    ppd: "~47",
  },
};

/** Get the neon character for a bot skill level */
export function getBotCharacter(skill: BotSkill): BotCharacter {
  return CHARACTERS[skill] ?? CHARACTERS[Skills.Intermediate];
}

/** Get all characters in tier order (lowest to highest) */
export function getAllCharacters(): Array<{
  skill: BotSkill;
  character: BotCharacter;
}> {
  return [
    { skill: Skills.Beginner, character: CHARACTERS[Skills.Beginner] },
    { skill: Skills.Intermediate, character: CHARACTERS[Skills.Intermediate] },
    { skill: Skills.Club, character: CHARACTERS[Skills.Club] },
    { skill: Skills.County, character: CHARACTERS[Skills.County] },
    { skill: Skills.Advanced, character: CHARACTERS[Skills.Advanced] },
    { skill: Skills.SemiPro, character: CHARACTERS[Skills.SemiPro] },
    { skill: Skills.Pro, character: CHARACTERS[Skills.Pro] },
  ];
}
