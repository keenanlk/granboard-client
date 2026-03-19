import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateSegment, SegmentID } from "@nlc-darts/engine";

vi.mock("../events/gameEventBus.ts", () => ({
  gameEventBus: { emit: vi.fn() },
}));
vi.mock("../lib/logger.ts", () => ({
  logger: { child: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }) },
}));
vi.mock("../store/useHighScoreStore.ts", () => ({
  useHighScoreStore: { getState: vi.fn() },
}));

import { HighScoreController } from "./HighScoreController.ts";
import { gameEventBus } from "../events/gameEventBus.ts";
import { useHighScoreStore } from "../store/useHighScoreStore.ts";

const s20 = CreateSegment(SegmentID.INNER_20);

describe("HighScoreController", () => {
  let ctrl: HighScoreController;

  beforeEach(() => {
    vi.resetAllMocks();
    ctrl = new HighScoreController();
  });

  it("onDartHit calls addDart and emits dart_hit", () => {
    const addDart = vi.fn();
    vi.mocked(useHighScoreStore.getState).mockReturnValue({ addDart } as any);
    ctrl.onDartHit(s20);
    expect(addDart).toHaveBeenCalledWith(s20);
    expect(gameEventBus.emit).toHaveBeenCalledWith("dart_hit", { segment: s20 });
  });

  it("onNextTurn calls nextTurn and emits next_turn", () => {
    const nextTurn = vi.fn();
    vi.mocked(useHighScoreStore.getState).mockReturnValue({ nextTurn } as any);
    ctrl.onNextTurn();
    expect(nextTurn).toHaveBeenCalled();
    expect(gameEventBus.emit).toHaveBeenCalledWith("next_turn", {});
  });

  it("dart_hit event has segment property", () => {
    vi.mocked(useHighScoreStore.getState).mockReturnValue({ addDart: vi.fn() } as any);
    ctrl.onDartHit(s20);
    const call = vi.mocked(gameEventBus.emit).mock.calls.find((c) => c[0] === "dart_hit");
    expect(call).toBeDefined();
    expect(call![1]).toEqual({ segment: s20 });
  });

  it("next_turn event has empty payload", () => {
    vi.mocked(useHighScoreStore.getState).mockReturnValue({ nextTurn: vi.fn() } as any);
    ctrl.onNextTurn();
    const call = vi.mocked(gameEventBus.emit).mock.calls.find((c) => c[0] === "next_turn");
    expect(call).toBeDefined();
    expect(call![1]).toEqual({});
  });
});
