import { describe, it, expect, beforeEach } from "vitest";
import { ticTacToeEngine } from "./ticTacToeEngine.ts";
import { DEFAULT_TICTACTOE_OPTIONS } from "./ticTacToe.types.ts";
import type { TicTacToeState, TicTacToeOptions } from "./ticTacToe.types.ts";
import { CreateSegment, SegmentID } from "../board/Dartboard.ts";

// Helpers — common segments
const s1 = CreateSegment(SegmentID.OUTER_1);
const d1 = CreateSegment(SegmentID.DBL_1);
const t1 = CreateSegment(SegmentID.TRP_1);
const s2 = CreateSegment(SegmentID.OUTER_2);
const t2 = CreateSegment(SegmentID.TRP_2);
const s3 = CreateSegment(SegmentID.OUTER_3);
const t3 = CreateSegment(SegmentID.TRP_3);
const s4 = CreateSegment(SegmentID.OUTER_4);
const t4 = CreateSegment(SegmentID.TRP_4);
const s6 = CreateSegment(SegmentID.OUTER_6);
const t6 = CreateSegment(SegmentID.TRP_6);
const s7 = CreateSegment(SegmentID.OUTER_7);
const t7 = CreateSegment(SegmentID.TRP_7);
const s8 = CreateSegment(SegmentID.OUTER_8);
const s9 = CreateSegment(SegmentID.OUTER_9);
const bull = CreateSegment(SegmentID.BULL);
const dblBull = CreateSegment(SegmentID.DBL_BULL);
const miss = CreateSegment(SegmentID.MISS);

let state: TicTacToeState;

// Use a fixed grid for predictable tests:
// [1] [2] [3]
// [4] [Bull] [5]
// [6] [7] [8]
const FIXED_GRID = [1, 2, 3, 4, 25, 5, 6, 7, 8];

function start(
  opts: Partial<TicTacToeOptions> = {},
  players = ["Alice", "Bob"],
) {
  state = ticTacToeEngine.startGame(
    { ...DEFAULT_TICTACTOE_OPTIONS, ...opts },
    players,
  );
  // Override grid with fixed values for deterministic tests
  state.grid = [...FIXED_GRID];
}

function addDart(segment: ReturnType<typeof CreateSegment>) {
  state = { ...state, ...ticTacToeEngine.addDart(state, segment) };
}

function nextTurn() {
  state = { ...state, ...ticTacToeEngine.nextTurn(state) };
}

function undoLastDart() {
  state = { ...state, ...ticTacToeEngine.undoLastDart(state) };
}

function player(i = 0) {
  return state.players[i];
}

beforeEach(() => {
  start();
});

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------
describe("startGame", () => {
  it("creates 2 players with empty marks", () => {
    expect(state.players).toHaveLength(2);
    expect(player(0).marks).toEqual(Array(9).fill(0));
    expect(player(1).marks).toEqual(Array(9).fill(0));
  });

  it("starts at round 1, player 0", () => {
    expect(state.currentRound).toBe(1);
    expect(state.currentPlayerIndex).toBe(0);
  });

  it("no winner or cats game at start", () => {
    expect(state.winner).toBeNull();
    expect(state.isCatsGame).toBe(false);
  });

  it("grid has 9 cells with bull in center", () => {
    expect(state.grid).toHaveLength(9);
    expect(state.grid[4]).toBe(25);
  });

  it("all cells unowned at start", () => {
    expect(state.owner).toEqual(Array(9).fill(null));
  });

  it("generated grid has unique numbers 1-20 plus bull", () => {
    // Use the real startGame (not fixed grid)
    const realState = ticTacToeEngine.startGame(DEFAULT_TICTACTOE_OPTIONS, [
      "A",
      "B",
    ]);
    expect(realState.grid[4]).toBe(25);
    const nonBull = realState.grid.filter((n) => n !== 25);
    expect(nonBull).toHaveLength(8);
    expect(new Set(nonBull).size).toBe(8);
    nonBull.forEach((n) => {
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(20);
    });
  });
});

