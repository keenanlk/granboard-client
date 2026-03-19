import { describe, it, expect, beforeEach } from "vitest";
import { useATWStore } from "./useATWStore.ts";
import { CreateSegment, SegmentID } from "@nlc-darts/engine";

function store() {
  return useATWStore.getState();
}

const S1 = CreateSegment(SegmentID.INNER_1); // Single 1, Value=1
const D1 = CreateSegment(SegmentID.DBL_1); // Double 1, Value=2
const T1 = CreateSegment(SegmentID.TRP_1); // Triple 1, Value=3
const S2 = CreateSegment(SegmentID.INNER_2); // Single 2
const S5 = CreateSegment(SegmentID.INNER_5); // Single 5
const MISS = CreateSegment(SegmentID.MISS);

describe("useATWStore", () => {
  beforeEach(() => {
    store().resetGame();
  });

  describe("startGame", () => {
    it("initializes players at target 1", () => {
      store().startGame({ roundLimit: 0 }, ["Alice", "Bob"]);
      const s = store();
      expect(s.players).toHaveLength(2);
      expect(s.players[0].name).toBe("Alice");
      expect(s.players[0].targetIndex).toBe(0);
      expect(s.players[0].currentTarget).toBe(1);
      expect(s.players[0].finished).toBe(false);
      expect(s.players[1].name).toBe("Bob");
      expect(s.players[1].currentTarget).toBe(1);
    });

    it("sets currentRound to 1 and clears winners", () => {
      store().startGame({ roundLimit: 0 }, ["Alice"]);
      expect(store().currentRound).toBe(1);
      expect(store().winners).toBeNull();
      expect(store().currentRoundDarts).toEqual([]);
    });

    it("clears undo stack on startGame", () => {
      store().startGame({ roundLimit: 0 }, ["Alice"]);
      store().addDart(S1); // push to undo stack
      store().startGame({ roundLimit: 0 }, ["Alice"]);
      expect(store().undoStack).toEqual([]);
    });
  });

  describe("addDart", () => {
    beforeEach(() => {
      store().startGame({ roundLimit: 0 }, ["Alice", "Bob"]);
    });

    it("hit advances target to next number", () => {
      store().addDart(S1); // hit single 1 while target is 1
      const player = store().players[0];
      expect(player.targetIndex).toBe(1);
      expect(player.currentTarget).toBe(2);
    });

    it("miss does not advance target", () => {
      store().addDart(MISS);
      const player = store().players[0];
      expect(player.targetIndex).toBe(0);
      expect(player.currentTarget).toBe(1);
    });

    it("wrong number does not advance target", () => {
      store().addDart(S5); // target is 1, throwing at 5
      const player = store().players[0];
      expect(player.targetIndex).toBe(0);
      expect(player.currentTarget).toBe(1);
    });

    it("double advances by 2", () => {
      store().addDart(D1); // double 1 while target is 1
      const player = store().players[0];
      expect(player.targetIndex).toBe(2);
      expect(player.currentTarget).toBe(3);
    });

    it("triple advances by 3", () => {
      store().addDart(T1); // triple 1 while target is 1
      const player = store().players[0];
      expect(player.targetIndex).toBe(3);
      expect(player.currentTarget).toBe(4);
    });

    it("increments totalDartsThrown", () => {
      store().addDart(S1);
      store().addDart(MISS);
      expect(store().players[0].totalDartsThrown).toBe(2);
    });

    it("records dart in currentRoundDarts", () => {
      store().addDart(S1);
      expect(store().currentRoundDarts).toHaveLength(1);
      expect(store().currentRoundDarts[0].hit).toBe(true);
    });

    it("pushes undo snapshot on addDart", () => {
      store().addDart(S1);
      expect(store().undoStack).toHaveLength(1);
    });
  });

  describe("undoLastDart", () => {
    beforeEach(() => {
      store().startGame({ roundLimit: 0 }, ["Alice"]);
    });

    it("reverts state to before the dart was thrown", () => {
      const before = store().players[0].targetIndex;
      store().addDart(S1); // advances target
      expect(store().players[0].targetIndex).toBe(1);
      store().undoLastDart();
      expect(store().players[0].targetIndex).toBe(before);
    });

    it("pops from undo stack", () => {
      store().addDart(S1);
      store().addDart(S2);
      expect(store().undoStack).toHaveLength(2);
      store().undoLastDart();
      expect(store().undoStack).toHaveLength(1);
    });

    it("is a no-op when undo stack is empty", () => {
      const before = store();
      store().undoLastDart();
      const after = store();
      expect(after.players).toEqual(before.players);
      expect(after.undoStack).toEqual([]);
    });
  });

  describe("nextTurn", () => {
    beforeEach(() => {
      store().startGame({ roundLimit: 0 }, ["Alice", "Bob"]);
    });

    it("advances to next player", () => {
      store().addDart(S1);
      store().nextTurn();
      expect(store().currentPlayerIndex).toBe(1);
    });

    it("wraps around and increments round", () => {
      store().nextTurn(); // Alice -> Bob
      expect(store().currentPlayerIndex).toBe(1);
      expect(store().currentRound).toBe(1);
      store().nextTurn(); // Bob -> Alice, round 2
      expect(store().currentPlayerIndex).toBe(0);
      expect(store().currentRound).toBe(2);
    });

    it("clears currentRoundDarts", () => {
      store().addDart(S1);
      expect(store().currentRoundDarts).toHaveLength(1);
      store().nextTurn();
      expect(store().currentRoundDarts).toEqual([]);
    });

    it("pushes undo snapshot on nextTurn", () => {
      const stackBefore = store().undoStack.length;
      store().nextTurn();
      expect(store().undoStack).toHaveLength(stackBefore + 1);
    });
  });

  describe("resetGame", () => {
    it("clears state back to defaults", () => {
      store().startGame({ roundLimit: 0 }, ["Alice"]);
      store().addDart(S1);
      store().resetGame();
      expect(store().players).toEqual([]);
      expect(store().currentRound).toBe(1);
      expect(store().winners).toBeNull();
      expect(store().undoStack).toEqual([]);
    });
  });

  describe("serialization", () => {
    it("getSerializableState and restoreState round-trip", () => {
      store().startGame({ roundLimit: 0 }, ["Alice", "Bob"]);
      store().addDart(S1);
      store().addDart(S2);
      const saved = store().getSerializableState();
      store().resetGame();
      expect(store().players).toEqual([]);
      store().restoreState(saved);
      expect(store().players).toHaveLength(2);
      expect(store().players[0].currentTarget).toBe(3); // advanced past 1 and 2
      expect(store().undoStack).toHaveLength(2);
    });

    it("getSerializableState includes undoStack", () => {
      store().startGame({ roundLimit: 0 }, ["Alice"]);
      store().addDart(S1);
      const saved = store().getSerializableState();
      expect(saved).toHaveProperty("undoStack");
      expect(saved.undoStack).toHaveLength(1);
    });
  });

  describe("undo stack cap", () => {
    it("caps at 12 entries", () => {
      store().startGame({ roundLimit: 0 }, ["Alice"]);
      // Throw 15 darts across multiple turns to build up undo stack
      for (let i = 0; i < 15; i++) {
        store().addDart(MISS);
        if ((i + 1) % 3 === 0) {
          store().nextTurn(); // also pushes to undo stack
        }
      }
      expect(store().undoStack.length).toBeLessThanOrEqual(12);
    });
  });
});
