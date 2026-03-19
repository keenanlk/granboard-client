import { describe, it, expect, vi } from "vitest";
import { gameEventBus } from "./gameEventBus.ts";
import { CreateSegment, SegmentID } from "@nlc-darts/engine";

describe("gameEventBus", () => {
  const s20 = CreateSegment(SegmentID.INNER_20);

  it("on/emit: handler receives payload", () => {
    const handler = vi.fn();
    const unsub = gameEventBus.on("dart_hit", handler);
    gameEventBus.emit("dart_hit", { segment: s20 });
    expect(handler).toHaveBeenCalledWith({ segment: s20 });
    unsub();
  });

  it("off: handler no longer called after removal", () => {
    const handler = vi.fn();
    gameEventBus.on("dart_hit", handler);
    gameEventBus.off("dart_hit", handler);
    gameEventBus.emit("dart_hit", { segment: s20 });
    expect(handler).not.toHaveBeenCalled();
  });

  it("unsubscribe function from on() removes handler", () => {
    const handler = vi.fn();
    const unsub = gameEventBus.on("dart_hit", handler);
    unsub();
    gameEventBus.emit("dart_hit", { segment: s20 });
    expect(handler).not.toHaveBeenCalled();
  });

  it("multiple handlers on same event all fire", () => {
    const h1 = vi.fn();
    const h2 = vi.fn();
    const u1 = gameEventBus.on("next_turn", h1);
    const u2 = gameEventBus.on("next_turn", h2);
    gameEventBus.emit("next_turn", {});
    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
    u1();
    u2();
  });

  it("handlers on different events don't cross-fire", () => {
    const dartHandler = vi.fn();
    const turnHandler = vi.fn();
    const u1 = gameEventBus.on("dart_hit", dartHandler);
    const u2 = gameEventBus.on("next_turn", turnHandler);
    gameEventBus.emit("dart_hit", { segment: s20 });
    expect(dartHandler).toHaveBeenCalledOnce();
    expect(turnHandler).not.toHaveBeenCalled();
    u1();
    u2();
  });

  it("emit with no handlers doesn't throw", () => {
    expect(() => gameEventBus.emit("bust", {})).not.toThrow();
  });

  it("same handler registered twice is called once after one off", () => {
    const handler = vi.fn();
    gameEventBus.on("next_turn", handler);
    gameEventBus.on("next_turn", handler);
    // Set uses identity, so duplicate add is a no-op — handler is in the set once
    gameEventBus.off("next_turn", handler);
    gameEventBus.emit("next_turn", {});
    expect(handler).not.toHaveBeenCalled();
  });

  it("handler receives correct payload data", () => {
    const handler = vi.fn();
    const unsub = gameEventBus.on("game_won", handler);
    gameEventBus.emit("game_won", { playerName: "Alice" });
    expect(handler).toHaveBeenCalledWith({ playerName: "Alice" });
    unsub();
  });
});
