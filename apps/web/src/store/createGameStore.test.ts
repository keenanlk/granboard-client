import { describe, it, expect, beforeEach } from "vitest";
import { createGameStore } from "./createGameStore.ts";
import type { GameEngine } from "@nlc-darts/engine";
import { CreateSegment, SegmentID } from "@nlc-darts/engine";

// ---------------------------------------------------------------------------
// Mock engine
// ---------------------------------------------------------------------------

interface MockState {
  score: number;
  currentDarts: number[];
  winner: string | null;
}

interface MockOptions {
  startScore: number;
}

const mockEngine: GameEngine<MockState, MockOptions> = {
  startGame: (opts, _names) => ({
    score: opts.startScore,
    currentDarts: [],
    winner: null,
  }),
  addDart: (state, seg) => ({
    score: state.score - seg.Value,
    currentDarts: [...state.currentDarts, seg.Value],
  }),
  undoLastDart: (state) => ({
    currentDarts: state.currentDarts.slice(0, -1),
    score: state.score + (state.currentDarts.at(-1) ?? 0),
  }),
  nextTurn: (_state) => ({
    currentDarts: [],
  }),
};

const DEFAULT: MockState = { score: 0, currentDarts: [], winner: null };

// ---------------------------------------------------------------------------
// Segments
// ---------------------------------------------------------------------------

