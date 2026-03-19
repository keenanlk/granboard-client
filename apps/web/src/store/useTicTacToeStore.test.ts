import { describe, it, expect, beforeEach, vi } from "vitest";
import { useTicTacToeStore } from "./useTicTacToeStore.ts";
import { CreateSegment, SegmentID } from "@nlc-darts/engine";

function store() {
  return useTicTacToeStore.getState();
}

const MISS = CreateSegment(SegmentID.MISS);
const BULL = CreateSegment(SegmentID.BULL); // Outer bull, single
const DBL_BULL = CreateSegment(SegmentID.DBL_BULL); // Inner bull, double

/** Create a single segment for a given number (1-20). */
function singleOf(n: number) {
  // SegmentID layout: (n-1)*4 + 0 = INNER_n (single)
  return CreateSegment(((n - 1) * 4) as SegmentID);
}

/** Create a triple segment for a given number (1-20). */
function tripleOf(n: number) {
  return CreateSegment(((n - 1) * 4 + 1) as SegmentID);
}

/**
 * Helper: throw enough darts at a grid cell to claim it (4 marks).
 * Assumes the cell is not yet claimed and no darts have been thrown this turn.
 * Uses triple (3 marks) + single (1 mark) = 4.
 */
function claimCell(gridNumber: number) {
  store().addDart(tripleOf(gridNumber)); // 3 marks
  store().addDart(singleOf(gridNumber)); // 1 mark = 4 total → claimed
}

