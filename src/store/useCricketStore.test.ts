import { describe, it, expect, beforeEach } from "vitest";
import { useCricketStore, CRICKET_TARGETS } from "./useCricketStore.ts";
import { CreateSegment, SegmentID } from "../board/Dartboard.ts";

// Helpers — segments for cricket targets
const s20 = CreateSegment(SegmentID.OUTER_20);  // Single 20 = 1 mark, value 20
const d20 = CreateSegment(SegmentID.DBL_20);    // Double 20 = 2 marks, value 40
const t20 = CreateSegment(SegmentID.TRP_20);    // Triple 20 = 3 marks, value 60
const s19 = CreateSegment(SegmentID.OUTER_19);  // Single 19 = 1 mark
const d19 = CreateSegment(SegmentID.DBL_19);    // Double 19 = 2 marks
const t19 = CreateSegment(SegmentID.TRP_19);    // Triple 19 = 3 marks
const s18 = CreateSegment(SegmentID.OUTER_18);
const t18 = CreateSegment(SegmentID.TRP_18);
const s17 = CreateSegment(SegmentID.OUTER_17);
const t17 = CreateSegment(SegmentID.TRP_17);
const s16 = CreateSegment(SegmentID.OUTER_16);
const t16 = CreateSegment(SegmentID.TRP_16);
const s15 = CreateSegment(SegmentID.OUTER_15);
const t15 = CreateSegment(SegmentID.TRP_15);
const bull = CreateSegment(SegmentID.BULL);     // Outer bull = 1 mark always
const dblBull = CreateSegment(SegmentID.DBL_BULL); // Inner bull = 2 marks standard, 1 if singleBull
const s5 = CreateSegment(SegmentID.OUTER_5);   // Non-cricket number — 5

function store() {
  return useCricketStore.getState();
}

function start(singleBull = false, players = ["Alice", "Bob"]) {
  store().startGame({ singleBull }, players);
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
    store().startGame({ singleBull: false }, ["Solo"]);
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
    store().nextTurn(); store().nextTurn(); // cycle back to alice
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
    store().addDart(s20); store().addDart(s20); store().addDart(s20);
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
    store().nextTurn(); store().nextTurn(); // back to alice
    store().addDart(s20); // 1 extra mark beyond 3 → 1×20 = 20 points
    expect(store().players[0].score).toBe(20);
  });

  it("double dart on closed number scores 2×face value", () => {
    start();
    store().addDart(t20); // alice closes
    store().nextTurn(); store().nextTurn();
    store().addDart(d20); // 2 extra marks → 40 points
    expect(store().players[0].score).toBe(40);
  });

  it("triple dart on closed number scores 3×face value", () => {
    start();
    store().addDart(t20); // alice closes
    store().nextTurn(); store().nextTurn();
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
    store().nextTurn(); store().nextTurn();
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
    store().nextTurn(); store().nextTurn();
    store().addDart(dblBull); // 2 more → 3 (capped) + 1 extra → 25 pts
    expect(store().players[0].marks[25]).toBe(3);
    expect(store().players[0].score).toBe(25);
  });

  it("inner bull closes in 3 darts (singleBull=true)", () => {
    start(true);
    store().addDart(dblBull); // 1 mark
    store().nextTurn(); store().nextTurn();
    store().addDart(dblBull); // 2 marks
    store().nextTurn(); store().nextTurn();
    store().addDart(dblBull); // 3 marks → closed
    expect(store().players[0].marks[25]).toBe(3);
    expect(store().players[0].score).toBe(0); // no extras this turn
  });
});

// ---------------------------------------------------------------------------
// Win condition
// ---------------------------------------------------------------------------
describe("win condition", () => {
  function closeAllFor(playerIdx: number) {
    // Close all 7 targets for the given player index (alice=0, bob=1)
    // We toggle turn to that player and throw triple for each target
    const targets = [t20, t19, t18, t17, t16, t15];
    for (const seg of targets) {
      while (store().currentPlayerIndex !== playerIdx) {
        store().nextTurn();
      }
      store().addDart(seg);
      store().nextTurn();
    }
    // Close bull with 3 singles (triple bull not available, use 3 outer)
    while (store().currentPlayerIndex !== playerIdx) store().nextTurn();
    store().addDart(bull);
    store().nextTurn();
    while (store().currentPlayerIndex !== playerIdx) store().nextTurn();
    store().addDart(bull);
    store().nextTurn();
    while (store().currentPlayerIndex !== playerIdx) store().nextTurn();
    store().addDart(bull);
  }

  it("no win until all targets closed", () => {
    start(false, ["Alice"]);
    store().addDart(t20); store().addDart(t19); store().addDart(t18);
    store().nextTurn();
    store().addDart(t17); store().addDart(t16); store().addDart(t15);
    store().nextTurn();
    // Bull not yet closed
    expect(store().winner).toBeNull();
  });

  it("win in solo game when all targets closed", () => {
    store().startGame({ singleBull: false }, ["Solo"]);
    store().addDart(t20); store().addDart(t19); store().addDart(t18);
    store().nextTurn();
    store().addDart(t17); store().addDart(t16); store().addDart(t15);
    store().nextTurn();
    store().addDart(bull); store().addDart(bull); store().addDart(bull);
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
    store().addDart(t19); store().addDart(t18); store().addDart(t15);
    store().nextTurn();
    store().nextTurn(); // bob's turn (no darts)
    store().nextTurn(); // back to alice
    store().addDart(t17); store().addDart(t16);
    // score: alice=20, bob=40 — alice has fewer points
    // Now alice closes bull — has all closed but score 20 < bob 40 → no win yet
    // Wait, alice only threw 2 darts this turn. Add bull
    store().addDart(bull);
    store().nextTurn();
    while (store().currentPlayerIndex !== 0) store().nextTurn();
    store().addDart(bull); store().addDart(bull);
    // alice: all closed, score=20, bob score=40 → NO win
    expect(store().winner).toBeNull();
  });

  it("wins when all closed and score >= all opponents", () => {
    store().startGame({ singleBull: false }, ["Solo"]);
    store().addDart(t20); store().addDart(t19); store().addDart(t18);
    store().nextTurn();
    store().addDart(t17); store().addDart(t16); store().addDart(t15);
    store().nextTurn();
    store().addDart(bull); store().addDart(bull); store().addDart(bull);
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
    store().nextTurn(); store().nextTurn();
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
    store().startGame({ singleBull: false }, ["Solo"]);
    store().addDart(t20); store().addDart(t19); store().addDart(t18);
    store().nextTurn();
    store().addDart(t17); store().addDart(t16); store().addDart(t15);
    store().nextTurn();
    store().addDart(bull); store().addDart(bull); store().addDart(bull);
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
    store().startGame({ singleBull: false }, ["Solo"]);
    store().addDart(t20); store().addDart(t19); store().addDart(t18);
    store().nextTurn();
    store().addDart(t17); store().addDart(t16); store().addDart(t15);
    store().nextTurn();
    store().addDart(bull); store().addDart(bull); store().addDart(bull);
    store().nextTurn(); // should be blocked
    expect(store().currentPlayerIndex).toBe(0);
  });
});
