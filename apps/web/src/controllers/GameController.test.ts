import { describe, it, expect } from "vitest";
import { setActiveController, getActiveController } from "./GameController.ts";
import type { GameController } from "./GameController.ts";

describe("GameController registry", () => {
  it("initially returns null", () => {
    setActiveController(null);
    expect(getActiveController()).toBeNull();
  });

  it("setActiveController sets and getActiveController returns it", () => {
    const ctrl: GameController = {
      onDartHit: () => {},
      onNextTurn: () => {},
    };
    setActiveController(ctrl);
    expect(getActiveController()).toBe(ctrl);
    setActiveController(null);
  });

  it("setActiveController(null) clears the controller", () => {
    const ctrl: GameController = {
      onDartHit: () => {},
      onNextTurn: () => {},
    };
    setActiveController(ctrl);
    setActiveController(null);
    expect(getActiveController()).toBeNull();
  });

  it("can replace with a different controller", () => {
    const ctrl1: GameController = {
      onDartHit: () => {},
      onNextTurn: () => {},
    };
    const ctrl2: GameController = {
      onDartHit: () => {},
      onNextTurn: () => {},
    };
    setActiveController(ctrl1);
    setActiveController(ctrl2);
    expect(getActiveController()).toBe(ctrl2);
    setActiveController(null);
  });

  it("returns the exact same reference", () => {
    const ctrl: GameController = {
      onDartHit: () => {},
      onNextTurn: () => {},
    };
    setActiveController(ctrl);
    const returned = getActiveController();
    expect(returned).toBe(ctrl);
    setActiveController(null);
  });
});
