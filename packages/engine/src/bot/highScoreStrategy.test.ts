import { describe, it, expect } from "vitest";
import { highScorePickTarget } from "./highScoreStrategy.ts";
import { SegmentID } from "../board/Dartboard.ts";

describe("highScorePickTarget", () => {
  it("returns TRP_20 when splitBull is true", () => {
    expect(highScorePickTarget(true)).toBe(SegmentID.TRP_20);
  });

  it("returns DBL_BULL when splitBull is false", () => {
    expect(highScorePickTarget(false)).toBe(SegmentID.DBL_BULL);
  });

  it("returns the correct numeric values", () => {
    expect(highScorePickTarget(true)).toBe(77); // TRP_20
    expect(highScorePickTarget(false)).toBe(81); // DBL_BULL
  });
});
