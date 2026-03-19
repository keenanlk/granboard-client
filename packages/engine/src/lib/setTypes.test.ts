import { describe, it, expect } from "vitest";
import { getSetWinner, legCount } from "./setTypes.ts";

describe("getSetWinner", () => {
  it("returns null when no legs played", () => {
    expect(getSetWinner([], "bo3")).toBeNull();
  });

  it("returns null after 1 win in bo3", () => {
    expect(
      getSetWinner([{ winnerName: "Alice", winnerIndex: 0 }], "bo3"),
    ).toBeNull();
  });

  it("returns winner after 2 wins in bo3", () => {
    const results = [
      { winnerName: "Alice", winnerIndex: 0 },
      { winnerName: "Bob", winnerIndex: 1 },
      { winnerName: "Alice", winnerIndex: 0 },
    ];
    expect(getSetWinner(results, "bo3")).toBe("Alice");
  });

  it("returns winner after 2 consecutive wins in bo3", () => {
    const results = [
      { winnerName: "Bob", winnerIndex: 1 },
      { winnerName: "Bob", winnerIndex: 1 },
    ];
    expect(getSetWinner(results, "bo3")).toBe("Bob");
  });

  it("returns null after 2 wins in bo5", () => {
    const results = [
      { winnerName: "Alice", winnerIndex: 0 },
      { winnerName: "Alice", winnerIndex: 0 },
    ];
    expect(getSetWinner(results, "bo5")).toBeNull();
  });

  it("returns winner after 3 wins in bo5", () => {
    const results = [
      { winnerName: "Alice", winnerIndex: 0 },
      { winnerName: "Bob", winnerIndex: 1 },
      { winnerName: "Alice", winnerIndex: 0 },
      { winnerName: "Alice", winnerIndex: 0 },
    ];
    expect(getSetWinner(results, "bo5")).toBe("Alice");
  });
});

describe("legCount", () => {
  it("returns 3 for bo3", () => {
    expect(legCount("bo3")).toBe(3);
  });

  it("returns 5 for bo5", () => {
    expect(legCount("bo5")).toBe(5);
  });
});
