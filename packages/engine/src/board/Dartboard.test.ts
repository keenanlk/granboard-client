import { describe, expect, it } from "vitest";
import {
  CreateSegment,
  SegmentID,
  SegmentSection,
  SegmentType,
  SegmentTypeToString,
} from "./Dartboard.ts";

describe("CreateSegment", () => {
  it("creates RESET_BUTTON segment correctly", () => {
    const seg = CreateSegment(SegmentID.RESET_BUTTON);
    expect(seg.Type).toBe(SegmentType.Other);
    expect(seg.Section).toBe(SegmentSection.Other);
    expect(seg.Value).toBe(0);
    expect(seg.ShortName).toBe("RST");
  });

  it("creates BUST segment correctly", () => {
    const seg = CreateSegment(SegmentID.BUST);
    expect(seg.Type).toBe(SegmentType.Other);
    expect(seg.Section).toBe(SegmentSection.Other);
    expect(seg.Value).toBe(0);
    expect(seg.ShortName).toBe("Bust");
  });

  it("creates MISS segment correctly", () => {
    const seg = CreateSegment(SegmentID.MISS);
    expect(seg.Type).toBe(SegmentType.Other);
    expect(seg.Section).toBe(SegmentSection.Other);
    expect(seg.Value).toBe(0);
    expect(seg.ShortName).toBe("Miss");
  });
});

describe("SegmentTypeToString", () => {
  it("returns empty string for Other type", () => {
    expect(SegmentTypeToString(SegmentType.Other, true)).toBe("");
    expect(SegmentTypeToString(SegmentType.Other, false)).toBe("");
  });

  it("returns empty string for Single type", () => {
    expect(SegmentTypeToString(SegmentType.Single, true)).toBe("");
    expect(SegmentTypeToString(SegmentType.Single, false)).toBe("");
  });

  it("returns D or Double for Double type", () => {
    expect(SegmentTypeToString(SegmentType.Double, true)).toBe("D");
    expect(SegmentTypeToString(SegmentType.Double, false)).toBe("Double");
  });

  it("returns T or Triple for Triple type", () => {
    expect(SegmentTypeToString(SegmentType.Triple, true)).toBe("T");
    expect(SegmentTypeToString(SegmentType.Triple, false)).toBe("Triple");
  });
});
