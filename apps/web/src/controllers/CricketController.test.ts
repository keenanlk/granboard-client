import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateSegment, SegmentID } from "@nlc-darts/engine";

vi.mock("../events/gameEventBus.ts", () => ({
  gameEventBus: { emit: vi.fn(), on: vi.fn(() => vi.fn()), off: vi.fn() },
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
vi.mock("../store/useCricketStore.ts", () => ({
  useCricketStore: { getState: vi.fn() },
}));

import { CricketController } from "./CricketController.ts";
import { gameEventBus } from "../events/gameEventBus.ts";
import { useCricketStore } from "../store/useCricketStore.ts";

const s20 = CreateSegment(SegmentID.INNER_20);

function mockStore(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
) {
  const addDart = vi.fn();
  const nextTurn = vi.fn();
  const beforeState = { addDart, nextTurn, ...before };
  const afterState = { addDart, nextTurn, ...after };
  vi.mocked(useCricketStore.getState)
    .mockReturnValueOnce(beforeState as never) // before snapshot
    .mockReturnValueOnce(beforeState as never) // addDart call
    .mockReturnValueOnce(afterState as never) // after snapshot
    .mockReturnValueOnce(afterState as never); // emitOpenNumbers call
  return { addDart, nextTurn };
}

describe("CricketController", () => {
  let ctrl: CricketController;

  beforeEach(() => {
    vi.resetAllMocks();
    ctrl = new CricketController();
  });

  it("onDartHit emits dart_hit with segment and effectiveMarks", () => {
    mockStore(
      { currentRoundDarts: [], winner: null, players: [{ marks: {} }] },
      {
        currentRoundDarts: [{ segment: s20, effectiveMarks: 1 }],
        winner: null,
        players: [{ marks: {} }],
      },
    );
    ctrl.onDartHit(s20);
    expect(gameEventBus.emit).toHaveBeenCalledWith("dart_hit", {
      segment: s20,
      effectiveMarks: 1,
    });
  });

  it("onDartHit emits open_numbers", () => {
    mockStore(
      { currentRoundDarts: [], winner: null, players: [{ marks: {} }] },
      {
        currentRoundDarts: [{ segment: s20, effectiveMarks: 1 }],
        winner: null,
        players: [{ marks: {} }],
      },
    );
    ctrl.onDartHit(s20);
    expect(gameEventBus.emit).toHaveBeenCalledWith(
      "open_numbers",
      expect.objectContaining({ numbers: expect.any(Array) }),
    );
  });

  it("onDartHit ignores 4th dart when lengths match", () => {
    mockStore(
      { currentRoundDarts: [1, 2, 3], winner: null, players: [{ marks: {} }] },
      { currentRoundDarts: [1, 2, 3], winner: null, players: [{ marks: {} }] },
    );
    ctrl.onDartHit(s20);
    expect(gameEventBus.emit).not.toHaveBeenCalledWith(
      "dart_hit",
      expect.anything(),
    );
  });

  it("onDartHit emits game_won when winner detected", () => {
    const addDart = vi.fn();
    const nextTurn = vi.fn();
    const beforeState = {
      addDart,
      nextTurn,
      currentRoundDarts: [],
      winner: null,
      players: [{ marks: {} }],
    };
    const afterState = {
      addDart,
      nextTurn,
      currentRoundDarts: [{ segment: s20, effectiveMarks: 1 }],
      winner: "Bob",
      players: [{ marks: {} }],
    };
    vi.mocked(useCricketStore.getState)
      .mockReturnValueOnce(beforeState as never) // before
      .mockReturnValueOnce(beforeState as never) // addDart call
      .mockReturnValueOnce(afterState as never) // after
      .mockReturnValueOnce(afterState as never) // emitOpenNumbers
      .mockReturnValueOnce(afterState as never); // extra safety
    ctrl.onDartHit(s20);
    expect(gameEventBus.emit).toHaveBeenCalledWith("game_won", {
      playerName: "Bob",
    });
  });

  it("onNextTurn emits next_turn", () => {
    const nextTurn = vi.fn();
    vi.mocked(useCricketStore.getState).mockReturnValue({
      nextTurn,
      players: [{ marks: {} }],
    } as never);
    ctrl.onNextTurn();
    expect(gameEventBus.emit).toHaveBeenCalledWith("next_turn", {});
  });

  it("onNextTurn emits open_numbers", () => {
    const nextTurn = vi.fn();
    vi.mocked(useCricketStore.getState).mockReturnValue({
      nextTurn,
      players: [{ marks: {} }],
    } as never);
    ctrl.onNextTurn();
    expect(gameEventBus.emit).toHaveBeenCalledWith(
      "open_numbers",
      expect.objectContaining({ numbers: expect.any(Array) }),
    );
  });

  it("open_numbers filters correctly based on marks", () => {
    // All players have closed 20 (marks >= 3), but not 19
    const players = [
      { marks: { 20: 3, 19: 0, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 } },
      { marks: { 20: 3, 19: 2, 18: 0, 17: 0, 16: 0, 15: 0, 25: 0 } },
    ];
    vi.mocked(useCricketStore.getState).mockReturnValue({
      nextTurn: vi.fn(),
      players,
    } as never);
    ctrl.onNextTurn();
    // 20 is closed by all, so it should not be in open_numbers
    const openCall = vi
      .mocked(gameEventBus.emit)
      .mock.calls.find((c) => c[0] === "open_numbers");
    expect(openCall).toBeDefined();
    const numbers = (openCall![1] as { numbers: number[] }).numbers;
    expect(numbers).not.toContain(20);
    expect(numbers).toContain(19);
  });

  it("onDartHit doesn't emit when dart not registered", () => {
    mockStore(
      { currentRoundDarts: [1], winner: null, players: [{ marks: {} }] },
      { currentRoundDarts: [1], winner: null, players: [{ marks: {} }] },
    );
    ctrl.onDartHit(s20);
    expect(gameEventBus.emit).not.toHaveBeenCalledWith(
      "dart_hit",
      expect.anything(),
    );
    expect(gameEventBus.emit).not.toHaveBeenCalledWith(
      "game_won",
      expect.anything(),
    );
  });
});
