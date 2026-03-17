import { describe, it, expect, beforeEach } from "vitest";
import { useHighScoreStore } from "./useHighScoreStore.ts";
import { CreateSegment, SegmentID } from "../board/Dartboard.ts";

// Helpers
const s20 = CreateSegment(SegmentID.OUTER_20); // Single 20, value 20
const t20 = CreateSegment(SegmentID.TRP_20); // Triple 20, value 60
const s10 = CreateSegment(SegmentID.OUTER_10); // Single 10, value 10
const bull = CreateSegment(SegmentID.BULL); // Outer bull, raw value 25
const dblBull = CreateSegment(SegmentID.DBL_BULL); // Inner bull, value 50
const s1 = CreateSegment(SegmentID.OUTER_1); // Single 1, value 1
const s5 = CreateSegment(SegmentID.OUTER_5); // Single 5, value 5

function store() {
  return useHighScoreStore.getState();
}

function start(
  opts: Partial<{
    rounds: number;
    tieRule: "stand" | "playoff";
    splitBull: boolean;
  }> = {},
  players = ["Alice"],
) {
  store().startGame(
    {
      rounds: opts.rounds ?? 2,
      tieRule: opts.tieRule ?? "stand",
      splitBull: opts.splitBull ?? false,
    },
    players,
  );
}

