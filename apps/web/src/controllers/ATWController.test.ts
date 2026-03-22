import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateSegment, SegmentID } from "@nlc-darts/engine";

vi.mock("../events/gameEventBus.ts", () => ({
  gameEventBus: { emit: vi.fn() },
}));
vi.mock("../lib/logger.ts", () => ({
  logger: {
    child: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));
vi.mock("../store/useATWStore.ts", () => ({
  useATWStore: { getState: vi.fn() },
}));

import { ATWController } from "./ATWController.ts";
import { gameEventBus } from "../events/gameEventBus.ts";
import { useATWStore } from "../store/useATWStore.ts";

const s20 = CreateSegment(SegmentID.INNER_20);

function mockStore(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
) {
  const addDart = vi.fn();
  const nextTurn = vi.fn();
  const beforeState = { addDart, nextTurn, ...before };
  const afterState = { addDart, nextTurn, ...after };
  vi.mocked(useATWStore.getState)
    .mockReturnValueOnce(beforeState as never) // before snapshot
    .mockReturnValueOnce(beforeState as never) // addDart call
    .mockReturnValueOnce(afterState as never) // after snapshot
    .mockReturnValueOnce(afterState as never); // emitOpenNumbers call
  return { addDart, nextTurn };
}

describe("ATWController", () => {
  let ctrl: ATWController;

  beforeEach(() => {
    vi.resetAllMocks();
    ctrl = new ATWController();
  });

  it("onDartHit emits dart_hit with effectiveMarks", () => {
    mockStore(
      {
        currentRoundDarts: [],
        currentPlayerIndex: 0,
        players: [{ name: "Alice", finished: false, currentTarget: 5 }],
      },
      {
        currentRoundDarts: [{ segment: s20, hit: true }],
        currentPlayerIndex: 0,
        players: [{ name: "Alice", finished: false, currentTarget: 6 }],
      },
    );
    ctrl.onDartHit(s20);
    expect(gameEventBus.emit).toHaveBeenCalledWith("dart_hit", {
      segment: s20,
      effectiveMarks: 1,
    });
  });

  it("onDartHit emits open_numbers with current target", () => {
    mockStore(
      {
        currentRoundDarts: [],
        currentPlayerIndex: 0,
        players: [{ name: "Alice", finished: false, currentTarget: 5 }],
      },
      {
        currentRoundDarts: [{ segment: s20, hit: false }],
        currentPlayerIndex: 0,
        players: [{ name: "Alice", finished: false, currentTarget: 5 }],
      },
    );
    ctrl.onDartHit(s20);
    const openCall = vi
      .mocked(gameEventBus.emit)
      .mock.calls.find((c) => c[0] === "open_numbers");
    expect(openCall).toBeDefined();
    expect((openCall![1] as { numbers: number[] }).numbers).toEqual([5]);
  });

  it("onDartHit ignores 4th dart when lengths match", () => {
    mockStore(
      {
        currentRoundDarts: [1, 2, 3],
        currentPlayerIndex: 0,
        players: [{ name: "Alice", finished: false, currentTarget: 5 }],
      },
      {
        currentRoundDarts: [1, 2, 3],
        currentPlayerIndex: 0,
        players: [{ name: "Alice", finished: false, currentTarget: 5 }],
      },
    );
    ctrl.onDartHit(s20);
    expect(gameEventBus.emit).not.toHaveBeenCalled();
  });

  it("onDartHit emits game_won when player finishes", () => {
    const addDart = vi.fn();
    const nextTurn = vi.fn();
    const beforeState = {
      addDart,
      nextTurn,
      currentRoundDarts: [],
      currentPlayerIndex: 0,
      players: [{ name: "Alice", finished: false, currentTarget: 20 }],
    };
    const afterState = {
      addDart,
      nextTurn,
      currentRoundDarts: [{ segment: s20, hit: true }],
      currentPlayerIndex: 0,
      players: [{ name: "Alice", finished: true, currentTarget: 21 }],
    };
    vi.mocked(useATWStore.getState)
      .mockReturnValueOnce(beforeState as never) // before
      .mockReturnValueOnce(beforeState as never) // addDart call
      .mockReturnValueOnce(afterState as never) // after
      .mockReturnValueOnce(afterState as never) // emitOpenNumbers
      .mockReturnValueOnce(afterState as never); // extra safety
    ctrl.onDartHit(s20);
    expect(gameEventBus.emit).toHaveBeenCalledWith("game_won", {
      playerName: "Alice",
    });
  });

  it("onNextTurn emits next_turn and open_numbers", () => {
    const nextTurn = vi.fn();
    const state = {
      nextTurn,
      currentPlayerIndex: 0,
      players: [{ name: "Alice", finished: false, currentTarget: 7 }],
    };
    vi.mocked(useATWStore.getState)
      .mockReturnValueOnce(state as never) // nextTurn call
      .mockReturnValueOnce(state as never); // emitOpenNumbers call
    ctrl.onNextTurn();
    expect(nextTurn).toHaveBeenCalled();
    expect(gameEventBus.emit).toHaveBeenCalledWith("next_turn", {});
    expect(gameEventBus.emit).toHaveBeenCalledWith("open_numbers", {
      numbers: [7],
    });
  });

  it("open_numbers is empty when player finished or target is bull (25)", () => {
    const nextTurn = vi.fn();
    const state = {
      nextTurn,
      currentPlayerIndex: 0,
      players: [{ name: "Alice", finished: true, currentTarget: 25 }],
    };
    vi.mocked(useATWStore.getState)
      .mockReturnValueOnce(state as never)
      .mockReturnValueOnce(state as never);
    ctrl.onNextTurn();
    const openCall = vi
      .mocked(gameEventBus.emit)
      .mock.calls.find((c) => c[0] === "open_numbers");
    expect(openCall).toBeDefined();
    expect((openCall![1] as { numbers: number[] }).numbers).toEqual([]);
  });
});
