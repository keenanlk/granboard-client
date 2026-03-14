import { Granboard } from "./Granboard.ts";
import { CreateSegment, SegmentID, type SegmentID as SegmentIDType } from "./Dartboard.ts";
import { getActiveController } from "../controllers/GameController.ts";

export class MockGranboard extends Granboard {
  /** Fire a dart hit as if the physical board sent it. */
  simulateHit(segmentId: SegmentIDType): void {
    const segment = CreateSegment(segmentId);
    if (segment.ID === SegmentID.RESET_BUTTON) {
      getActiveController()?.onNextTurn();
    } else {
      getActiveController()?.onDartHit(segment);
    }
  }

  override async sendCommand(_bytes: number[]): Promise<void> {
    // No-op — no real board to send to
  }
}