beforeEach(() => {
  store().resetGame();
});

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------
describe("startGame", () => {
  it("initializes players with score 0", () => {
    start({}, ["Alice", "Bob"]);
    expect(store().players[0].score).toBe(0);
    expect(store().players[1].score).toBe(0);
  });

  it("starts at round 1", () => {
    start();
    expect(store().currentRound).toBe(1);
  });

  it("starts at player index 0", () => {
    start({}, ["Alice", "Bob"]);
    expect(store().currentPlayerIndex).toBe(0);
  });

  it("no winners at start", () => {
    start();
    expect(store().winners).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Basic scoring
// ---------------------------------------------------------------------------
describe("addDart", () => {
  beforeEach(() => start());

  it("records dart in currentRoundDarts", () => {
    store().addDart(s20);
    expect(store().currentRoundDarts).toHaveLength(1);
    expect(store().currentRoundDarts[0].value).toBe(20);
  });

  it("allows up to 3 darts per turn", () => {
    store().addDart(s20);
    store().addDart(s20);
    store().addDart(s20);
    store().addDart(s20); // 4th — ignored
    expect(store().currentRoundDarts).toHaveLength(3);
  });

  it("ignores darts after winners declared", () => {
    start({ rounds: 1 });
    store().addDart(s20);
    store().addDart(s20);
    store().addDart(s20);
    store().nextTurn(); // game over
    store().addDart(s20);
    expect(store().currentRoundDarts).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Split bull
// ---------------------------------------------------------------------------
describe("splitBull", () => {
  it("outer bull = 50 when splitBull=false", () => {
    start({ splitBull: false });
    store().addDart(bull); // outer bull → 50
    expect(store().currentRoundDarts[0].value).toBe(50);
  });

  it("outer bull = 25 when splitBull=true", () => {
    start({ splitBull: true });
    store().addDart(bull); // stays 25
    expect(store().currentRoundDarts[0].value).toBe(25);
  });

  it("inner bull always = 50 regardless of splitBull", () => {
    start({ splitBull: true });
    store().addDart(dblBull);
    expect(store().currentRoundDarts[0].value).toBe(50);
  });

  it("splitBull=false outer bull contributes 50 to score", () => {
    start({ rounds: 1, splitBull: false });
    store().addDart(bull);
    store().nextTurn();
    expect(store().players[0].score).toBe(50);
  });

  it("splitBull=true outer bull contributes 25 to score", () => {
    start({ rounds: 1, splitBull: true });
    store().addDart(bull);
    store().nextTurn();
    expect(store().players[0].score).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// nextTurn and round progression
// ---------------------------------------------------------------------------
describe("nextTurn", () => {
  it("commits round score to player", () => {
    start();
    store().addDart(s20);
    store().addDart(t20); // 20+60=80
    store().nextTurn();
    expect(store().players[0].score).toBe(80);
    expect(store().players[0].rounds).toHaveLength(1);
    expect(store().players[0].rounds[0].score).toBe(80);
  });

  it("advances to next player in same round", () => {
    start({}, ["Alice", "Bob"]);
    store().nextTurn();
    expect(store().currentPlayerIndex).toBe(1);
    expect(store().currentRound).toBe(1);
  });

  it("increments round after all players go", () => {
    start({ rounds: 2 }, ["Alice", "Bob"]);
    store().nextTurn(); // alice r1
    store().nextTurn(); // bob r1 → round 2
    expect(store().currentRound).toBe(2);
    expect(store().currentPlayerIndex).toBe(0);
  });

  it("clears currentRoundDarts after nextTurn", () => {
    start();
    store().addDart(s20);
    store().nextTurn();
    expect(store().currentRoundDarts).toHaveLength(0);
  });

  it("empty round (0 darts) scores 0", () => {
    start({ rounds: 1 });
    store().nextTurn();
    expect(store().players[0].score).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Rounds option
// ---------------------------------------------------------------------------
describe("rounds option", () => {
  it.each([1, 5, 10])("game ends after %i rounds", (rounds) => {
    start({ rounds });
    for (let r = 0; r < rounds; r++) {
      store().addDart(s20);
      store().nextTurn();
    }
    expect(store().winners).not.toBeNull();
    expect(store().winners).toContain("Alice");
  });

  it("game is not over before last round completes", () => {
    start({ rounds: 3 });
    store().addDart(s20);
    store().nextTurn(); // round 1
    store().addDart(s20);
    store().nextTurn(); // round 2
    expect(store().winners).toBeNull();
    store().addDart(s20);
    store().nextTurn(); // round 3 → game over
    expect(store().winners).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tie rule — stand
// ---------------------------------------------------------------------------
describe("tieRule: stand", () => {
  it("single winner is declared normally", () => {
    start({ rounds: 1, tieRule: "stand" }, ["Alice", "Bob"]);
    store().addDart(t20);
    store().nextTurn(); // alice: 60
    store().addDart(s10);
    store().nextTurn(); // bob: 10
    expect(store().winners).toEqual(["Alice"]);
  });

  it("tied players both declared winners (shared win)", () => {
    start({ rounds: 1, tieRule: "stand" }, ["Alice", "Bob"]);
    store().addDart(s20);
    store().nextTurn(); // alice: 20
    store().addDart(s20);
    store().nextTurn(); // bob: 20 — tie
    expect(store().winners).toHaveLength(2);
    expect(store().winners).toContain("Alice");
    expect(store().winners).toContain("Bob");
  });

  it("three-way tie all declared winners", () => {
    start({ rounds: 1, tieRule: "stand" }, ["Alice", "Bob", "Carol"]);
    store().addDart(s20);
    store().nextTurn();
    store().addDart(s20);
    store().nextTurn();
    store().addDart(s20);
    store().nextTurn();
    expect(store().winners).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Tie rule — playoff
// ---------------------------------------------------------------------------
describe("tieRule: playoff", () => {
  it("no winner declared on tie — enters playoff mode", () => {
    start({ rounds: 1, tieRule: "playoff" }, ["Alice", "Bob"]);
    store().addDart(s20);
    store().nextTurn(); // alice: 20
    store().addDart(s20);
    store().nextTurn(); // bob: 20 — tie
    expect(store().winners).toBeNull();
    expect(store().inPlayoff).toBe(true);
  });

  it("no playoff when clear winner", () => {
    start({ rounds: 1, tieRule: "playoff" }, ["Alice", "Bob"]);
    store().addDart(t20);
    store().nextTurn(); // alice: 60
    store().addDart(s1);
    store().nextTurn(); // bob: 1
    expect(store().inPlayoff).toBe(false);
    expect(store().winners).toEqual(["Alice"]);
  });

  it("playoff sets currentPlayerIndex to first tied player", () => {
    start({ rounds: 1, tieRule: "playoff" }, ["Alice", "Bob"]);
    store().addDart(s20);
    store().nextTurn();
    store().addDart(s20);
    store().nextTurn();
    // Both tied — first tied player is index 0 (Alice)
    expect(store().currentPlayerIndex).toBe(0);
  });

  it("partial tie: only tied players enter playoff", () => {
    start({ rounds: 1, tieRule: "playoff" }, ["Alice", "Bob", "Carol"]);
    store().addDart(s20);
    store().nextTurn(); // alice: 20
    store().addDart(s20);
    store().nextTurn(); // bob: 20
    store().addDart(s5);
    store().nextTurn(); // carol: 5
    // alice and bob tied at 20 → playoff
    expect(store().inPlayoff).toBe(true);
    expect(store().winners).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Undo
// ---------------------------------------------------------------------------
describe("undoLastDart", () => {
  beforeEach(() => start());

  it("removes last dart from currentRoundDarts", () => {
    store().addDart(s20);
    store().addDart(t20);
    store().undoLastDart();
    expect(store().currentRoundDarts).toHaveLength(1);
    expect(store().currentRoundDarts[0].value).toBe(20);
  });

  it("no-ops when no darts thrown", () => {
    store().undoLastDart();
    expect(store().currentRoundDarts).toHaveLength(0);
  });

  it("does not affect committed round scores", () => {
    start({ rounds: 2 });
    store().addDart(s20);
    store().nextTurn(); // commits round 1: 20
    store().addDart(t20); // round 2 in progress
    store().undoLastDart(); // removes t20 from current
    expect(store().players[0].score).toBe(20); // round 1 score intact
    expect(store().currentRoundDarts).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Multiple players and round tracking
// ---------------------------------------------------------------------------
describe("multiple players", () => {
  it("each player independently accumulates score across rounds", () => {
    start({ rounds: 2 }, ["Alice", "Bob"]);
    // Round 1
    store().addDart(s20);
    store().addDart(s20);
    store().nextTurn(); // alice r1: 40
    store().addDart(t20);
    store().nextTurn(); // bob r1: 60
    // Round 2
    store().addDart(s10);
    store().nextTurn(); // alice r2: 10
    store().addDart(s1);
    store().nextTurn(); // bob r2: 1
    expect(store().players[0].score).toBe(50); // alice: 40+10
    expect(store().players[1].score).toBe(61); // bob: 60+1
    expect(store().winners).toEqual(["Bob"]);
  });

  it("records round history per player", () => {
    start({ rounds: 2 }, ["Alice", "Bob"]);
    store().addDart(s20);
    store().nextTurn();
    store().addDart(s10);
    store().nextTurn();
    store().nextTurn(); // alice r2 empty
    store().nextTurn(); // bob r2 empty
    expect(store().players[0].rounds).toHaveLength(2);
    expect(store().players[1].rounds).toHaveLength(2);
  });
});
