import { describe, it, expect, beforeEach } from "vitest";
import { highScoreEngine } from "./highScoreEngine.ts";
import { DEFAULT_HIGHSCORE_OPTIONS } from "./highScore.types.ts";
import type { HighScoreOptions, HighScoreState } from "./highScore.types.ts";
import { CreateSegment, SegmentID } from "../board/Dartboard.ts";

// Helpers — common segments
const s20 = CreateSegment(SegmentID.OUTER_20);
const d20 = CreateSegment(SegmentID.DBL_20);
const t20 = CreateSegment(SegmentID.TRP_20);
const s1 = CreateSegment(SegmentID.OUTER_1);
const bull = CreateSegment(SegmentID.BULL);
const dblBull = CreateSegment(SegmentID.DBL_BULL);
const miss = CreateSegment(SegmentID.MISS);

let state: HighScoreState;

function start(opts: Partial<HighScoreOptions> = {}, players = ["Alice"]) {
  state = highScoreEngine.startGame(
    { ...DEFAULT_HIGHSCORE_OPTIONS, ...opts },
    players,
  );
}

function addDart(segment: ReturnType<typeof CreateSegment>) {
  state = { ...state, ...highScoreEngine.addDart(state, segment) };
}

function nextTurn() {
  state = { ...state, ...highScoreEngine.nextTurn(state) };
}