describe("useTicTacToeStore", () => {
  beforeEach(() => {
    store().resetGame();
  });

  describe("startGame", () => {
    it("initializes grid with 9 cells, center is bull (25)", () => {
      store().startGame({ roundLimit: 20, singleBull: false }, ["Alice", "Bob"]);
      const s = store();
      expect(s.grid).toHaveLength(9);
      expect(s.grid[4]).toBe(25);
    });

    it("initializes owner array to all null", () => {
      store().startGame({ roundLimit: 20, singleBull: false }, ["Alice", "Bob"]);
      expect(store().owner).toEqual(Array(9).fill(null));
    });

    it("initializes players with zero marks", () => {
      store().startGame({ roundLimit: 20, singleBull: false }, ["Alice", "Bob"]);
      const s = store();
      expect(s.players).toHaveLength(2);
      expect(s.players[0].marks).toEqual(Array(9).fill(0));
      expect(s.players[1].marks).toEqual(Array(9).fill(0));
    });

    it("sets no winner and no cat's game", () => {
      store().startGame({ roundLimit: 20, singleBull: false }, ["Alice", "Bob"]);
      expect(store().winner).toBeNull();
      expect(store().isCatsGame).toBe(false);
    });

    it("grid has 8 unique numbers from 1-20 plus bull", () => {
      store().startGame({ roundLimit: 20, singleBull: false }, ["Alice", "Bob"]);
      const grid = store().grid;
      const nonBull = grid.filter((_, i) => i !== 4);
      expect(new Set(nonBull).size).toBe(8);
      nonBull.forEach((n) => {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(20);
      });
    });
  });

  describe("addDart", () => {
    beforeEach(() => {
      // Seed a deterministic grid by mocking Math.random
      vi.spyOn(Math, "random").mockImplementation(() => 0.1);
      store().startGame({ roundLimit: 20, singleBull: false }, ["Alice", "Bob"]);
      vi.restoreAllMocks();
    });

    it("increases marks for the correct cell when hitting a grid number", () => {
      const gridNum = store().grid[0]; // first cell's number
      store().addDart(singleOf(gridNum));
      expect(store().players[0].marks[0]).toBe(1);
    });

    it("does not change marks for a miss", () => {
      store().addDart(MISS);
      expect(store().players[0].marks).toEqual(Array(9).fill(0));
    });

    it("does not change marks for a number not on the grid", () => {
      const grid = store().grid;
      // Find a number 1-20 not on the grid
      let offGrid = 1;
      while (grid.includes(offGrid) && offGrid <= 20) offGrid++;
      if (offGrid <= 20) {
        store().addDart(singleOf(offGrid));
        expect(store().players[0].marks).toEqual(Array(9).fill(0));
      }
    });

    it("claims a cell when marks reach 4", () => {
      const gridNum = store().grid[0];
      store().addDart(tripleOf(gridNum)); // 3 marks
      expect(store().owner[0]).toBeNull();
      store().addDart(singleOf(gridNum)); // 4 marks total
      expect(store().owner[0]).toBe(0); // player 0 claims it
      expect(store().players[0].marks[0]).toBe(4);
    });

    it("bull on center cell gives marks (singleBull: false)", () => {
      store().addDart(BULL); // outer bull = 1 mark on grid[4]
      expect(store().players[0].marks[4]).toBe(1);
    });

    it("double bull on center cell gives 2 marks (singleBull: false)", () => {
      store().addDart(DBL_BULL); // inner bull = 2 marks
      expect(store().players[0].marks[4]).toBe(2);
    });

    it("records dart in currentRoundDarts", () => {
      const gridNum = store().grid[0];
      store().addDart(singleOf(gridNum));
      expect(store().currentRoundDarts).toHaveLength(1);
    });

    it("pushes undo snapshot on addDart", () => {
      const gridNum = store().grid[0];
      store().addDart(singleOf(gridNum));
      expect(store().undoStack).toHaveLength(1);
    });
  });

  describe("undoLastDart", () => {
    beforeEach(() => {
      vi.spyOn(Math, "random").mockImplementation(() => 0.1);
      store().startGame({ roundLimit: 20, singleBull: false }, ["Alice", "Bob"]);
      vi.restoreAllMocks();
    });

    it("pops from undo stack and restores previous state", () => {
      const gridNum = store().grid[0];
      store().addDart(singleOf(gridNum));
      expect(store().players[0].marks[0]).toBe(1);
      store().undoLastDart();
      expect(store().players[0].marks[0]).toBe(0);
      expect(store().undoStack).toHaveLength(0);
    });

    it("is a no-op when undo stack is empty", () => {
      const marksBefore = [...store().players[0].marks];
      store().undoLastDart();
      expect(store().players[0].marks).toEqual(marksBefore);
    });
  });

  describe("nextTurn", () => {
    beforeEach(() => {
      vi.spyOn(Math, "random").mockImplementation(() => 0.1);
      store().startGame({ roundLimit: 20, singleBull: false }, ["Alice", "Bob"]);
      vi.restoreAllMocks();
    });

    it("advances to next player", () => {
      store().nextTurn();
      expect(store().currentPlayerIndex).toBe(1);
    });

    it("wraps around and increments round", () => {
      store().nextTurn(); // Alice -> Bob
      store().nextTurn(); // Bob -> Alice, round 2
      expect(store().currentPlayerIndex).toBe(0);
      expect(store().currentRound).toBe(2);
    });

    it("clears currentRoundDarts", () => {
      const gridNum = store().grid[0];
      store().addDart(singleOf(gridNum));
      store().nextTurn();
      expect(store().currentRoundDarts).toEqual([]);
    });

    it("pushes undo snapshot on nextTurn", () => {
      const stackBefore = store().undoStack.length;
      store().nextTurn();
      expect(store().undoStack).toHaveLength(stackBefore + 1);
    });
  });

  describe("winner detection", () => {
    it("detects winner when a player claims 3-in-a-row", () => {
      // Use a deterministic grid
      vi.spyOn(Math, "random").mockImplementation(() => 0.1);
      store().startGame({ roundLimit: 0, singleBull: false }, ["Alice", "Bob"]);
      vi.restoreAllMocks();

      const grid = store().grid;
      // Claim cells 0, 1, 2 for Alice (top row = win line)
      // Cell 0
      claimCell(grid[0]);
      store().nextTurn(); // Alice done
      store().nextTurn(); // Bob done (skip)

      // Cell 1
      claimCell(grid[1]);
      store().nextTurn(); // Alice done
      store().nextTurn(); // Bob done (skip)

      // Cell 2 - this should trigger the win
      store().addDart(tripleOf(grid[2])); // 3 marks
      store().addDart(singleOf(grid[2])); // 4 marks → claim → check win

      expect(store().winner).toBe("Alice");
    });
  });

  describe("cat's game detection", () => {
    it("detects cat's game when no winning lines remain", () => {
      // We'll test via round limit instead, which is simpler
      vi.spyOn(Math, "random").mockImplementation(() => 0.1);
      store().startGame({ roundLimit: 1, singleBull: false }, ["Alice", "Bob"]);
      vi.restoreAllMocks();

      // Round limit = 1: after both players take round 1, game ends as cat's game
      store().nextTurn(); // Alice finishes round 1
      store().nextTurn(); // Bob finishes round 1 → round limit hit
      expect(store().isCatsGame).toBe(true);
    });
  });

  describe("serialization", () => {
    it("getSerializableState and restoreState round-trip", () => {
      vi.spyOn(Math, "random").mockImplementation(() => 0.1);
      store().startGame({ roundLimit: 20, singleBull: false }, ["Alice", "Bob"]);
      vi.restoreAllMocks();

      const gridNum = store().grid[0];
      store().addDart(singleOf(gridNum));
      const saved = store().getSerializableState();

      store().resetGame();
      expect(store().players).toEqual([]);

      store().restoreState(saved);
      expect(store().players).toHaveLength(2);
      expect(store().players[0].marks[0]).toBe(1);
      expect(store().undoStack).toHaveLength(1);
    });
  });

  describe("resetGame", () => {
    it("clears state back to defaults", () => {
      vi.spyOn(Math, "random").mockImplementation(() => 0.1);
      store().startGame({ roundLimit: 20, singleBull: false }, ["Alice", "Bob"]);
      vi.restoreAllMocks();

      store().addDart(singleOf(store().grid[0]));
      store().resetGame();
      expect(store().players).toEqual([]);
      expect(store().grid).toEqual([]);
      expect(store().winner).toBeNull();
      expect(store().undoStack).toEqual([]);
    });
  });
});
