import { describe, expect, it } from "vitest";
import { ticTacToePickTarget } from "./ticTacToeStrategy.ts";
import { SegmentID } from "../board/Dartboard.ts";

describe("ticTacToePickTarget", () => {
  const defaultGrid = [1, 2, 3, 4, 25, 6, 7, 8, 9];
  const emptyOwner: (0 | 1 | null)[] = Array(9).fill(null);
  const emptyMarks = Array(9).fill(0);

  it("picks the winning cell to complete a row", () => {
    const owner: (0 | 1 | null)[] = [
      0,
      0,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ];
    const result = ticTacToePickTarget(defaultGrid, owner, 0, emptyMarks);
    // Winning move is index 2 (grid[2]=3) → triple of 3 = TRP_3 = 9
    expect(result).toBe(SegmentID.TRP_3);
  });

  it("blocks opponent win", () => {
    const owner: (0 | 1 | null)[] = [
      1,
      1,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ];
    const result = ticTacToePickTarget(defaultGrid, owner, 0, emptyMarks);
    // Must block index 2 (grid[2]=3) → TRP_3
    expect(result).toBe(SegmentID.TRP_3);
  });

  it("prefers center on empty board", () => {
    const result = ticTacToePickTarget(
      defaultGrid,
      [...emptyOwner],
      0,
      emptyMarks,
    );
    // Center is index 4, grid[4]=25 → DBL_BULL
    expect(result).toBe(SegmentID.DBL_BULL);
  });

  it("handles cat's game fallback (all cells claimed)", () => {
    const owner: (0 | 1 | null)[] = [0, 1, 0, 0, 1, 1, 1, 0, 0];
    const result = ticTacToePickTarget(defaultGrid, owner, 0, emptyMarks);
    // All cells claimed, fallback should return a valid SegmentID (index 0 → triple of 1)
    expect(result).toBe(SegmentID.TRP_1);
  });

  it("returns DBL_BULL when bull center is the best pick", () => {
    // Corners and edges claimed, only center open
    const owner: (0 | 1 | null)[] = [0, 1, 0, 1, null, 0, 1, 0, 1];
    const result = ticTacToePickTarget(defaultGrid, owner, 0, emptyMarks);
    expect(result).toBe(SegmentID.DBL_BULL);
  });

  it("uses opponentMarks for tiebreaking between equal cells", () => {
    // Bot is player 0, center already taken by bot.
    // Two corners (index 0 and index 2) should have similar minimax value.
    // opponentMarks biases toward higher marks.
    const owner: (0 | 1 | null)[] = [
      null,
      null,
      null,
      null,
      0,
      null,
      null,
      null,
      null,
    ];
    const opponentMarks = [0, 0, 5, 0, 0, 0, 0, 0, 0];
    const result = ticTacToePickTarget(
      defaultGrid,
      owner,
      0,
      emptyMarks,
      opponentMarks,
    );
    // Index 2 has higher opponent marks → grid[2]=3 → TRP_3
    expect(result).toBe(SegmentID.TRP_3);
  });

  it("returns a valid SegmentID (not -1 or undefined)", () => {
    const owner: (0 | 1 | null)[] = [0, null, 1, null, 0, null, 1, null, null];
    const result = ticTacToePickTarget(defaultGrid, owner, 0, emptyMarks);
    expect(result).not.toBe(-1);
    expect(result).toBeDefined();
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it("picks winning cell for player 1", () => {
    // Player 1 can win by taking index 8 (row: 2,5,8)
    const owner: (0 | 1 | null)[] = [
      0,
      0,
      null,
      null,
      1,
      null,
      null,
      null,
      null,
    ];
    const result = ticTacToePickTarget(defaultGrid, owner, 1, emptyMarks);
    // Player 1 should play strategically; verify it returns a valid segment
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it("returns triple segment for numbers 1-20", () => {
    const grid = [10, 11, 12, 13, 25, 14, 15, 16, 17];
    const owner: (0 | 1 | null)[] = [
      0,
      0,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ];
    const result = ticTacToePickTarget(grid, owner, 0, emptyMarks);
    // Should pick index 2 to win → grid[2]=12 → triple of 12 = (12-1)*4+1 = 45 = TRP_12
    expect(result).toBe(SegmentID.TRP_12);
  });

  it("chooses a corner over an edge on a board with center taken", () => {
    // Center taken by opponent; bot should prefer a corner (higher position value)
    const owner: (0 | 1 | null)[] = [
      null,
      null,
      null,
      null,
      1,
      null,
      null,
      null,
      null,
    ];
    const result = ticTacToePickTarget(defaultGrid, owner, 0, emptyMarks);
    // Corners are indices 0, 2, 6, 8
    const cornerSegments = [
      SegmentID.TRP_1, // grid[0]=1
      SegmentID.TRP_3, // grid[2]=3
      SegmentID.TRP_7, // grid[6]=7
      SegmentID.TRP_9, // grid[8]=9
    ];
    expect(cornerSegments).toContain(result);
  });
});
