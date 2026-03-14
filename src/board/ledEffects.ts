import { gameEventBus } from "../events/gameEventBus.ts";
import { SegmentSection, SegmentType } from "./Dartboard.ts";
import {
  buildBlinkCommand,
  buildButtonPressCommand,
  buildClearCommand,
  buildHitCommand,
  buildPersistentNumbersCommand,
  Colors,
} from "./GranboardLED.ts";
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

  void board.sendCommand(buildPersistentNumbersCommand(remaining, 0x05));

  removeDartsTimer = setInterval(() => {
    remaining = remaining.slice(1);
    void board.sendCommand(
      remaining.length > 0 ? buildPersistentNumbersCommand(remaining, 0x05) : buildClearCommand(),
    );
    if (remaining.length === 0) {
      clearInterval(removeDartsTimer!);
      removeDartsTimer = null;
    }
  }, intervalMs);
}

gameEventBus.on("dart_hit", ({ segment }) => {
  const board = useGranboardStore.getState().board;
  if (!board) return;

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
    // colorByte 0x05 = orange (adjust if board uses a different palette index)
    void board.sendCommand(buildPersistentNumbersCommand(numbers, 0x05));
  }, 700);
});
