import { describe, it, expect, vi } from "vitest";
import { guardForOnlineTurn } from "./OnlineTurnGuard.ts";
import { CreateSegment, SegmentID } from "@nlc-darts/engine";
import type { GameController } from "./GameController.ts";

const s20 = CreateSegment(SegmentID.INNER_20);

function makeInner(): GameController {
  return {
    onDartHit: vi.fn(),
    onNextTurn: vi.fn(),
  };
}

describe("guardForOnlineTurn", () => {
  it("onDartHit forwarded when it's local player's turn", () => {
    const inner = makeInner();
    const guarded = guardForOnlineTurn(inner, 0, () => 0);
    guarded.onDartHit(s20);
    expect(inner.onDartHit).toHaveBeenCalledWith(s20);
  });

  it("onDartHit blocked when it's not local player's turn", () => {
    const inner = makeInner();
    const guarded = guardForOnlineTurn(inner, 0, () => 1);
    guarded.onDartHit(s20);
    expect(inner.onDartHit).not.toHaveBeenCalled();
  });

  it("onNextTurn always forwarded regardless of turn", () => {
    const inner = makeInner();
    const guarded = guardForOnlineTurn(inner, 0, () => 0);
    guarded.onNextTurn();
    expect(inner.onNextTurn).toHaveBeenCalled();
  });

  it("onNextTurn forwarded even when not local player's turn", () => {
    const inner = makeInner();
    const guarded = guardForOnlineTurn(inner, 0, () => 1);
    guarded.onNextTurn();
    expect(inner.onNextTurn).toHaveBeenCalled();
  });

  it("changing getCurrent return value dynamically affects behavior", () => {
    const inner = makeInner();
    let current = 0;
    const guarded = guardForOnlineTurn(inner, 0, () => current);

    guarded.onDartHit(s20);
    expect(inner.onDartHit).toHaveBeenCalledTimes(1);

    current = 1;
    guarded.onDartHit(s20);
    expect(inner.onDartHit).toHaveBeenCalledTimes(1); // still 1 — blocked

    current = 0;
    guarded.onDartHit(s20);
    expect(inner.onDartHit).toHaveBeenCalledTimes(2); // forwarded again
  });
});