function undoLastDart() {
  state = { ...state, ...highScoreEngine.undoLastDart(state) };
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
  it("initializes all players with score 0", () => {
    start({}, ["Alice", "Bob"]);
    expect(player(0).score).toBe(0);
    expect(player(1).score).toBe(0);
  });

  it("starts at round 1, player index 0", () => {
    expect(state.currentRound).toBe(1);
    expect(state.currentPlayerIndex).toBe(0);
  });

  it("creates the correct number of players", () => {
    start({}, ["Alice", "Bob", "Charlie"]);
    expect(state.players).toHaveLength(3);
    expect(state.players.map((p) => p.name)).toEqual([
      "Alice",
      "Bob",
      "Charlie",
    ]);
  });

  it("starts with no winners", () => {
    expect(state.winners).toBeNull();
  });

  it("starts with empty currentRoundDarts", () => {
    expect(state.currentRoundDarts).toHaveLength(0);
  });

  it("starts with inPlayoff false", () => {
    expect(state.inPlayoff).toBe(false);
    expect(state.playoffDarts).toHaveLength(0);
  });

  it("players start with empty rounds array", () => {
    expect(player().rounds).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// addDart
// ---------------------------------------------------------------------------
describe("addDart", () => {
  it("records segment with normalized value", () => {
    addDart(s20);
    expect(state.currentRoundDarts).toHaveLength(1);
    expect(state.currentRoundDarts[0].value).toBe(20);
    expect(state.currentRoundDarts[0].segment).toBe(s20);
  });

  it("records multiple darts up to 3", () => {
    addDart(s20);
    addDart(s1);
    addDart(t20);
    expect(state.currentRoundDarts).toHaveLength(3);
    expect(state.currentRoundDarts[0].value).toBe(20);
    expect(state.currentRoundDarts[1].value).toBe(1);
    expect(state.currentRoundDarts[2].value).toBe(60);
  });

  it("ignores 4th dart (3-dart cap)", () => {
    addDart(s20);
    addDart(s1);
    addDart(t20);
    const before = [...state.currentRoundDarts];
    addDart(s20);
    expect(state.currentRoundDarts).toHaveLength(3);
    expect(state.currentRoundDarts).toEqual(before);
  });

  it("ignores darts after winners are set", () => {
    start({ rounds: 1 }, ["Alice"]);
    addDart(s20);
    nextTurn(); // game ends
    expect(state.winners).not.toBeNull();
    addDart(s1);
    expect(state.currentRoundDarts).toHaveLength(0);
  });

  it("records miss segment with value 0", () => {
    addDart(miss);
    expect(state.currentRoundDarts).toHaveLength(1);
    expect(state.currentRoundDarts[0].value).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// addDart — splitBull
// ---------------------------------------------------------------------------
describe("addDart — splitBull OFF (default)", () => {
  it("outer bull value is normalized to 50", () => {
    addDart(bull);
    expect(state.currentRoundDarts[0].value).toBe(50);
  });

  it("inner bull stays 50", () => {
    addDart(dblBull);
    expect(state.currentRoundDarts[0].value).toBe(50);
  });
});

describe("addDart — splitBull ON", () => {
  beforeEach(() => {
    start({ splitBull: true });
  });

  it("outer bull stays 25 (face value)", () => {
    addDart(bull);
    expect(state.currentRoundDarts[0].value).toBe(25);
  });

  it("inner bull stays 50", () => {
    addDart(dblBull);
    expect(state.currentRoundDarts[0].value).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// undoLastDart
// ---------------------------------------------------------------------------
describe("undoLastDart", () => {
  it("removes the last dart", () => {
    addDart(s20);
    addDart(s1);
    undoLastDart();
    expect(state.currentRoundDarts).toHaveLength(1);
    expect(state.currentRoundDarts[0].value).toBe(20);
  });

  it("no-op when no darts thrown", () => {
    const before = { ...state };
    undoLastDart();
    expect(state.currentRoundDarts).toHaveLength(0);
    expect(state.currentPlayerIndex).toBe(before.currentPlayerIndex);
  });

  it("can undo all darts back to empty", () => {
    addDart(s20);
    addDart(s1);
    undoLastDart();
    undoLastDart();
    expect(state.currentRoundDarts).toHaveLength(0);
  });

  it("allows adding a dart after undoing to unblock 3-dart cap", () => {
    addDart(s20);
    addDart(s1);
    addDart(t20);
    undoLastDart();
    addDart(d20);
    expect(state.currentRoundDarts).toHaveLength(3);
    expect(state.currentRoundDarts[2].value).toBe(40);
  });
});

// ---------------------------------------------------------------------------
// nextTurn — basic
// ---------------------------------------------------------------------------
describe("nextTurn", () => {
  it("accumulates score correctly", () => {
    addDart(s20);
    addDart(t20);
    nextTurn();
    expect(player().score).toBe(80); // 20 + 60
  });

  it("records round with score and darts", () => {
    addDart(s20);
    addDart(s1);
    nextTurn();
    expect(player().rounds).toHaveLength(1);
    expect(player().rounds[0].score).toBe(21);
    expect(player().rounds[0].darts).toHaveLength(2);
    expect(player().rounds[0].darts[0].value).toBe(20);
    expect(player().rounds[0].darts[1].value).toBe(1);
  });

  it("advances to next player", () => {
    start({}, ["Alice", "Bob"]);
    addDart(s20);
    nextTurn();
    expect(state.currentPlayerIndex).toBe(1);
  });

  it("wraps to first player after last player", () => {
    start({}, ["Alice", "Bob"]);
    nextTurn(); // Alice
    nextTurn(); // Bob → wraps
    expect(state.currentPlayerIndex).toBe(0);
  });

  it("increments round when wrapping to first player", () => {
    start({}, ["Alice", "Bob"]);
    expect(state.currentRound).toBe(1);
    nextTurn(); // Alice
    expect(state.currentRound).toBe(1);
    nextTurn(); // Bob → round 2
    expect(state.currentRound).toBe(2);
  });

  it("clears currentRoundDarts", () => {
    addDart(s20);
    addDart(s1);
    nextTurn();
    expect(state.currentRoundDarts).toHaveLength(0);
  });

  it("records zero-score round when no darts thrown", () => {
    nextTurn();
    expect(player().rounds).toHaveLength(1);
    expect(player().rounds[0].score).toBe(0);
    expect(player().rounds[0].darts).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// nextTurn — game end
// ---------------------------------------------------------------------------
describe("nextTurn — game end", () => {
  it("determines winner at last round, last player", () => {
    start({ rounds: 1 }, ["Alice", "Bob"]);
    addDart(t20); // Alice: 60
    nextTurn();
    addDart(s20); // Bob: 20
    nextTurn();
    expect(state.winners).toEqual(["Alice"]);
  });

  it("single winner with higher score", () => {
    start({ rounds: 1 }, ["Alice", "Bob"]);
    addDart(s1); // Alice: 1
    nextTurn();
    addDart(t20); // Bob: 60
    nextTurn();
    expect(state.winners).toEqual(["Bob"]);
  });

  it("shared winners with tieRule=stand", () => {
    start({ rounds: 1, tieRule: "stand" }, ["Alice", "Bob"]);
    addDart(s20); // Alice: 20
    nextTurn();
    addDart(s20); // Bob: 20
    nextTurn();
    expect(state.winners).toHaveLength(2);
    expect(state.winners).toContain("Alice");
    expect(state.winners).toContain("Bob");
  });

  it("no-op after winners are set", () => {
    start({ rounds: 1 }, ["Alice"]);
    addDart(s20);
    nextTurn(); // game over
    const before = { ...state };
    nextTurn(); // should be no-op
    expect(state.winners).toEqual(before.winners);
    expect(state.currentPlayerIndex).toBe(before.currentPlayerIndex);
  });
});

// ---------------------------------------------------------------------------
// nextTurn — playoff
// ---------------------------------------------------------------------------
describe("nextTurn — playoff", () => {
  it("tied with tieRule=playoff enters playoff mode", () => {
    start({ rounds: 1, tieRule: "playoff" }, ["Alice", "Bob"]);
    addDart(s20); // Alice: 20
    nextTurn();
    addDart(s20); // Bob: 20
    nextTurn();
    expect(state.inPlayoff).toBe(true);
    expect(state.winners).toBeNull();
  });

  it("sets currentPlayerIndex to first tied player", () => {
    start({ rounds: 1, tieRule: "playoff" }, ["Alice", "Bob", "Charlie"]);
    addDart(s1); // Alice: 1
    nextTurn();
    addDart(s20); // Bob: 20
    nextTurn();
    addDart(s20); // Charlie: 20
    nextTurn();
    expect(state.inPlayoff).toBe(true);
    // Bob is the first tied player (index 1)
    expect(state.currentPlayerIndex).toBe(1);
  });

  it("clears currentRoundDarts when entering playoff", () => {
    start({ rounds: 1, tieRule: "playoff" }, ["Alice", "Bob"]);
    addDart(s20);
    nextTurn();
    addDart(s20);
    nextTurn();
    expect(state.currentRoundDarts).toHaveLength(0);
  });

  it("no tie with tieRule=playoff still sets winner normally", () => {
    start({ rounds: 1, tieRule: "playoff" }, ["Alice", "Bob"]);
    addDart(t20); // Alice: 60
    nextTurn();
    addDart(s1); // Bob: 1
    nextTurn();
    expect(state.inPlayoff).toBe(false);
    expect(state.winners).toEqual(["Alice"]);
  });
});

// ---------------------------------------------------------------------------
// Multi-player, multi-round scenarios
// ---------------------------------------------------------------------------
describe("multi-player scenarios", () => {
  it("2 players completing 2 rounds with correct scores", () => {
    start({ rounds: 2 }, ["Alice", "Bob"]);

    // Round 1
    addDart(t20); // Alice: 60
    addDart(s1); //        +1 = 61
    nextTurn();
    addDart(s20); // Bob: 20
    nextTurn();

    expect(player(0).score).toBe(61);
    expect(player(1).score).toBe(20);
    expect(state.currentRound).toBe(2);

    // Round 2
    addDart(s20); // Alice: +20 = 81
    nextTurn();
    addDart(t20); // Bob: +60 = 80
    nextTurn();

    expect(player(0).score).toBe(81);
    expect(player(1).score).toBe(80);
    expect(state.winners).toEqual(["Alice"]);
  });

  it("score accumulates correctly across multiple rounds", () => {
    start({ rounds: 3 }, ["Alice"]);

    addDart(s20); // round 1: 20
    addDart(s20); //         +20
    addDart(s20); //         +20 = 60
    nextTurn();
    expect(player().score).toBe(60);
    expect(player().rounds).toHaveLength(1);

    addDart(t20); // round 2: 60
    nextTurn();
    expect(player().score).toBe(120);
    expect(player().rounds).toHaveLength(2);

    addDart(d20); // round 3: 40
    addDart(s1); //         +1 = 41
    nextTurn();
    expect(player().score).toBe(161);
    expect(player().rounds).toHaveLength(3);
    expect(state.winners).toEqual(["Alice"]);
  });

  it("3 players rotate turns correctly", () => {
    start({ rounds: 1 }, ["Alice", "Bob", "Charlie"]);

    expect(state.currentPlayerIndex).toBe(0);
    nextTurn(); // Alice
    expect(state.currentPlayerIndex).toBe(1);
    nextTurn(); // Bob
    expect(state.currentPlayerIndex).toBe(2);
    nextTurn(); // Charlie → game ends (round 1 complete)
    expect(state.winners).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tie handling
// ---------------------------------------------------------------------------
describe("tie handling", () => {
  it("stand — both names in winners array when tied", () => {
    start({ rounds: 2, tieRule: "stand" }, ["Alice", "Bob"]);

    // Round 1: both score 20
    addDart(s20);
    nextTurn();
    addDart(s20);
    nextTurn();

    // Round 2: both score 20
    addDart(s20);
    nextTurn();
    addDart(s20);
    nextTurn();

    expect(state.winners).toEqual(["Alice", "Bob"]);
  });

  it("playoff — enters playoff mode when tied", () => {
    start({ rounds: 2, tieRule: "playoff" }, ["Alice", "Bob"]);

    // Round 1
    addDart(s20);
    nextTurn();
    addDart(s20);
    nextTurn();

    // Round 2
    addDart(s20);
    nextTurn();
    addDart(s20);
    nextTurn();

    expect(state.inPlayoff).toBe(true);
    expect(state.winners).toBeNull();
    expect(state.playoffDarts).toHaveLength(0);
  });

  it("three-way tie with stand rule", () => {
    start({ rounds: 1, tieRule: "stand" }, ["Alice", "Bob", "Charlie"]);
    addDart(s20); // Alice: 20
    nextTurn();
    addDart(s20); // Bob: 20
    nextTurn();
    addDart(s20); // Charlie: 20
    nextTurn();
    expect(state.winners).toHaveLength(3);
    expect(state.winners).toContain("Alice");
    expect(state.winners).toContain("Bob");
    expect(state.winners).toContain("Charlie");
  });
});

// ---------------------------------------------------------------------------
// Round recording details
// ---------------------------------------------------------------------------
describe("round recording", () => {
  it("records shortName from segment in round darts", () => {
    addDart(t20);
    nextTurn();
    expect(player().rounds[0].darts[0].shortName).toBe(t20.ShortName);
  });

  it("records correct round score with mix of hits and misses", () => {
    addDart(t20); // 60
    addDart(miss); // 0
    addDart(s1); // 1
    nextTurn();
    expect(player().rounds[0].score).toBe(61);
    expect(player().rounds[0].darts).toHaveLength(3);
  });
});
