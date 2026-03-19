import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateSegment, SegmentID } from "@nlc-darts/engine";

const mockOnDartHit = vi.fn();
const mockOnNextTurn = vi.fn();

vi.mock("../controllers/GameController.ts", () => ({
  getActiveController: vi.fn(() => ({
    onDartHit: mockOnDartHit,
    onNextTurn: mockOnNextTurn,
  })),
}));

// Mock the parent Granboard class to avoid BLE dependencies
vi.mock("./Granboard.ts", () => ({
  Granboard: class {
    setSegmentHitCallback() {}
    async sendCommand() {}
  },
}));

import { MockGranboard } from "./MockGranboard.ts";

describe("MockGranboard", () => {
  let mock: MockGranboard;

  beforeEach(() => {
    vi.clearAllMocks();
    mock = new MockGranboard();
  });

  it("simulateHit with a regular segment calls controller.onDartHit", () => {
    mock.simulateHit(SegmentID.TRP_20);
    expect(mockOnDartHit).toHaveBeenCalledOnce();
    expect(mockOnNextTurn).not.toHaveBeenCalled();
  });

  it("simulateHit with RESET_BUTTON calls controller.onNextTurn", () => {
    mock.simulateHit(SegmentID.RESET_BUTTON);
    expect(mockOnNextTurn).toHaveBeenCalledOnce();
    expect(mockOnDartHit).not.toHaveBeenCalled();
  });

  it("sendCommand is a no-op that does not throw", async () => {
    await expect(mock.sendCommand([0x01, 0x02])).resolves.toBeUndefined();
  });

  it("simulateHit creates the correct Segment from a SegmentID", () => {
    mock.simulateHit(SegmentID.DBL_BULL);
    const expected = CreateSegment(SegmentID.DBL_BULL);
    expect(mockOnDartHit).toHaveBeenCalledWith(expected);
  });
});
