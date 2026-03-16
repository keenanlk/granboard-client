/**
 * Granboard LED command builders
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

/** Board color palette index for orange (used with 20-byte persistent state commands). */
export const LED_COLOR_ORANGE = 0x05;

/**
 * Maps dart number (1–20) to LED ring cell position.
 * Index 0 = bull (center, position 0).
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
 * Persistently light a set of dart numbers using the 20-byte direct state format
 * (same format as buildClearCommand). Byte index n-1 = dart number n; non-zero
 * byte = lit, 0 = off. No timeout — stays lit until cleared or overwritten.
 * Only covers numbers 1–20; bull is not addressable via this format.
 * colorByte: board color index (0x01–0x07, exact mapping TBD by testing).
 */
export function buildPersistentNumbersCommand(
  dartNumbers: number[],
  colorByte: number,
): number[] {
  const out = new Array<number>(20).fill(0);
  for (const n of dartNumbers) {
    if (n >= 1 && n <= 20) {
      out[n - 1] = colorByte;
    }
  }
  return out;
}

/**
 * Turn off all LEDs.
 */
export function buildClearCommand(): number[] {
  return new Array<number>(20).fill(0);
}
