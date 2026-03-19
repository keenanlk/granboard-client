import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateSegment, SegmentID } from "@nlc-darts/engine";

vi.mock("../events/gameEventBus.ts", () => ({
  gameEventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()), off: vi.fn() },
}));
vi.mock("../lib/logger.ts", () => ({
  logger: { child: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));
vi.mock("../store/useGameStore.ts", () => ({
  useGameStore: { getState: vi.fn() },
}));

import { X01Controller } from "./X01Controller.ts";
import { gameEventBus } from "../events/gameEventBus.ts";
import { useGameStore } from "../store/useGameStore.ts";

const s20 = CreateSegment(SegmentID.INNER_20);

function mockStore(before: Record<string, unknown>, after: Record<string, unknown>) {
  const addDart = vi.fn();
  const nextTurn = vi.fn();
  const beforeState = { addDart, nextTurn, ...before };
  const afterState = { addDart, nextTurn, ...after };
  vi.mocked(useGameStore.getState)
    .mockReturnValueOnce(beforeState as any) // before snapshot
    .mockReturnValueOnce(beforeState as any) // addDart call
    .mockReturnValueOnce(afterState as any); // after snapshot
  return { addDart, nextTurn };
}

describe("X01Controller", () => {
  let ctrl: X01Controller;

  beforeEach(() => {
    vi.resetAllMocks();
    ctrl = new X01Controller();
  });

  it("onDartHit calls addDart on the store", () => {
    const { addDart } = mockStore(
      { currentRoundDarts: [], isBust: false, winner: null },
      { currentRoundDarts: [{ segment: s20 }], isBust: false, winner: null },
    );
    ctrl.onDartHit(s20);
    expect(addDart).toHaveBeenCalledWith(s20);
  });

  it("onDartHit emits dart_hit event", () => {
    mockStore(
      { currentRoundDarts: [], isBust: false, winner: null },
      { currentRoundDarts: [{ segment: s20 }], isBust: false, winner: null },
    );
    ctrl.onDartHit(s20);
    expect(gameEventBus.emit).toHaveBeenCalledWith("dart_hit", { segment: s20 });
  });

  it("onDartHit ignores 4th dart when lengths match", () => {
    mockStore(
      { currentRoundDarts: [1, 2, 3], isBust: false, winner: null },
      { currentRoundDarts: [1, 2, 3], isBust: false, winner: null },
    );
    ctrl.onDartHit(s20);
    expect(gameEventBus.emit).not.toHaveBeenCalled();
  });

  it("onDartHit emits bust when isBust transitions to true", () => {
    mockStore(
      { currentRoundDarts: [], isBust: false, winner: null },
      { currentRoundDarts: [{ segment: s20 }], isBust: true, winner: null },
    );
    ctrl.onDartHit(s20);
    expect(gameEventBus.emit).toHaveBeenCalledWith("bust", {});
  });

  it("onDartHit does not emit bust if already busted before", () => {
    mockStore(
      { currentRoundDarts: [1], isBust: true, winner: null },
      { currentRoundDarts: [1, 2], isBust: true, winner: null },
    );
    ctrl.onDartHit(s20);
    expect(gameEventBus.emit).not.toHaveBeenCalledWith("bust", {});
  });

  it("onDartHit emits game_won when winner appears", () => {
    mockStore(
      { currentRoundDarts: [], isBust: false, winner: null },
      { currentRoundDarts: [{ segment: s20 }], isBust: false, winner: "Alice" },
    );
    ctrl.onDartHit(s20);
    expect(gameEventBus.emit).toHaveBeenCalledWith("game_won", { playerName: "Alice" });
  });

  it("onNextTurn calls nextTurn on store", () => {
    const nextTurn = vi.fn();
    vi.mocked(useGameStore.getState).mockReturnValue({ nextTurn } as any);
    ctrl.onNextTurn();
    expect(nextTurn).toHaveBeenCalled();
  });

  it("onNextTurn emits next_turn event", () => {
    vi.mocked(useGameStore.getState).mockReturnValue({ nextTurn: vi.fn() } as any);
    ctrl.onNextTurn();
    expect(gameEventBus.emit).toHaveBeenCalledWith("next_turn", {});
  });
});
