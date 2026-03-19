import { describe, it, expect } from "vitest";
import { atwPickTarget } from "./atwStrategy.ts";
import { SegmentID } from "../board/Dartboard.ts";

describe("atwPickTarget", () => {
  it("returns TRP_1 for target 1", () => {
    expect(atwPickTarget(1)).toBe(SegmentID.TRP_1);
  });

  it("returns TRP_5 for target 5", () => {
    expect(atwPickTarget(5)).toBe(SegmentID.TRP_5);
  });

  it("returns TRP_20 for target 20", () => {
    expect(atwPickTarget(20)).toBe(SegmentID.TRP_20);
  });

  it("returns DBL_BULL for target 25 (bull)", () => {
    expect(atwPickTarget(25)).toBe(SegmentID.DBL_BULL);
  });

  it("follows (n-1)*4+1 formula for arbitrary numbers", () => {
    // TRP_12 = (12-1)*4+1 = 45
    expect(atwPickTarget(12)).toBe(SegmentID.TRP_12);
    // TRP_17 = (17-1)*4+1 = 65
    expect(atwPickTarget(17)).toBe(SegmentID.TRP_17);
  });
});
