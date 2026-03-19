import { describe, it, expect } from "vitest";
import {
  buildHitCommand,
  buildBlinkCommand,
  buildLightRingCommand,
  buildButtonPressCommand,
  buildPersistentNumbersCommand,
  buildClearCommand,
  Colors,
  LED_POSITIONS,
} from "./GranboardLED.ts";

describe("GranboardLED command builders", () => {
  // ── buildHitCommand ──

  it("buildHitCommand returns a 16-byte array", () => {
    const cmd = buildHitCommand(20, 1, Colors.RED);
    expect(cmd).toHaveLength(16);
  });

  it("buildHitCommand: byte[0] equals the multiplier", () => {
    expect(buildHitCommand(1, 1, Colors.RED)[0]).toBe(1);
    expect(buildHitCommand(1, 2, Colors.RED)[0]).toBe(2);
    expect(buildHitCommand(1, 3, Colors.RED)[0]).toBe(3);
  });

  it("buildHitCommand: bytes[1-3] contain the RGB color", () => {
    const cmd = buildHitCommand(5, 1, { r: 10, g: 20, b: 30 });
    expect(cmd[1]).toBe(10);
    expect(cmd[2]).toBe(20);
    expect(cmd[3]).toBe(30);
  });

  it("buildHitCommand: byte[10] is the LED position for the dart number", () => {
    const cmd = buildHitCommand(7, 1, Colors.GREEN);
    expect(cmd[10]).toBe(LED_POSITIONS[7]);
  });

  // ── buildLightRingCommand ──

  it("buildLightRingCommand: byte[0]=0x14 and byte[15]=0x01 (persistent)", () => {
    const cmd = buildLightRingCommand(Colors.BLUE);
    expect(cmd[0]).toBe(0x14);
    expect(cmd[15]).toBe(0x01);
  });

  it("buildLightRingCommand: RGB in bytes[1-3]", () => {
    const cmd = buildLightRingCommand({ r: 100, g: 150, b: 200 });
    expect(cmd[1]).toBe(100);
    expect(cmd[2]).toBe(150);
    expect(cmd[3]).toBe(200);
  });

  // ── buildBlinkCommand ──

  it("buildBlinkCommand: byte[0]=0x17", () => {
    const cmd = buildBlinkCommand(Colors.WHITE);
    expect(cmd[0]).toBe(0x17);
  });

  it("buildBlinkCommand: default duration 0x1E, custom duration overrides", () => {
    const defaultCmd = buildBlinkCommand(Colors.RED);
    expect(defaultCmd[12]).toBe(0x1e);

    const customCmd = buildBlinkCommand(Colors.RED, 0x40);
    expect(customCmd[12]).toBe(0x40);
  });

  // ── buildButtonPressCommand ──

  it("buildButtonPressCommand: byte[0]=0x11, primary RGB in [1-3], secondary RGB in [4-6]", () => {
    const cmd = buildButtonPressCommand(
      { r: 10, g: 20, b: 30 },
      { r: 40, g: 50, b: 60 },
    );
    expect(cmd[0]).toBe(0x11);
    expect(cmd[1]).toBe(10);
    expect(cmd[2]).toBe(20);
    expect(cmd[3]).toBe(30);
    expect(cmd[4]).toBe(40);
    expect(cmd[5]).toBe(50);
    expect(cmd[6]).toBe(60);
  });

  // ── buildPersistentNumbersCommand ──

  it("buildPersistentNumbersCommand: returns 20-byte array with correct bytes set", () => {
    const cmd = buildPersistentNumbersCommand([1, 5, 20], 0x05);
    expect(cmd).toHaveLength(20);
    expect(cmd[0]).toBe(0x05); // dart number 1 → index 0
    expect(cmd[4]).toBe(0x05); // dart number 5 → index 4
    expect(cmd[19]).toBe(0x05); // dart number 20 → index 19
    // All others should be 0
    expect(cmd[1]).toBe(0);
    expect(cmd[10]).toBe(0);
  });

  it("buildPersistentNumbersCommand: ignores out-of-range numbers", () => {
    const cmd = buildPersistentNumbersCommand([0, 21, -1, 100], 0x03);
    expect(cmd).toHaveLength(20);
    expect(cmd.every((b) => b === 0)).toBe(true);
  });

  // ── buildClearCommand ──

  it("buildClearCommand: returns 20 zeros", () => {
    const cmd = buildClearCommand();
    expect(cmd).toHaveLength(20);
    expect(cmd.every((b) => b === 0)).toBe(true);
  });
});
