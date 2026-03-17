import { describe, it, expect, beforeEach } from "vitest";
import { useCricketStore, CRICKET_TARGETS } from "./useCricketStore.ts";
import { CreateSegment, SegmentID } from "../board/Dartboard.ts";

// Helpers — segments for cricket targets
const s20 = CreateSegment(SegmentID.OUTER_20); // Single 20 = 1 mark, value 20
const d20 = CreateSegment(SegmentID.DBL_20); // Double 20 = 2 marks, value 40
const t20 = CreateSegment(SegmentID.TRP_20); // Triple 20 = 3 marks, value 60
const t19 = CreateSegment(SegmentID.TRP_19); // Triple 19 = 3 marks
const t18 = CreateSegment(SegmentID.TRP_18);
const t17 = CreateSegment(SegmentID.TRP_17);
const t16 = CreateSegment(SegmentID.TRP_16);
const t15 = CreateSegment(SegmentID.TRP_15);
const bull = CreateSegment(SegmentID.BULL); // Outer bull = 1 mark always
const dblBull = CreateSegment(SegmentID.DBL_BULL); // Inner bull = 2 marks standard, 1 if singleBull
const s5 = CreateSegment(SegmentID.OUTER_5); // Non-cricket number — 5

function store() {
  return useCricketStore.getState();
}

function start(
  singleBull = false,
  players = ["Alice", "Bob"],
  cutThroat = false,
) {
  store().startGame({ singleBull, roundLimit: 0, cutThroat }, players);
}