// ---------------------------------------------------------------------------
// addDart — marks and claiming
// ---------------------------------------------------------------------------
describe("addDart — marking", () => {
  it("single hit adds 1 mark", () => {
    addDart(s1); // grid[0] = 1
    expect(player(0).marks[0]).toBe(1);
    expect(state.currentRoundDarts).toHaveLength(1);
    expect(state.currentRoundDarts[0].marksAdded).toBe(1);
    expect(state.currentRoundDarts[0].claimed).toBe(false);
  });

  it("double hit adds 2 marks", () => {
    addDart(d1); // grid[0] = 1
    expect(player(0).marks[0]).toBe(2);
    expect(state.currentRoundDarts[0].marksAdded).toBe(2);
  });

  it("triple hit adds 3 marks", () => {
    addDart(t1); // grid[0] = 1
    expect(player(0).marks[0]).toBe(3);
    expect(state.currentRoundDarts[0].marksAdded).toBe(3);
  });

  it("4 marks claims the square", () => {
    addDart(t1); // 3 marks
    addDart(s1); // 4 marks — claim
    expect(player(0).marks[0]).toBe(4);
    expect(player(0).claimed.includes(0)).toBe(true);
    expect(state.owner[0]).toBe(0);
    expect(state.currentRoundDarts[1].claimed).toBe(true);
  });

  it("overflow marks are capped at 4", () => {
    addDart(t1); // 3 marks
    addDart(d1); // would be 5, capped at 4
    expect(player(0).marks[0]).toBe(4);
    expect(state.currentRoundDarts[1].marksAdded).toBe(1); // only 1 added
    expect(state.currentRoundDarts[1].claimed).toBe(true);
  });

  it("bull hit adds marks on center square", () => {
    addDart(bull); // outer bull = 1 mark
    expect(player(0).marks[4]).toBe(1);
  });

  it("double bull adds 2 marks on center square (singleBull off)", () => {
    addDart(dblBull);
    expect(player(0).marks[4]).toBe(2);
    expect(state.currentRoundDarts[0].marksAdded).toBe(2);
  });

  it("double bull adds 1 mark when singleBull is on", () => {
    start({ singleBull: true });
    addDart(dblBull);
    expect(player(0).marks[4]).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// addDart — locked squares and misses
// ---------------------------------------------------------------------------
describe("addDart — locked squares", () => {
  it("dart on locked square has no effect", () => {
    // Player 0 claims grid[0] (number 1)
    addDart(t1); // 3
    addDart(s1); // 4 — claimed
    nextTurn(); // Bob's turn

    // Bob tries to hit number 1
    addDart(s1);
    expect(player(1).marks[0]).toBe(0);
    expect(state.currentRoundDarts[0].marksAdded).toBe(0);
  });

  it("dart on non-grid number has no effect", () => {
    // grid is [1,2,3,4,25,5,6,7,8] — number 9 is not on the grid
    addDart(s9);
    expect(state.currentRoundDarts[0].marksAdded).toBe(0);
    expect(state.currentRoundDarts[0].gridIndex).toBeNull();
  });

  it("miss segment has no effect", () => {
    addDart(miss);
    expect(state.currentRoundDarts[0].marksAdded).toBe(0);
    expect(state.currentRoundDarts[0].gridIndex).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// addDart — 3-dart limit
// ---------------------------------------------------------------------------
describe("addDart — 3-dart limit", () => {
  it("ignores 4th dart", () => {
    addDart(s1);
    addDart(s2);
    addDart(s3);
    addDart(s4); // should be ignored
    expect(state.currentRoundDarts).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// addDart — independent marks per player
// ---------------------------------------------------------------------------
describe("addDart — independent marks", () => {
  it("players have separate mark counts on the same number", () => {
    addDart(s1); // Alice: 1 mark on grid[0]
    addDart(miss);
    addDart(miss);
    nextTurn();

    addDart(s1); // Bob: 1 mark on grid[0]
    expect(player(0).marks[0]).toBe(1);
    expect(player(1).marks[0]).toBe(1);
  });

  it("first player to reach 4 claims and locks", () => {
    // Alice: 3 marks
    addDart(t1);
    addDart(miss);
    addDart(miss);
    nextTurn();

    // Bob: 3 marks
    addDart(t1);
    addDart(miss);
    addDart(miss);
    nextTurn();

    // Alice: claims with 1 more
    addDart(s1);
    expect(player(0).marks[0]).toBe(4);
    expect(state.owner[0]).toBe(0);
    addDart(miss);
    addDart(miss);
    nextTurn();

    // Bob: can't claim, it's locked
    addDart(s1);
    expect(player(1).marks[0]).toBe(3); // unchanged
    expect(state.currentRoundDarts[0].marksAdded).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Turn rotation and round progression
// ---------------------------------------------------------------------------
describe("nextTurn", () => {
  it("rotates to next player", () => {
    addDart(miss);
    nextTurn();
    expect(state.currentPlayerIndex).toBe(1);
  });

  it("wraps back to player 0 and increments round", () => {
    nextTurn(); // Alice → Bob
    expect(state.currentRound).toBe(1);
    nextTurn(); // Bob → Alice, round 2
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.currentRound).toBe(2);
  });

  it("records round history for current player", () => {
    addDart(s1);
    addDart(s2);
    nextTurn();
    expect(player(0).rounds).toHaveLength(1);
    expect(player(0).rounds[0].darts).toHaveLength(2);
  });

  it("clears currentRoundDarts", () => {
    addDart(s1);
    nextTurn();
    expect(state.currentRoundDarts).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Win condition
// ---------------------------------------------------------------------------
describe("win condition", () => {
  it("detects top row win", () => {
    // Grid: [1][2][3] top row
    // Alice claims all 3

    // Claim grid[0] (number 1): T1 + S1 = 4
    addDart(t1);
    addDart(s1);
    // Claim grid[1] (number 2): start
    addDart(t2);
    nextTurn(); // Bob

    addDart(miss);
    nextTurn(); // Alice

    // Finish grid[1]: S2 = 4 total
    addDart(s2);
    // Claim grid[2] (number 3): T3 = 3
    addDart(t3);
    addDart(s3); // 4 — claimed → top row complete
    expect(state.winner).toBe("Alice");
  });

  it("detects diagonal win", () => {
    // Diagonal: grid[0], grid[4], grid[8] → numbers 1, Bull, 8

    // Alice claims 1: T1 + S1
    addDart(t1);
    addDart(s1);
    addDart(miss);
    nextTurn();
    addDart(miss);
    nextTurn();

    // Alice claims Bull: DBULL + DBULL
    addDart(dblBull);
    addDart(dblBull);
    addDart(miss);
    nextTurn();
    addDart(miss);
    nextTurn();

    // Alice claims 8: T8... wait, need segment for 8
    // grid[8] = 8
    const t8 = CreateSegment(SegmentID.TRP_8);
    addDart(t8);
    addDart(s8); // 4 marks → claim grid[8] → diagonal complete
    expect(state.winner).toBe("Alice");
  });

  it("win is checked after each dart (mid-turn)", () => {
    // Claim grid[0]: T1 + S1
    addDart(t1);
    addDart(s1);
    expect(state.winner).toBeNull();
    addDart(miss);
    nextTurn();
    addDart(miss);
    nextTurn();

    // Claim grid[1]: T2 + S2
    addDart(t2);
    addDart(s2);
    addDart(miss);
    nextTurn();
    addDart(miss);
    nextTurn();

    // Claim grid[2]: T3 + S3 → win on 2nd dart of turn
    addDart(t3);
    addDart(s3);
    expect(state.winner).toBe("Alice");
    // 3rd dart should still be possible but...
    // Actually game should stop
  });

  it("ignores darts after winner declared", () => {
    // Quick win for Alice: top row
    addDart(t1);
    addDart(s1); // claim [0]
    addDart(t2);
    nextTurn();
    addDart(miss);
    nextTurn();
    addDart(s2); // claim [1]
    addDart(t3);
    addDart(s3); // claim [2] → win
    expect(state.winner).toBe("Alice");

    // Try to add more darts
    addDart(s4);
    expect(state.currentRoundDarts).toHaveLength(3); // unchanged
  });
});

// ---------------------------------------------------------------------------
// Cat's game detection
// ---------------------------------------------------------------------------
describe("cats game", () => {
  it("detects cats game when no lines are open", () => {
    // We need to set up a board state where every win line is blocked.
    // Use grid [1][2][3][4][Bull][5][6][7][8]
    // Alice claims: 0, 4, 5 (positions on grid)
    // Bob claims: 1, 3, 8
    // This blocks all lines if:
    //   Row1 [0,1,2]: A has 0, B has 1 → blocked for both
    //   Row2 [3,4,5]: B has 3, A has 4,5 → blocked for both
    //   Row3 [6,7,8]: B has 8 → need A to have one too... let's think differently.
    //
    // Let's manually set ownership to test the detection:
    // A: 0, 3, 7  B: 1, 4, 6
    // Row1 [0,1,2]: A=0, B=1 → blocked
    // Row2 [3,4,5]: A=3, B=4 → blocked
    // Row3 [6,7,8]: B=6, A=7 → blocked
    // Col1 [0,3,6]: A=0,3 B=6 → blocked
    // Col2 [1,4,7]: B=1,4 A=7 → blocked
    // Col3 [2,5,8]: open for both! Not cats.
    //
    // Better approach: manually craft the state
    state.owner = [0, 1, 0, 1, 0, 1, null, null, null];
    // Row1: A,B,A → blocked for both
    // Row2: B,A,B → blocked for both
    // Col1: A,B,null → open for A
    // Still not cats. Let me think...
    //
    // For a real cats game test, let's make the engine hit it naturally.
    // Simplest: claim interleaving cells until blocked.

    // Reset and do it properly via game play
    start();

    // Helper: claim a grid cell for current player
    function claimCell(gridIdx: number) {
      const num = state.grid[gridIdx];
      let seg;
      if (num === 25) {
        seg = dblBull; // 2 marks
      } else {
        // Use triple (3 marks)
        seg = CreateSegment((SegmentID.TRP_1 + (num - 1) * 4) as SegmentID);
      }
      const single =
        num === 25
          ? bull
          : CreateSegment((SegmentID.OUTER_1 + (num - 1) * 4) as SegmentID);

      // Need 4 marks: triple (3) + single (1)
      if (num === 25) {
        addDart(dblBull); // 2
        addDart(dblBull); // 4 → claim
      } else {
        addDart(seg); // 3 marks
        addDart(single); // 4 marks → claim
      }
    }

    // Create a board where every line is blocked:
    // X claims: 0, 4, 5
    // O claims: 1, 3, 8
    // Then X claims: 6
    // Then O claims: 2
    // Owner: [X, O, O, O, X, X, X, null, O]
    // Check all lines:
    //   [0,1,2]: X,O,O → blocked for both ✓
    //   [3,4,5]: O,X,X → blocked for both ✓
    //   [6,7,8]: X,null,O → blocked for both ✓
    //   [0,3,6]: X,O,X → blocked for both ✓
    //   [1,4,7]: O,X,null → blocked for both ✓
    //   [2,5,8]: O,X,O → blocked for both ✓
    //   [0,4,8]: X,X,O → blocked for both ✓
    //   [2,4,6]: O,X,X → blocked for both ✓
    // All blocked! Cats game!

    // Alice (X) claims grid[0] (number 1)
    claimCell(0);
    addDart(miss);
    nextTurn();

    // Bob (O) claims grid[1] (number 2)
    claimCell(1);
    addDart(miss);
    nextTurn();

    // Alice claims grid[4] (bull)
    claimCell(4);
    addDart(miss);
    nextTurn();

    // Bob claims grid[3] (number 4)
    claimCell(3);
    addDart(miss);
    nextTurn();

    // Alice claims grid[5] (number 5)
    claimCell(5);
    addDart(miss);
    nextTurn();

    // Bob claims grid[8] (number 8)
    claimCell(8);
    addDart(miss);
    nextTurn();

    // Alice claims grid[6] (number 6)
    claimCell(6);
    // After claiming grid[6], check cats game detection
    // Owner should be: [X, O, null, O, X, X, X, null, O]
    // Not cats yet — [1,4,7] is open for O (only X at 4 blocks... wait O has 1)
    // [1,4,7]: O,X,null → both have cells → blocked for both
    // [2,5,8]: null,X,O → blocked for both (X at 5, O at 8)
    // Hmm we need O to claim 2 for full cats

    addDart(miss);
    nextTurn();

    // Bob claims grid[2] (number 3) — this should trigger cats game
    claimCell(2);
    // Owner: [X, O, O, O, X, X, X, null, O]

    expect(state.isCatsGame).toBe(true);
    expect(state.winner).toBeNull();
  });

  it("does not declare cats game when a line is still open", () => {
    // Alice claims grid[0], Bob claims grid[1]
    // Many lines still open
    addDart(t1);
    addDart(s1); // claim [0]
    addDart(miss);
    nextTurn();

    addDart(t2);
    addDart(s2); // claim [1]
    addDart(miss);
    nextTurn();

    expect(state.isCatsGame).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Round limit
// ---------------------------------------------------------------------------
describe("round limit", () => {
  it("ends game as cats game when round limit reached", () => {
    start({ roundLimit: 2 });

    // Round 1: both players throw misses
    nextTurn(); // Alice done
    nextTurn(); // Bob done — round 2

    // Round 2
    nextTurn(); // Alice done
    // Bob's nextTurn should trigger round limit
    nextTurn();

    expect(state.isCatsGame).toBe(true);
  });

  it("unlimited rounds (0) does not trigger limit", () => {
    start({ roundLimit: 0 });

    // Play several rounds of misses
    for (let i = 0; i < 30; i++) {
      nextTurn();
    }
    expect(state.isCatsGame).toBe(false);
    expect(state.currentRound).toBe(16); // 30 turns / 2 players = 15 full rounds + 1
  });
});

// ---------------------------------------------------------------------------
// Undo
// ---------------------------------------------------------------------------
describe("undoLastDart", () => {
  it("removes last dart", () => {
    addDart(s1);
    addDart(s2);
    undoLastDart();
    expect(state.currentRoundDarts).toHaveLength(1);
    expect(player(0).marks[1]).toBe(0); // s2 undone
  });

  it("no-op when no darts thrown", () => {
    undoLastDart();
    expect(state.currentRoundDarts).toHaveLength(0);
  });

  it("restores marks after undo", () => {
    addDart(t1); // 3 marks on grid[0]
    addDart(s1); // 4 marks — claimed
    expect(player(0).marks[0]).toBe(4);
    expect(state.owner[0]).toBe(0);

    undoLastDart();
    expect(player(0).marks[0]).toBe(3);
    expect(state.owner[0]).toBeNull();
    expect(player(0).claimed.includes(0)).toBe(false);
  });

  it("clears winner on undo", () => {
    // Quick top-row win setup
    addDart(t1);
    addDart(s1); // claim [0]
    addDart(t2);
    nextTurn();
    addDart(miss);
    nextTurn();
    addDart(s2); // claim [1]
    addDart(t3);
    addDart(s3); // claim [2] → win
    expect(state.winner).toBe("Alice");

    undoLastDart();
    expect(state.winner).toBeNull();
  });

  it("undoes miss dart correctly", () => {
    addDart(miss);
    expect(state.currentRoundDarts).toHaveLength(1);
    undoLastDart();
    expect(state.currentRoundDarts).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Full game playthrough
// ---------------------------------------------------------------------------
describe("full game playthrough", () => {
  it("Alice wins with a column", () => {
    // Grid: [1][2][3][4][Bull][5][6][7][8]
    // Alice targets column 1: grid[0]=1, grid[3]=4, grid[6]=6

    // Round 1 — Alice claims 1 and starts 4
    addDart(t1);
    addDart(s1); // 4 → claim grid[0]
    addDart(t4); // 3 marks on grid[3]
    nextTurn();

    // Round 1 — Bob throws misses
    addDart(miss);
    addDart(miss);
    addDart(miss);
    nextTurn();

    // Round 2 — Alice claims 4 and starts 6
    addDart(s4); // 4 → claim grid[3]
    addDart(t6); // 3 marks on grid[6]
    addDart(s6); // 4 → claim grid[6] → column 1 [0,3,6] complete!
    expect(state.winner).toBe("Alice");
  });

  it("Bob wins after Alice fails", () => {
    // Bob targets row 3: grid[6]=6, grid[7]=7, grid[8]=8

    // Round 1 — Alice
    addDart(miss);
    nextTurn();

    // Round 1 — Bob claims 6
    addDart(t6);
    addDart(s6); // claim grid[6]
    addDart(t7); // 3 marks on grid[7]
    nextTurn();

    // Round 2 — Alice
    addDart(miss);
    nextTurn();

    // Round 2 — Bob claims 7 and 8
    addDart(s7); // 4 → claim grid[7]
    const t8 = CreateSegment(SegmentID.TRP_8);
    addDart(t8); // 3 marks on grid[8]
    addDart(s8); // 4 → claim grid[8] → row 3 complete!
    expect(state.winner).toBe("Bob");
  });
});

// ---------------------------------------------------------------------------
// nextTurn does nothing after game over
// ---------------------------------------------------------------------------
describe("post-game guards", () => {
  it("nextTurn is no-op after winner", () => {
    // Set up a quick win
    addDart(t1);
    addDart(s1);
    addDart(t2);
    nextTurn();
    addDart(miss);
    nextTurn();
    addDart(s2);
    addDart(t3);
    addDart(s3);
    expect(state.winner).toBe("Alice");

    const prevState = { ...state };
    nextTurn();
    expect(state.currentPlayerIndex).toBe(prevState.currentPlayerIndex);
  });

  it("nextTurn is no-op after cats game", () => {
    start({ roundLimit: 1 });
    nextTurn(); // Alice
    nextTurn(); // Bob → cats
    expect(state.isCatsGame).toBe(true);

    const prevRound = state.currentRound;
    nextTurn();
    expect(state.currentRound).toBe(prevRound);
  });
});
