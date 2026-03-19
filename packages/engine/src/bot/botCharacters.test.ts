import { describe, it, expect } from "vitest";
import { getBotCharacter, getAllCharacters } from "./botCharacters.ts";
import { BotSkill } from "./bot.types.ts";

describe("getBotCharacter", () => {
  it("returns 'Flicker' for Beginner", () => {
    expect(getBotCharacter(BotSkill.Beginner).name).toBe("Flicker");
  });

  it("returns 'Glow' for Intermediate", () => {
    expect(getBotCharacter(BotSkill.Intermediate).name).toBe("Glow");
  });

  it("returns 'Buzz' for Club", () => {
    expect(getBotCharacter(BotSkill.Club).name).toBe("Buzz");
  });

  it("returns 'Flash' for County", () => {
    expect(getBotCharacter(BotSkill.County).name).toBe("Flash");
  });

  it("returns 'Volt' for Advanced", () => {
    expect(getBotCharacter(BotSkill.Advanced).name).toBe("Volt");
  });

  it("returns 'Blaze' for SemiPro", () => {
    expect(getBotCharacter(BotSkill.SemiPro).name).toBe("Blaze");
  });

  it("returns 'Nova' for Pro", () => {
    expect(getBotCharacter(BotSkill.Pro).name).toBe("Nova");
  });

  it("falls back to Intermediate character for unknown skill", () => {
    const character = getBotCharacter(999 as typeof BotSkill.Beginner);
    expect(character.name).toBe("Glow");
  });
});

describe("getAllCharacters", () => {
  it("returns exactly 7 entries", () => {
    expect(getAllCharacters()).toHaveLength(7);
  });

  it("returns entries in tier order (Beginner first, Pro last)", () => {
    const all = getAllCharacters();
    expect(all[0].skill).toBe(BotSkill.Beginner);
    expect(all[6].skill).toBe(BotSkill.Pro);
  });

  it("each entry has skill and character with expected properties", () => {
    for (const entry of getAllCharacters()) {
      expect(entry).toHaveProperty("skill");
      expect(entry).toHaveProperty("character");
      expect(entry.character).toHaveProperty("name");
      expect(entry.character).toHaveProperty("label");
      expect(entry.character).toHaveProperty("color");
      expect(entry.character).toHaveProperty("glow");
      expect(entry.character).toHaveProperty("dim");
      expect(entry.character).toHaveProperty("animationClass");
      expect(entry.character).toHaveProperty("ppd");
    }
  });
});
