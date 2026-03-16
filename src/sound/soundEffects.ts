import { gameEventBus } from "../events/gameEventBus.ts";
import { SegmentID, SegmentSection, SegmentType } from "../board/Dartboard.ts";
import { Sounds } from "./sounds.ts";

let _turnTransitioning = false;
export function setTurnTransitioning(value: boolean) {
  _turnTransitioning = value;
}

gameEventBus.on("dart_hit", ({ segment, effectiveMarks }) => {
  if (_turnTransitioning) return;
  // In cricket, a dart with no effective marks just gets a plain hit sound
  if (effectiveMarks === 0) { Sounds.hit(); return; }

  // Cricket darts: play sound based on effective marks earned (1, 2, or 3+)
  if (effectiveMarks !== undefined) {
    if (segment.Section === SegmentSection.BULL) {
      if (segment.ID === SegmentID.DBL_BULL) { Sounds.dbull(); } else { Sounds.bull(); }
    } else if (effectiveMarks >= 3) {
      Sounds.triple();
    } else if (effectiveMarks === 2) {
      Sounds.double();
    } else {
      Sounds.single();
    }
    return;
  }

  // X01 darts: play sound based on segment type
  if (segment.Section === SegmentSection.BULL) {
    if (segment.ID === SegmentID.DBL_BULL) { Sounds.dbull(); } else { Sounds.bull(); }
  } else if (segment.Type === SegmentType.Triple) {
    Sounds.triple();
  } else if (segment.Type !== SegmentType.Other) {
    Sounds.hit();
  } else {
    Sounds.buzzer();
  }
});
