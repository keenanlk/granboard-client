import { describe, it, expect } from "vitest";
import { computeX01Grade, computeCricketGrade } from "./grading.ts";

describe("computeX01Grade", () => {
  it.each([
    [30, "A+"],
    [35, "A+"],
    [100, "A+"],
    [25, "A"],
    [29.9, "A"],
    [20, "B+"],
    [24.9, "B+"],
    [15, "B"],
    [19.9, "B"],
    [12, "C+"],
    [14.9, "C+"],
    [8, "C"],
    [11.9, "C"],
    [7.9, "D"],
    [0, "D"],
  ] as const)("ppd %f → %s", (ppd, expected) => {
    expect(computeX01Grade(ppd)).toBe(expected);
  });

  it("handles negative values as D", () => {
    expect(computeX01Grade(-5)).toBe("D");
  });
});

describe("computeCricketGrade", () => {
  it.each([
    [3.5, "A+"],
    [4.0, "A+"],
    [10, "A+"],
    [3.0, "A"],
    [3.49, "A"],
    [2.5, "B+"],
    [2.99, "B+"],
    [2.0, "B"],
    [2.49, "B"],
    [1.5, "C+"],
    [1.99, "C+"],
    [1.0, "C"],
    [1.49, "C"],
    [0.9, "D"],
    [0, "D"],
  ] as const)("mpr %f → %s", (mpr, expected) => {
    expect(computeCricketGrade(mpr)).toBe(expected);
  });

  it("handles negative values as D", () => {
    expect(computeCricketGrade(-1)).toBe("D");
  });
});