const S20 = CreateSegment(SegmentID.INNER_20); // Value = 20
const S1 = CreateSegment(SegmentID.INNER_1); // Value = 1
const S5 = CreateSegment(SegmentID.INNER_5); // Value = 5

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createGameStore", () => {
  let useStore: ReturnType<typeof createGameStore<MockState, MockOptions>>;

  function store() {
    return useStore.getState();
  }

  beforeEach(() => {
    useStore = createGameStore(mockEngine, DEFAULT);
  });

  describe("startGame", () => {
    it("sets initial state from engine", () => {
      store().startGame({ startScore: 100 }, ["Alice"]);
      expect(store().score).toBe(100);
      expect(store().currentDarts).toEqual([]);
      expect(store().winner).toBeNull();
    });

    it("clears undo stack", () => {
      store().startGame({ startScore: 100 }, ["Alice"]);
      store().addDart(S20);
      store().startGame({ startScore: 50 }, ["Bob"]);
      expect(store().undoStack).toEqual([]);
    });
  });

  describe("addDart", () => {
    beforeEach(() => {
      store().startGame({ startScore: 100 }, ["Alice"]);
    });

    it("applies engine addDart logic", () => {
      store().addDart(S20);
      expect(store().score).toBe(80);
      expect(store().currentDarts).toEqual([20]);
    });

    it("pushes undo snapshot before applying", () => {
      store().addDart(S20);
      expect(store().undoStack).toHaveLength(1);
      // Snapshot should be the state BEFORE the dart
      expect(store().undoStack[0].score).toBe(100);
      expect(store().undoStack[0].currentDarts).toEqual([]);
    });

    it("multiple addDarts grow undo stack", () => {
      store().addDart(S20);
      store().addDart(S1);
      store().addDart(S5);
      expect(store().undoStack).toHaveLength(3);
    });
  });

  describe("undoLastDart", () => {
    beforeEach(() => {
      store().startGame({ startScore: 100 }, ["Alice"]);
    });

    it("restores state from undo stack (not engine.undoLastDart)", () => {
      store().addDart(S20); // score → 80
      store().undoLastDart();
      expect(store().score).toBe(100);
      expect(store().currentDarts).toEqual([]);
    });

    it("pops from undo stack", () => {
      store().addDart(S20);
      store().addDart(S1);
      expect(store().undoStack).toHaveLength(2);
      store().undoLastDart();
      expect(store().undoStack).toHaveLength(1);
      expect(store().score).toBe(80); // back to after first dart
    });

    it("is a no-op when undo stack is empty", () => {
      const scoreBefore = store().score;
      store().undoLastDart();
      expect(store().score).toBe(scoreBefore);
      expect(store().undoStack).toEqual([]);
    });

    it("multiple undos walk back through history", () => {
      store().addDart(S20); // score: 80
      store().addDart(S1); // score: 79
      store().addDart(S5); // score: 74
      expect(store().score).toBe(74);

      store().undoLastDart(); // back to score: 79
      expect(store().score).toBe(79);

      store().undoLastDart(); // back to score: 80
      expect(store().score).toBe(80);

      store().undoLastDart(); // back to score: 100
      expect(store().score).toBe(100);

      // One more undo is a no-op
      store().undoLastDart();
      expect(store().score).toBe(100);
    });

    it("undo restores exact state snapshot, not engine undo result", () => {
      // The store undo pops the entire previous state snapshot,
      // not the result of engine.undoLastDart
      store().addDart(S20); // snapshot[0] = {score:100, currentDarts:[], winner:null}
      const snapshotBeforeSecond = {
        score: store().score,
        currentDarts: [...store().currentDarts],
        winner: store().winner,
      };
      store().addDart(S1);

      store().undoLastDart();
      expect(store().score).toBe(snapshotBeforeSecond.score);
      expect(store().currentDarts).toEqual(snapshotBeforeSecond.currentDarts);
      expect(store().winner).toBe(snapshotBeforeSecond.winner);
    });
  });

  describe("nextTurn", () => {
    beforeEach(() => {
      store().startGame({ startScore: 100 }, ["Alice"]);
    });

    it("applies engine nextTurn logic", () => {
      store().addDart(S20);
      store().nextTurn();
      expect(store().currentDarts).toEqual([]);
    });

    it("pushes undo snapshot on nextTurn", () => {
      store().addDart(S20);
      const stackBefore = store().undoStack.length;
      store().nextTurn();
      expect(store().undoStack).toHaveLength(stackBefore + 1);
    });
  });

  describe("undo stack cap", () => {
    it("caps at 12 entries after many addDarts", () => {
      store().startGame({ startScore: 1000 }, ["Alice"]);
      for (let i = 0; i < 15; i++) {
        store().addDart(S1);
      }
      expect(store().undoStack).toHaveLength(12);
    });

    it("oldest snapshots are dropped when cap exceeded", () => {
      store().startGame({ startScore: 1000 }, ["Alice"]);
      // First dart: snapshot score=1000
      store().addDart(S1); // score→999, snapshot[0].score=1000
      // Add 12 more → total 13 addDarts, but cap at 12
      for (let i = 0; i < 12; i++) {
        store().addDart(S1);
      }
      expect(store().undoStack).toHaveLength(12);
      // The oldest snapshot (score=1000) should have been dropped
      expect(store().undoStack[0].score).toBe(999);
    });
  });

  describe("resetGame", () => {
    it("clears everything including undo stack", () => {
      store().startGame({ startScore: 100 }, ["Alice"]);
      store().addDart(S20);
      store().addDart(S1);
      store().resetGame();
      expect(store().score).toBe(DEFAULT.score);
      expect(store().currentDarts).toEqual(DEFAULT.currentDarts);
      expect(store().winner).toBe(DEFAULT.winner);
      expect(store().undoStack).toEqual([]);
    });
  });

  describe("serialization", () => {
    it("getSerializableState includes state keys and undoStack", () => {
      store().startGame({ startScore: 100 }, ["Alice"]);
      store().addDart(S20);
      const saved = store().getSerializableState();
      expect(saved).toHaveProperty("score", 80);
      expect(saved).toHaveProperty("currentDarts");
      expect(saved).toHaveProperty("winner");
      expect(saved).toHaveProperty("undoStack");
      expect(saved.undoStack).toHaveLength(1);
    });

    it("restoreState sets entire state including undoStack", () => {
      store().startGame({ startScore: 100 }, ["Alice"]);
      store().addDart(S20);
      store().addDart(S1);
      const saved = store().getSerializableState();

      store().resetGame();
      expect(store().score).toBe(0);

      store().restoreState(saved);
      expect(store().score).toBe(79);
      expect(store().currentDarts).toEqual([20, 1]);
      expect(store().undoStack).toHaveLength(2);
    });

    it("round-trip preserves undo capability", () => {
      store().startGame({ startScore: 100 }, ["Alice"]);
      store().addDart(S20);
      const saved = store().getSerializableState();

      store().resetGame();
      store().restoreState(saved);

      // Should be able to undo after restore
      store().undoLastDart();
      expect(store().score).toBe(100);
    });
  });
});
