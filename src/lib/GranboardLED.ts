/**
 * Granboard LED command builders — reverse-engineered from leds.cpp (BoardLed library).
 *
 * All commands are 16 bytes except clear() which is 20 bytes.
 * Byte layout for 16-byte commands:
 *   [0]      command type
 *   [1-3]    primary RGB
 *   [4-6]    secondary RGB (animations only)
 *   [7-9]    0x00
 *   [10]     LED ring cell position (0-59)
 *   [11]     0x00
 *   [12]     duration / speed
 *   [13-14]  0x00
 *   [15]     flag (0x00 or 0x01)
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export const Colors = {
  RED: { r: 255, g: 0, b: 0 },
  GREEN: { r: 0, g: 255, b: 0 },
  BLUE: { r: 0, g: 0, b: 255 },
  WHITE: { r: 255, g: 255, b: 255 },
  YELLOW: { r: 255, g: 200, b: 0 },
  ORANGE: { r: 255, g: 80, b: 0 },
  LIGHT_BLUE: { r: 0, g: 200, b: 255 },
} as const;

/**
 * Maps dart number (1–20) to LED ring cell position.
 * Index 0 = bull (center, position 0).
 * Source: ledpos[21] in leds.cpp
 */
export const LED_POSITIONS = [
  0, // 0 = bull
  28, // 1
  49, // 2
  55, // 3
  34, // 4
  22, // 5
  40, // 6
  1, // 7
  7, // 8
  16, // 9
  43, // 10
  10, // 11
  19, // 12
  37, // 13
  13, // 14
  46, // 15
  4, // 16
  52, // 17
  31, // 18
  58, // 19
  25, // 20
] as const;

function cmd16(overrides: Record<number, number>): number[] {
  const out = new Array<number>(16).fill(0);
  for (const [i, v] of Object.entries(overrides)) {
    out[Number(i)] = v;
  }
  return out;
}

/**
 * Light a single segment (single=0x01, double=0x02, triple=0x03).
 * Used to highlight where a dart landed.
 */
export function buildHitCommand(
  dartNumber: number, // 1–20, or 0 for bull
  multiplier: 1 | 2 | 3,
  color: RGB,
): number[] {
  const cell = LED_POSITIONS[dartNumber] ?? 0;
  return cmd16({
    0: multiplier, // 0x01 / 0x02 / 0x03
    1: color.r,
    2: color.g,
    3: color.b,
    10: cell,
    12: 0x14, // duration ≈ 20 frames
  });
}

/**
 * Light the entire ring with one color. Never switches off automatically.
 * Source: lightRing() in leds.cpp
 */
export function buildLightRingCommand(color: RGB): number[] {
  return cmd16({
    0: 0x14,
    1: color.r,
    2: color.g,
    3: color.b,
    12: 0x14,
    15: 0x01,
  });
}

/**
 * Blink the entire ring then switch off after a delay.
 * Used for bull hits, busts, etc.
 * Source: blinkBull() / blinkOut() in leds.cpp
 */
export function buildBlinkCommand(color: RGB, duration = 0x1e): number[] {
  return cmd16({
    0: 0x17,
    1: color.r,
    2: color.g,
    3: color.b,
    12: duration,
    15: 0x01,
  });
}

/**
 * Wave animation triggered by the board button press.
 * Source: pressButton() in leds.cpp
 */
export function buildButtonPressCommand(
  colorUp: RGB,
  colorDown: RGB,
): number[] {
  return cmd16({
    0: 0x11,
    1: colorUp.r,
    2: colorUp.g,
    3: colorUp.b,
    4: colorDown.r,
    5: colorDown.g,
    6: colorDown.b,
    10: 0x10,
    12: 0x05,
  });
}

/**
 * Turn off all LEDs.
 * Source: clear() in leds.cpp  (note: 20 bytes, not 16)
 */
export function buildClearCommand(): number[] {
  return new Array<number>(20).fill(0);
}