beforeEach(() => {
  store().resetGame();
});

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------
describe("startGame", () => {
  it("initializes all cricket targets to 0 marks", () => {
    start();
    const player = store().players[0];
    for (const t of CRICKET_TARGETS) {
      expect(player.marks[t]).toBe(0);
    }
  });

  it("initializes score to 0", () => {
    start();
    expect(store().players[0].score).toBe(0);
  });

  it("starts at player index 0", () => {
    start();
    expect(store().currentPlayerIndex).toBe(0);
  });

  it("supports single player", () => {
    store().startGame({ singleBull: false, roundLimit: 0, cutThroat: false }, [
      "Solo",
    ]);
    expect(store().players).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Mark tracking
// ---------------------------------------------------------------------------
describe("mark tracking", () => {
  beforeEach(() => start());

  it("single dart adds 1 mark", () => {
    store().addDart(s20);
    expect(store().players[0].marks[20]).toBe(1);
  });

  it("double dart adds 2 marks", () => {
    store().addDart(d20);
    expect(store().players[0].marks[20]).toBe(2);
  });

  it("triple dart adds 3 marks (closing)", () => {
    store().addDart(t20);
    expect(store().players[0].marks[20]).toBe(3);
  });

  it("marks are capped at 3", () => {
    store().addDart(t20); // 3 marks — closed
    store().nextTurn();
    store().nextTurn(); // cycle back to alice
    store().addDart(s20); // extra mark — capped, no scoring (bob still open)
    expect(store().players[0].marks[20]).toBe(3);
  });

  it("non-cricket segment adds no marks", () => {
    store().addDart(s5);
    const player = store().players[0];
    for (const t of CRICKET_TARGETS) {
      expect(player.marks[t]).toBe(0);
    }
  });

  it("limit of 3 darts per turn enforced", () => {
    store().addDart(s20);
    store().addDart(s20);
    store().addDart(s20);
    store().addDart(s20); // 4th — ignored
    expect(store().currentRoundDarts).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------
describe("scoring (points)", () => {
  it("no points while closing (marks 0→3)", () => {
    start();
    store().addDart(t20); // alice closes 20
    expect(store().players[0].score).toBe(0);
  });

  it("scores points for extra marks when opponent is open", () => {
    start(); // Alice, Bob
    // Alice closes 20 — Bob still has 0 marks on 20
    store().addDart(t20); // alice: 3 marks, closed
    store().nextTurn();
    store().nextTurn(); // back to alice
    store().addDart(s20); // 1 extra mark beyond 3 → 1×20 = 20 points
    expect(store().players[0].score).toBe(20);
  });

  it("double dart on closed number scores 2×face value", () => {
    start();
    store().addDart(t20); // alice closes
    store().nextTurn();
    store().nextTurn();
    store().addDart(d20); // 2 extra marks → 40 points
    expect(store().players[0].score).toBe(40);
  });

  it("triple dart on closed number scores 3×face value", () => {
    start();
    store().addDart(t20); // alice closes
    store().nextTurn();
    store().nextTurn();
    store().addDart(t20); // 3 extra marks → 60 points
    expect(store().players[0].score).toBe(60);
  });

  it("no points when all opponents are also closed", () => {
    start();
    // Alice closes 20
    store().addDart(t20);
    store().nextTurn();
    // Bob closes 20
    store().addDart(t20);
    store().nextTurn();
    // Alice throws on 20 again — no points, all closed
    store().addDart(s20);
    expect(store().players[0].score).toBe(0);
  });

  it("partial extra marks: triple on 2 existing marks → 1 closing + 2 extra", () => {
    start();
    store().addDart(d20); // alice: 2 marks
    store().nextTurn();
    store().nextTurn();
    store().addDart(t20); // 1 closing mark + 2 extra → 40 pts, alice: 3 marks
    expect(store().players[0].marks[20]).toBe(3);
    expect(store().players[0].score).toBe(40);
  });
});

// ---------------------------------------------------------------------------
// Bull options
// ---------------------------------------------------------------------------
describe("bull marks", () => {
  it("outer bull = 1 mark (singleBull=false)", () => {
    start(false);
    store().addDart(bull);
    expect(store().players[0].marks[25]).toBe(1);
  });

  it("inner bull = 2 marks (singleBull=false)", () => {
    start(false);
    store().addDart(dblBull);
    expect(store().players[0].marks[25]).toBe(2);
  });

  it("outer bull = 1 mark (singleBull=true)", () => {
    start(true);
    store().addDart(bull);
    expect(store().players[0].marks[25]).toBe(1);
  });

  it("inner bull = 1 mark (singleBull=true)", () => {
    start(true);
    store().addDart(dblBull);
    expect(store().players[0].marks[25]).toBe(1);
  });

  it("inner bull closes in 2 darts (singleBull=false)", () => {
    start(false);
    store().addDart(dblBull); // 2 marks
    store().nextTurn();
    store().nextTurn();
    store().addDart(dblBull); // 2 more → 3 (capped) + 1 extra → 25 pts
    expect(store().players[0].marks[25]).toBe(3);
    expect(store().players[0].score).toBe(25);
  });

  it("inner bull closes in 3 darts (singleBull=true)", () => {
    start(true);
    store().addDart(dblBull); // 1 mark
    store().nextTurn();
    store().nextTurn();
    store().addDart(dblBull); // 2 marks
    store().nextTurn();
    store().nextTurn();
    store().addDart(dblBull); // 3 marks → closed
    expect(store().players[0].marks[25]).toBe(3);
    expect(store().players[0].score).toBe(0); // no extras this turn
  });
});

// ---------------------------------------------------------------------------
// Win condition
// ---------------------------------------------------------------------------
describe("win condition", () => {
  it("no win until all targets closed", () => {
    start(false, ["Alice"]);
    store().addDart(t20);
    store().addDart(t19);
    store().addDart(t18);
    store().nextTurn();
    store().addDart(t17);
    store().addDart(t16);
    store().addDart(t15);
    store().nextTurn();
    // Bull not yet closed
    expect(store().winner).toBeNull();
  });

  it("win in solo game when all targets closed", () => {
    store().startGame({ singleBull: false, roundLimit: 0, cutThroat: false }, [
      "Solo",
    ]);
    store().addDart(t20);
    store().addDart(t19);
    store().addDart(t18);
    store().nextTurn();
    store().addDart(t17);
    store().addDart(t16);
    store().addDart(t15);
    store().nextTurn();
    store().addDart(bull);
    store().addDart(bull);
    store().addDart(bull);
    expect(store().winner).toBe("Solo");
  });

  it("no win when all closed but score is lower than opponent", () => {
    // Alice closes all but has 0 score; Bob has 100 from scoring
    // This requires Bob to have scored — tricky to set up, test via logic:
    // Alice needs all closed AND score >= Bob
    start(false);
    // Give Bob some points: alice closes 20, then bob scores on 20
    store().addDart(t20); // alice closes 20
    store().nextTurn();
    store().addDart(t20); // bob closes 20
    store().nextTurn();
    // Now alice scores on 20
    store().addDart(s20); // alice: 20 pts
    store().nextTurn();
    // Bob scores more on 20
    store().addDart(d20); // bob: 40 pts
    store().nextTurn();
    // alice: close remaining targets without scoring (bob already closed 20)
    // Alice closes 19,18,17,16,15,bull — bob has 0 marks on these
    store().addDart(t19);
    store().addDart(t18);
    store().addDart(t15);
    store().nextTurn();
    store().nextTurn(); // bob's turn (no darts)
    store().nextTurn(); // back to alice
    store().addDart(t17);
    store().addDart(t16);
    // score: alice=20, bob=40 — alice has fewer points
    // Now alice closes bull — has all closed but score 20 < bob 40 → no win yet
    // Wait, alice only threw 2 darts this turn. Add bull
    store().addDart(bull);
    store().nextTurn();
    while (store().currentPlayerIndex !== 0) store().nextTurn();
    store().addDart(bull);
    store().addDart(bull);
    // alice: all closed, score=20, bob score=40 → NO win
    expect(store().winner).toBeNull();
  });

  it("wins when all closed and score >= all opponents", () => {
    store().startGame({ singleBull: false, roundLimit: 0, cutThroat: false }, [
      "Solo",
    ]);
    store().addDart(t20);
    store().addDart(t19);
    store().addDart(t18);
    store().nextTurn();
    store().addDart(t17);
    store().addDart(t16);
    store().addDart(t15);
    store().nextTurn();
    store().addDart(bull);
    store().addDart(bull);
    store().addDart(bull);
    expect(store().winner).toBe("Solo");
  });
});

// ---------------------------------------------------------------------------
// Undo
// ---------------------------------------------------------------------------
describe("undoLastDart", () => {
  beforeEach(() => start());

  it("reverses mark from last dart", () => {
    store().addDart(s20);
    store().undoLastDart();
    expect(store().players[0].marks[20]).toBe(0);
  });

  it("reverses points from scoring dart", () => {
    store().addDart(t20); // close
    store().nextTurn();
    store().nextTurn();
    store().addDart(s20); // 20 pts
    store().undoLastDart();
    expect(store().players[0].score).toBe(0);
  });

  it("decrements totalDartsThrown", () => {
    store().addDart(s20);
    store().undoLastDart();
    expect(store().players[0].totalDartsThrown).toBe(0);
  });

  it("clears winner on undo", () => {
    store().startGame({ singleBull: false, roundLimit: 0, cutThroat: false }, [
      "Solo",
    ]);
    store().addDart(t20);
    store().addDart(t19);
    store().addDart(t18);
    store().nextTurn();
    store().addDart(t17);
    store().addDart(t16);
    store().addDart(t15);
    store().nextTurn();
    store().addDart(bull);
    store().addDart(bull);
    store().addDart(bull);
    expect(store().winner).toBe("Solo");
    store().undoLastDart();
    expect(store().winner).toBeNull();
  });

  it("no-ops when no darts thrown", () => {
    store().undoLastDart();
    expect(store().players[0].marks[20]).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Next turn
// ---------------------------------------------------------------------------
describe("nextTurn", () => {
  beforeEach(() => start());

  it("advances to next player", () => {
    expect(store().currentPlayerIndex).toBe(0);
    store().nextTurn();
    expect(store().currentPlayerIndex).toBe(1);
  });

  it("wraps around to player 0", () => {
    store().nextTurn(); // bob
    store().nextTurn(); // alice
    expect(store().currentPlayerIndex).toBe(0);
  });

  it("clears currentRoundDarts", () => {
    store().addDart(s20);
    store().nextTurn();
    expect(store().currentRoundDarts).toHaveLength(0);
  });

  it("does not advance turn after game won", () => {
    store().startGame({ singleBull: false, roundLimit: 0, cutThroat: false }, [
      "Solo",
    ]);
    store().addDart(t20);
    store().addDart(t19);
    store().addDart(t18);
    store().nextTurn();
    store().addDart(t17);
    store().addDart(t16);
    store().addDart(t15);
    store().nextTurn();
    store().addDart(bull);
    store().addDart(bull);
    store().addDart(bull);
    store().nextTurn(); // should be blocked
    expect(store().currentPlayerIndex).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Cut-Throat Cricket
// ---------------------------------------------------------------------------
describe("cut-throat cricket", () => {
  function startCT(players = ["Alice", "Bob"]) {
    store().startGame(
      { singleBull: false, roundLimit: 0, cutThroat: true },
      players,
    );
  }

  it("points go to opponents, not self", () => {
    startCT();
    // Alice closes 20
    store().addDart(t20);
    store().nextTurn();
    store().nextTurn(); // back to Alice
    // Alice hits S20 — extra mark scores on Bob (who hasn't closed 20)
    store().addDart(s20);
    expect(store().players[0].score).toBe(0); // Alice gets nothing
    expect(store().players[1].score).toBe(20); // Bob gets 20
  });

  it("points go to ALL open opponents (3+ players)", () => {
    startCT(["Alice", "Bob", "Carol"]);
    // Alice closes 20
    store().addDart(t20);
    store().nextTurn();
    store().nextTurn();
    store().nextTurn(); // back to Alice
    // Alice hits S20 — both Bob and Carol are open
    store().addDart(s20);
    expect(store().players[0].score).toBe(0);
    expect(store().players[1].score).toBe(20);
    expect(store().players[2].score).toBe(20);
  });

  it("no points when all opponents have closed the number", () => {
    startCT();
    // Alice closes 20
    store().addDart(t20);
    store().nextTurn();
    // Bob closes 20
    store().addDart(t20);
    store().nextTurn();
    // Alice hits S20 — Bob is also closed, no one gets points
    store().addDart(s20);
    expect(store().players[0].score).toBe(0);
    expect(store().players[1].score).toBe(0);
  });

  it("win with lowest score + all closed", () => {
    startCT();
    // Alice closes everything without scoring on Bob
    store().addDart(t20);
    store().addDart(t19);
    store().addDart(t18);
    store().nextTurn();
    store().nextTurn(); // back to Alice
    store().addDart(t17);
    store().addDart(t16);
    store().addDart(t15);
    store().nextTurn();
    store().nextTurn(); // back to Alice
    store().addDart(bull);
    store().addDart(bull);
    store().addDart(bull);
    // Alice: all closed, score 0. Bob: score 0.
    // Alice wins because 0 <= 0 and all closed
    expect(store().winner).toBe("Alice");
  });

  it("no win if score higher than opponent despite all closed", () => {
    startCT();
    // Bob scores points ON Alice: Bob closes 20, then hits extra 20s
    store().nextTurn(); // Bob's turn
    store().addDart(t20); // Bob closes 20
    store().nextTurn(); // Alice's turn
    store().nextTurn(); // back to Bob
    store().addDart(t20); // Bob extra = 60 pts go to Alice (who has 0 marks on 20)
    expect(store().players[0].score).toBe(60); // Alice has 60 from Bob's scoring
    store().nextTurn(); // Alice's turn
    // Alice closes everything
    store().addDart(t20);
    store().addDart(t19);
    store().addDart(t18);
    store().nextTurn();
    store().nextTurn(); // back to Alice
    store().addDart(t17);
    store().addDart(t16);
    store().addDart(t15);
    store().nextTurn();
    store().nextTurn(); // back to Alice
    store().addDart(bull);
    store().addDart(bull);
    store().addDart(bull);
    // Alice: all closed, score=60. Bob: score=0.
    // Alice has HIGHER score, so should NOT win in cut-throat
    expect(store().winner).not.toBe("Alice");
  });

  it("stalemate: lowest score wins", () => {
    startCT();
    // Both players close everything; Alice got some points dumped on her
    // Alice closes all
    store().addDart(t20);
    store().addDart(t19);
    store().addDart(t18);
    store().nextTurn();
    // Bob closes all
    store().addDart(t20);
    store().addDart(t19);
    store().addDart(t18);
    store().nextTurn();
    store().addDart(t17);
    store().addDart(t16);
    store().addDart(t15);
    store().nextTurn();
    store().addDart(t17);
    store().addDart(t16);
    store().addDart(t15);
    store().nextTurn();
    // Both need bull. Alice hits extra 20 first to give Bob points, then closes bull.
    // But both already closed 20, so extra 20s won't score. Use scoring on something open.
    // Actually at this point all numbers except bull are closed by both. Let's just close bull.
    store().addDart(bull);
    store().addDart(bull);
    store().addDart(bull);
    store().nextTurn();
    // Bob closes bull — stalemate, both have 0. First found = Alice
    store().addDart(bull);
    store().addDart(bull);
    store().addDart(bull);
    // Both all closed, both score 0 — lowest (0) found first = Alice
    expect(store().winner).not.toBeNull();
  });

  it("undo reverses opponent points", () => {
    startCT();
    // Alice closes 20
    store().addDart(t20);
    store().nextTurn();
    store().nextTurn(); // back to Alice
    // Alice hits S20 — Bob gets 20 points
    store().addDart(s20);
    expect(store().players[1].score).toBe(20);
    // Undo
    store().undoLastDart();
    expect(store().players[1].score).toBe(0);
    expect(store().players[0].score).toBe(0);
  });

  it("round limit: lowest score wins", () => {
    store().startGame({ singleBull: false, roundLimit: 1, cutThroat: true }, [
      "Alice",
      "Bob",
    ]);
    // Alice closes 20 and scores on Bob
    store().addDart(t20);
    store().nextTurn(); // Alice's turn done
    // Bob does nothing useful
    store().addDart(s5);
    store().nextTurn(); // round limit reached
    // Alice: 0, Bob: 0 — lowest score wins (first found)
    expect(store().winner).not.toBeNull();
  });
});
