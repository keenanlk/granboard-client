import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateSegment, SegmentID } from "@nlc-darts/engine";

vi.mock("../events/gameEventBus.ts", () => ({
  gameEventBus: { emit: vi.fn() },
}));
vi.mock("../lib/logger.ts", () => ({
  logger: { child: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));
vi.mock("../store/useTicTacToeStore.ts", () => ({
  useTicTacToeStore: { getState: vi.fn() },
}));

import { TicTacToeController } from "./TicTacToeController.ts";
import { gameEventBus } from "../events/gameEventBus.ts";
import { useTicTacToeStore } from "../store/useTicTacToeStore.ts";

const s20 = CreateSegment(SegmentID.INNER_20);

function mockStore(before: Record<string, unknown>, after: Record<string, unknown>) {
  const addDart = vi.fn();
  const nextTurn = vi.fn();
  const beforeState = { addDart, nextTurn, ...before };
  const afterState = { addDart, nextTurn, ...after };
  vi.mocked(useTicTacToeStore.getState)
    .mockReturnValueOnce(beforeState as any) // before snapshot
    .mockReturnValueOnce(beforeState as any) // addDart call
    .mockReturnValueOnce(afterState as any) // after snapshot
    .mockReturnValueOnce(afterState as any); // emitOpenNumbers call
  return { addDart, nextTurn };
}

describe("TicTacToeController", () => {
  let ctrl: TicTacToeController;

  beforeEach(() => {
    vi.resetAllMocks();
    ctrl = new TicTacToeController();
  });

  it("onDartHit emits dart_hit with effectiveMarks (marksAdded from last dart)", () => {
    mockStore(
      {
        currentRoundDarts: [],
        winner: null,
        grid: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        owner: [null, null, null, null, null, null, null, null, null],
      },
      {
        currentRoundDarts: [{ segment: s20, marksAdded: 1 }],
        winner: null,
        grid: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        owner: [null, null, null, null, null, null, null, null, null],
      },
    );
    ctrl.onDartHit(s20);
    expect(gameEventBus.emit).toHaveBeenCalledWith("dart_hit", {
      segment: s20,
      effectiveMarks: 1,
    });
  });

  it("onDartHit emits open_numbers (unclaimed grid nums 1-20)", () => {
    mockStore(
      {
        currentRoundDarts: [],
        winner: null,
        grid: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        owner: [0, null, null, null, null, null, null, null, null],
      },
      {
        currentRoundDarts: [{ segment: s20, marksAdded: 0 }],
        winner: null,
        grid: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        owner: [0, null, null, null, null, null, null, null, null],
      },
    );
    ctrl.onDartHit(s20);
    const openCall = vi.mocked(gameEventBus.emit).mock.calls.find(
      (c) => c[0] === "open_numbers",
    );
    expect(openCall).toBeDefined();
    const numbers = (openCall![1] as { numbers: number[] }).numbers;
    // 1 is owned (index 0), so should not be in open list
    expect(numbers).not.toContain(1);
    expect(numbers).toContain(2);
  });

  it("onDartHit ignores 4th dart when lengths match", () => {
    mockStore(
      {
        currentRoundDarts: [1, 2, 3],
        winner: null,
        grid: [1, 2, 3],
        owner: [null, null, null],
      },
      {
        currentRoundDarts: [1, 2, 3],
        winner: null,
        grid: [1, 2, 3],
        owner: [null, null, null],
      },
    );
    ctrl.onDartHit(s20);
    expect(gameEventBus.emit).not.toHaveBeenCalledWith("dart_hit", expect.anything());
  });

  it("onDartHit emits game_won when winner detected", () => {
    const addDart = vi.fn();
    const nextTurn = vi.fn();
    const beforeState = {
      addDart, nextTurn,
      currentRoundDarts: [],
      winner: null,
      grid: [1, 2, 3],
      owner: [null, null, null],
    };
    const afterState = {
      addDart, nextTurn,
      currentRoundDarts: [{ segment: s20, marksAdded: 1 }],
      winner: "Alice",
      grid: [1, 2, 3],
      owner: [0, 0, 0],
    };
    vi.mocked(useTicTacToeStore.getState)
      .mockReturnValueOnce(beforeState as any)  // before
      .mockReturnValueOnce(beforeState as any)  // addDart call
      .mockReturnValueOnce(afterState as any)   // after
      .mockReturnValueOnce(afterState as any)   // emitOpenNumbers
      .mockReturnValueOnce(afterState as any);  // extra safety
    ctrl.onDartHit(s20);
    expect(gameEventBus.emit).toHaveBeenCalledWith("game_won", { playerName: "Alice" });
  });

  it("onNextTurn emits next_turn and open_numbers", () => {
    const nextTurn = vi.fn();
    const state = {
      nextTurn,
      grid: [1, 2, 3],
      owner: [null, null, null],
    };
    vi.mocked(useTicTacToeStore.getState)
      .mockReturnValueOnce(state as any)  // nextTurn call
      .mockReturnValueOnce(state as any); // emitOpenNumbers call
    ctrl.onNextTurn();
    expect(nextTurn).toHaveBeenCalled();
    expect(gameEventBus.emit).toHaveBeenCalledWith("next_turn", {});
    expect(gameEventBus.emit).toHaveBeenCalledWith("open_numbers", expect.objectContaining({ numbers: expect.any(Array) }));
  });

  it("open_numbers filters out claimed cells and bull (25)", () => {
    const nextTurn = vi.fn();
    const state = {
      nextTurn,
      grid: [5, 10, 25],
      owner: [0, null, null],
    };
    vi.mocked(useTicTacToeStore.getState)
      .mockReturnValueOnce(state as any)
      .mockReturnValueOnce(state as any);
    ctrl.onNextTurn();
    const openCall = vi.mocked(gameEventBus.emit).mock.calls.find(
      (c) => c[0] === "open_numbers",
    );
    expect(openCall).toBeDefined();
    const numbers = (openCall![1] as { numbers: number[] }).numbers;
    // 5 is owned, 25 is bull (not addressable), only 10 should remain
    expect(numbers).not.toContain(5);
    expect(numbers).not.toContain(25);
    expect(numbers).toContain(10);
  });
});
