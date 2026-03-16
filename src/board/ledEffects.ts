import { gameEventBus } from "../events/gameEventBus.ts";
import { SegmentSection, SegmentType } from "./Dartboard.ts";
import {
  buildBlinkCommand,
  buildButtonPressCommand,
  buildClearCommand,
  buildHitCommand,
  buildPersistentNumbersCommand,
  Colors,
  LED_COLOR_ORANGE,
  LED_POSITIONS,
} from "./GranboardLED.ts";
import type { RGB } from "./GranboardLED.ts";
import { useGranboardStore } from "../store/useGranboardStore.ts";

/**
 * Dart numbers sorted by LED ring position descending (pos 58 → pos 1).
 * Used to animate a depleting ring during the remove-darts countdown.
 */
const REMOVE_DARTS_ORDER = [19, 3, 17, 2, 15, 10, 6, 13, 4, 18, 1, 20, 5, 12, 9, 14, 11, 8, 16, 7];

let removeDartsTimer: ReturnType<typeof setInterval> | null = null;

/** Light the full ring and deplete it over durationMs to signal "remove your darts". */
export function startRemoveDartsCountdown(durationMs: number): void {
  const board = useGranboardStore.getState().board;
  if (!board) return;

  if (removeDartsTimer !== null) {
    clearInterval(removeDartsTimer);
    removeDartsTimer = null;
  }

  const steps = REMOVE_DARTS_ORDER.length; // 20
  const intervalMs = Math.floor(durationMs / steps);
  let remaining = [...REMOVE_DARTS_ORDER];

  void board.sendCommand(buildPersistentNumbersCommand(remaining, LED_COLOR_ORANGE));

  removeDartsTimer = setInterval(() => {
    remaining = remaining.slice(1);
    void board.sendCommand(
      remaining.length > 0 ? buildPersistentNumbersCommand(remaining, LED_COLOR_ORANGE) : buildClearCommand(),
    );
    if (remaining.length === 0) {
      clearInterval(removeDartsTimer!);
      removeDartsTimer = null;
    }
  }, intervalMs);
}

/** Dart numbers sorted clockwise by LED ring position. */
const RING_ORDER = Array.from({ length: 20 }, (_, i) => i + 1)
  .sort((a, b) => LED_POSITIONS[a] - LED_POSITIONS[b]);

function lerpColor(a: RGB, b: RGB, t: number): RGB {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

let sweepTimer: ReturnType<typeof setInterval> | null = null;

function startSweep(): void {
  const board = useGranboardStore.getState().board;
  if (!board) return;

  if (sweepTimer !== null) {
    clearInterval(sweepTimer);
    sweepTimer = null;
  }

  const stepMs = 60;
  let step = 0;

  sweepTimer = setInterval(() => {
    if (step >= RING_ORDER.length) {
      clearInterval(sweepTimer!);
      sweepTimer = null;
      // Finish with a blink
      void board.sendCommand(buildBlinkCommand(Colors.GREEN, 0x14));
      return;
    }

    const dartNumber = RING_ORDER[step];
    const t = step / (RING_ORDER.length - 1);
    const color = lerpColor(Colors.RED, Colors.GREEN, t);
    void board.sendCommand(buildHitCommand(dartNumber, 1, color));
    step++;
  }, stepMs);
}

gameEventBus.on("game_start", () => {
  startSweep();
});

gameEventBus.on("dart_hit", ({ segment, effectiveMarks }) => {
  const board = useGranboardStore.getState().board;
  if (!board) return;

  // In cricket, skip LED effects for darts that don't score or earn marks
  if (effectiveMarks === 0) return;

  if (segment.Section === SegmentSection.BULL) {
    void board.sendCommand(buildBlinkCommand(Colors.LIGHT_BLUE, 0x0a));
  } else if (segment.Type !== SegmentType.Other) {
    const color =
      segment.Type === SegmentType.Double
        ? Colors.GREEN
        : segment.Type === SegmentType.Triple
          ? Colors.YELLOW
          : Colors.RED;
    void board.sendCommand(buildHitCommand(segment.Section, segment.Type, color));
  }
});

gameEventBus.on("next_turn", () => {
  const board = useGranboardStore.getState().board;
  void board?.sendCommand(buildButtonPressCommand(Colors.WHITE, Colors.RED));
});

gameEventBus.on("open_numbers", ({ numbers }) => {
  setTimeout(() => {
    const board = useGranboardStore.getState().board;
    if (!board) return;
    // 20-byte direct state command — persistent, no timeout
    void board.sendCommand(buildPersistentNumbersCommand(numbers, LED_COLOR_ORANGE));
  }, 700);
});
