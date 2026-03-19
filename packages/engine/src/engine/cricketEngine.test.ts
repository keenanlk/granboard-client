import { describe, it, expect, beforeEach } from "vitest";
import { cricketEngine } from "./cricketEngine.ts";
import { CreateSegment, SegmentID } from "../board/Dartboard.ts";
import { DEFAULT_CRICKET_OPTIONS, CRICKET_TARGETS } from "./cricket.types.ts";
import type { CricketState, CricketOptions } from "./cricket.types.ts";

// ---------------------------------------------------------------------------
// Helper segments
// ---------------------------------------------------------------------------
const s17 = CreateSegment(SegmentID.OUTER_17);
const s18 = CreateSegment(SegmentID.OUTER_18);
const s19 = CreateSegment(SegmentID.OUTER_19);
const s20 = CreateSegment(SegmentID.OUTER_20);

const d19 = CreateSegment(SegmentID.DBL_19);
const d20 = CreateSegment(SegmentID.DBL_20);

const t15 = CreateSegment(SegmentID.TRP_15);
const t16 = CreateSegment(SegmentID.TRP_16);
const t17 = CreateSegment(SegmentID.TRP_17);
const t18 = CreateSegment(SegmentID.TRP_18);
const t19 = CreateSegment(SegmentID.TRP_19);
const t20 = CreateSegment(SegmentID.TRP_20);

const bull = CreateSegment(SegmentID.BULL);
const dblBull = CreateSegment(SegmentID.DBL_BULL);
const miss = CreateSegment(SegmentID.MISS);

// Non-cricket segments
const s1 = CreateSegment(SegmentID.OUTER_1);
const s14 = CreateSegment(SegmentID.OUTER_14);

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------
let state: CricketState;

function start(opts: Partial<CricketOptions> = {}, players = ["Alice", "Bob"]) {
  state = cricketEngine.startGame(
    { ...DEFAULT_CRICKET_OPTIONS, ...opts },
    players,
  );
}

function addDart(segment: ReturnType<typeof CreateSegment>) {
  state = { ...state, ...cricketEngine.addDart(state, segment) };
}

function nextTurn() {
  state = { ...state, ...cricketEngine.nextTurn(state) };
}

function undoLastDart() {
  state = { ...state, ...cricketEngine.undoLastDart(state) };
}

function player(i = 0) {
  return state.players[i];
}

/** Utility: close all 7 targets for the current player across multiple turns. */
function closeAllTargets() {
  // Each triple closes a target in one dart. We need 7 triples = 3 turns (3+3+1).
  addDart(t20);
  addDart(t19);
  addDart(t18);
  nextTurn(); // skip opponent
  nextTurn(); // back to same player (2-player game)
  addDart(t17);
  addDart(t16);
  addDart(t15);
  nextTurn();
  nextTurn();
  addDart(CreateSegment(SegmentID.DBL_BULL)); // 2 marks on bull
  addDart(bull); // 1 more mark on bull → closed
}

beforeEach(() => {
  start();
});

// ---------------------------------------------------------------------------
// startGame
// ---------------------------------------------------------------------------
describe("startGame", () => {
  it("initializes all marks at 0 for each player", () => {
    for (const t of CRICKET_TARGETS) {
      expect(player(0).marks[t]).toBe(0);
      expect(player(1).marks[t]).toBe(0);
    }
  });

  it("initializes scores at 0", () => {
    expect(player(0).score).toBe(0);
    expect(player(1).score).toBe(0);
  });

  it("creates the correct number of players", () => {
    expect(state.players).toHaveLength(2);
    expect(player(0).name).toBe("Alice");
    expect(player(1).name).toBe("Bob");
  });

  it("starts at round 1, player index 0", () => {
    expect(state.currentRound).toBe(1);
    expect(state.currentPlayerIndex).toBe(0);
  });

  it("starts with no winner", () => {
    expect(state.winner).toBeNull();
  });

  it("starts with empty currentRoundDarts", () => {
    expect(state.currentRoundDarts).toHaveLength(0);
  });

  it("works with 3 players", () => {
    start({}, ["A", "B", "C"]);
    expect(state.players).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// addDart — marking
// ---------------------------------------------------------------------------
describe("addDart — marking", () => {
  it("single on cricket number earns 1 mark", () => {
    addDart(s20);
    expect(player(0).marks[20]).toBe(1);
    expect(state.currentRoundDarts[0].marksAdded).toBe(1);
    expect(state.currentRoundDarts[0].marksEarned).toBe(1);
  });

  it("double on cricket number earns 2 marks", () => {
    addDart(d19);
    expect(player(0).marks[19]).toBe(2);
    expect(state.currentRoundDarts[0].marksAdded).toBe(2);
    expect(state.currentRoundDarts[0].marksEarned).toBe(2);
  });

  it("triple on cricket number earns 3 marks (closes immediately)", () => {
    addDart(t18);
    expect(player(0).marks[18]).toBe(3);
    expect(state.currentRoundDarts[0].marksAdded).toBe(3);
    expect(state.currentRoundDarts[0].marksEarned).toBe(3);
  });

  it("non-cricket number earns 0 marks (target is null)", () => {
    addDart(s1);
    expect(state.currentRoundDarts[0].target).toBeNull();
    expect(state.currentRoundDarts[0].marksAdded).toBe(0);
    expect(state.currentRoundDarts[0].marksEarned).toBe(0);
  });

  it("s14 is not a cricket target", () => {
    addDart(s14);
    expect(state.currentRoundDarts[0].target).toBeNull();
  });

  it("miss earns 0 marks", () => {
    addDart(miss);
    expect(state.currentRoundDarts[0].target).toBeNull();
    expect(state.currentRoundDarts[0].marksAdded).toBe(0);
  });

  it("marks cap at 3 — triple on number with 1 mark adds only 2", () => {
    addDart(s20); // 1 mark on 20
    addDart(t20); // triple → would be 3, but only 2 more needed
    expect(player(0).marks[20]).toBe(3);
    expect(state.currentRoundDarts[1].marksAdded).toBe(2);
    expect(state.currentRoundDarts[1].marksEarned).toBe(3);
  });

  it("marks cap at 3 — double on number with 2 marks adds only 1", () => {
    addDart(d20); // 2 marks on 20
    addDart(d20); // double → would be 2, but only 1 more needed
    expect(player(0).marks[20]).toBe(3);
    expect(state.currentRoundDarts[1].marksAdded).toBe(1);
  });

  it("4th dart in a turn is ignored", () => {
    addDart(s20);
    addDart(s19);
    addDart(s18);
    addDart(s17); // 4th — ignored
    expect(state.currentRoundDarts).toHaveLength(3);
    expect(player(0).marks[17]).toBe(0);
  });

  it("darts after winner are ignored", () => {
    state.winner = "Alice";
    addDart(s20);
    expect(state.currentRoundDarts).toHaveLength(0);
  });

  it("increments totalDartsThrown", () => {
    addDart(s20);
    addDart(miss);
    expect(player(0).totalDartsThrown).toBe(2);
  });

  it("increments totalMarksEarned with effectiveMarks", () => {
    addDart(t20); // 3 effective marks (all closing)
    expect(player(0).totalMarksEarned).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// addDart — bull marks
// ---------------------------------------------------------------------------
describe("addDart — bull marks", () => {
  it("singleBull=false: outer bull earns 1 mark on 25", () => {
    addDart(bull);
    expect(player(0).marks[25]).toBe(1);
    expect(state.currentRoundDarts[0].target).toBe(25);
    expect(state.currentRoundDarts[0].marksEarned).toBe(1);
  });

  it("singleBull=false: inner bull earns 2 marks on 25", () => {
    addDart(dblBull);
    expect(player(0).marks[25]).toBe(2);
    expect(state.currentRoundDarts[0].marksEarned).toBe(2);
  });

  it("singleBull=true: outer bull earns 1 mark", () => {
    start({ singleBull: true });
    addDart(bull);
    expect(player(0).marks[25]).toBe(1);
    expect(state.currentRoundDarts[0].marksEarned).toBe(1);
  });

  it("singleBull=true: inner bull also earns only 1 mark", () => {
    start({ singleBull: true });
    addDart(dblBull);
    expect(player(0).marks[25]).toBe(1);
    expect(state.currentRoundDarts[0].marksEarned).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// addDart — scoring (standard)
// ---------------------------------------------------------------------------
describe("addDart — scoring (standard)", () => {
  it("no points while still closing (marks < 3)", () => {
    addDart(s20);
    addDart(s20);
    expect(player(0).score).toBe(0);
    expect(state.currentRoundDarts[0].pointsScored).toBe(0);
  });

  it("after closing, extra marks score face value if opponent hasn't closed", () => {
    addDart(t20); // close 20 with triple
    addDart(s20); // 4th mark → 20 points
    expect(player(0).score).toBe(20);
    expect(state.currentRoundDarts[1].pointsScored).toBe(20);
  });

  it("triple on already-closed number scores 3x face value", () => {
    addDart(t20); // close 20
    nextTurn();
    nextTurn();
    addDart(t20); // 3 extra marks × 20 = 60
    expect(player(0).score).toBe(60);
  });

  it("no points when all players have closed that number", () => {
    // Alice closes 20
    addDart(t20);
    nextTurn();
    // Bob closes 20
    addDart(t20);
    nextTurn();
    // Alice throws at 20 again — both closed, no points
    addDart(s20);
    expect(player(0).score).toBe(0);
    expect(state.currentRoundDarts[0].pointsScored).toBe(0);
  });

  it("closing dart that also has extras scores partial points", () => {
    // Alice has 1 mark on 20
    addDart(s20); // 1 mark
    addDart(t20); // triple: 2 to close + 1 extra → 20 points
    expect(player(0).marks[20]).toBe(3);
    expect(player(0).score).toBe(20);
  });

  it("points only go to thrower in standard mode", () => {
    addDart(t20); // close 20
    addDart(s20); // score 20 points
    expect(player(0).score).toBe(20);
    expect(player(1).score).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// addDart — cut-throat
// ---------------------------------------------------------------------------
describe("addDart — cut-throat", () => {
  it("points go to opponents who haven't closed", () => {
    start({ cutThroat: true });
    addDart(t20); // close 20
    addDart(s20); // 1 extra mark → 20 points to Bob
    expect(player(0).score).toBe(0);
    expect(player(1).score).toBe(20);
  });

  it("thrower's score stays 0", () => {
    start({ cutThroat: true });
    addDart(t20);
    addDart(t20); // 3 extras × 20 = 60 to Bob
    expect(player(0).score).toBe(0);
    expect(player(1).score).toBe(60);
  });

  it("no points distributed if all opponents have closed", () => {
    start({ cutThroat: true });
    // Alice closes 20
    addDart(t20);
    nextTurn();
    // Bob closes 20
    addDart(t20);
    nextTurn();
    // Alice throws at 20 — Bob already closed, no distribution
    addDart(s20);
    expect(player(0).score).toBe(0);
    expect(player(1).score).toBe(0);
  });

  it("distributes to multiple opponents in 3-player game", () => {
    start({ cutThroat: true }, ["Alice", "Bob", "Carol"]);
    addDart(t20); // close 20
    addDart(s20); // 20 points to Bob AND Carol
    expect(player(0).score).toBe(0);
    expect(player(1).score).toBe(20);
    expect(player(2).score).toBe(20);
  });

  it("only distributes to opponents who haven't closed", () => {
    start({ cutThroat: true }, ["Alice", "Bob", "Carol"]);
    // Alice closes 20
    addDart(t20);
    nextTurn();
    // Bob closes 20
    addDart(t20);
    nextTurn();
    // Carol does nothing
    nextTurn();
    // Alice scores on 20 → only Carol gets points (Bob closed)
    addDart(s20);
    expect(player(0).score).toBe(0);
    expect(player(1).score).toBe(0);
    expect(player(2).score).toBe(20);
  });

  it("pointsDistributed is recorded on the dart for undo", () => {
    start({ cutThroat: true });
    addDart(t20);
    addDart(s20);
    const dart = state.currentRoundDarts[1];
    expect(dart.pointsDistributed).toBeDefined();
    expect(dart.pointsDistributed).toEqual([{ playerIndex: 1, points: 20 }]);
  });
});

// ---------------------------------------------------------------------------
// Win conditions — standard
// ---------------------------------------------------------------------------
describe("win conditions — standard", () => {
  it("closing all 7 targets with highest score wins", () => {
    // Alice closes everything with triples, scoring on Bob
    closeAllTargets();
    expect(state.winner).not.toBeNull();
    expect(state.winner).toBe("Alice");
  });

  it("closing all but trailing on points does NOT win", () => {
    // Bob scores first: close 20 and score on it
    nextTurn(); // Bob's turn
    addDart(t20);
    addDart(t20); // 60 points for Bob
    nextTurn();
    // Alice closes everything but has 0 points (Bob has 60)
    // We need Alice to close all without scoring
    // First close Bob's open numbers so Alice can't score
    // Actually, let's manually set up the scenario
    start();
    // Give Bob 60 points and close nothing for Alice
    state.players[1] = { ...player(1), score: 60 };
    // Alice closes all targets but has 0 score
    for (const t of CRICKET_TARGETS) {
      state.players[0] = {
        ...player(0),
        marks: { ...player(0).marks, [t]: 3 },
      };
    }
    // Also close all for Bob so no scoring is possible
    for (const t of CRICKET_TARGETS) {
      state.players[1] = {
        ...player(1),
        marks: { ...player(1).marks, [t]: 3 },
      };
    }
    // Now Alice throws — she has all closed but trails on points
    // Since all closed by everyone, stalemate rule: highest score wins → Bob
    addDart(miss);
    // Check the winner via the stalemate rule
    expect(state.winner).toBe("Bob");
  });

  it("stalemate: all players close all targets — highest score wins", () => {
    start();
    // Set up: both players have all closed, Alice has 40 points, Bob has 20
    for (const t of CRICKET_TARGETS) {
      state.players[0] = {
        ...player(0),
        marks: { ...player(0).marks, [t]: 3 },
      };
      state.players[1] = {
        ...player(1),
        marks: { ...player(1).marks, [t]: 3 },
      };
    }
    state.players[0] = { ...player(0), score: 40 };
    state.players[1] = { ...player(1), score: 20 };
    // Any dart triggers winner check
    addDart(miss);
    expect(state.winner).toBe("Alice");
  });
});

// ---------------------------------------------------------------------------
// Win conditions — cut-throat
// ---------------------------------------------------------------------------
describe("win conditions — cut-throat", () => {
  it("closed all with lowest score wins", () => {
    start({ cutThroat: true });
    // Alice closes all targets. In cut-throat, she wants lowest score.
    // Set up: Alice closed all, score 0; Bob has score 60, not all closed
    for (const t of CRICKET_TARGETS) {
      state.players[0] = {
        ...player(0),
        marks: { ...player(0).marks, [t]: 3 },
      };
    }
    state.players[1] = { ...player(1), score: 60 };
    // Alice throws — she already has all closed and lowest score
    addDart(miss);
    expect(state.winner).toBe("Alice");
  });

  it("closed all but higher score does NOT win in cut-throat", () => {
    start({ cutThroat: true });
    // Alice: all closed, score 100. Bob: not all closed, score 0.
    for (const t of CRICKET_TARGETS) {
      state.players[0] = {
        ...player(0),
        marks: { ...player(0).marks, [t]: 3 },
      };
    }
    state.players[0] = { ...player(0), score: 100 };
    addDart(miss);
    // Alice has all closed but highest score — should NOT win
    expect(state.winner).toBeNull();
  });

  it("stalemate in cut-throat: lowest score wins", () => {
    start({ cutThroat: true });
    for (const t of CRICKET_TARGETS) {
      state.players[0] = {
        ...player(0),
        marks: { ...player(0).marks, [t]: 3 },
      };
      state.players[1] = {
        ...player(1),
        marks: { ...player(1).marks, [t]: 3 },
      };
    }
    state.players[0] = { ...player(0), score: 20 };
    state.players[1] = { ...player(1), score: 60 };
    addDart(miss);
    expect(state.winner).toBe("Alice");
  });
});

// ---------------------------------------------------------------------------
// undoLastDart
// ---------------------------------------------------------------------------
describe("undoLastDart", () => {
  it("reverts marks on target", () => {
    addDart(t20); // 3 marks on 20
    undoLastDart();
    expect(player(0).marks[20]).toBe(0);
  });

  it("reverts score in standard mode", () => {
    addDart(t20); // close 20
    addDart(s20); // score 20
    expect(player(0).score).toBe(20);
    undoLastDart();
    expect(player(0).score).toBe(0);
  });

  it("reverts totalDartsThrown", () => {
    addDart(s20);
    addDart(s19);
    expect(player(0).totalDartsThrown).toBe(2);
    undoLastDart();
    expect(player(0).totalDartsThrown).toBe(1);
  });

  it("reverts totalMarksEarned", () => {
    addDart(t20); // 3 effective marks
    expect(player(0).totalMarksEarned).toBe(3);
    undoLastDart();
    expect(player(0).totalMarksEarned).toBe(0);
  });

  it("reverts cut-throat opponent point distribution", () => {
    start({ cutThroat: true });
    addDart(t20);
    addDart(s20); // 20 points to Bob
    expect(player(1).score).toBe(20);
    undoLastDart();
    expect(player(1).score).toBe(0);
    expect(player(0).score).toBe(0);
  });

  it("clears winner to null", () => {
    // Set up a winning position
    for (const t of CRICKET_TARGETS) {
      state.players[0] = {
        ...player(0),
        marks: { ...player(0).marks, [t]: 3 },
      };
    }
    // Close the last one with a dart (need at least one mark to undo)
    state.players[0] = {
      ...player(0),
      marks: { ...player(0).marks, [25]: 2 },
    };
    addDart(bull); // closes bull → triggers win
    expect(state.winner).not.toBeNull();
    undoLastDart();
    expect(state.winner).toBeNull();
  });

  it("no-op when no darts thrown this turn", () => {
    const before = { ...state };
    undoLastDart();
    expect(state.currentRoundDarts).toHaveLength(0);
    expect(state.currentPlayerIndex).toBe(before.currentPlayerIndex);
  });

  it("removes the last dart from currentRoundDarts", () => {
    addDart(s20);
    addDart(s19);
    expect(state.currentRoundDarts).toHaveLength(2);
    undoLastDart();
    expect(state.currentRoundDarts).toHaveLength(1);
    expect(state.currentRoundDarts[0].target).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// nextTurn
// ---------------------------------------------------------------------------
describe("nextTurn", () => {
  it("records round with score and marksEarned", () => {
    addDart(t20); // 3 marks, 0 points (closing)
    addDart(s20); // 1 effective mark (scoring), 20 points
    nextTurn();
    const round = player(0).rounds[0];
    expect(round).toBeDefined();
    expect(round.marksEarned).toBe(4); // 3 closing + 1 scoring extra
    expect(round.score).toBe(20);
  });

  it("advances player index", () => {
    nextTurn();
    expect(state.currentPlayerIndex).toBe(1);
  });

  it("wraps player index around", () => {
    nextTurn(); // Alice → Bob
    nextTurn(); // Bob → Alice
    expect(state.currentPlayerIndex).toBe(0);
  });

  it("increments currentRound when last player finishes", () => {
    expect(state.currentRound).toBe(1);
    nextTurn(); // Alice done
    expect(state.currentRound).toBe(1);
    nextTurn(); // Bob done → round 2
    expect(state.currentRound).toBe(2);
  });

  it("clears currentRoundDarts", () => {
    addDart(s20);
    addDart(s19);
    nextTurn();
    expect(state.currentRoundDarts).toHaveLength(0);
  });

  it("no-op when winner exists", () => {
    state = { ...state, winner: "Alice" };
    const prevIndex = state.currentPlayerIndex;
    const prevRound = state.currentRound;
    nextTurn();
    expect(state.currentPlayerIndex).toBe(prevIndex);
    expect(state.currentRound).toBe(prevRound);
  });

  it("records darts in round history", () => {
    addDart(s20);
    addDart(miss);
    addDart(s19);
    nextTurn();
    const round = player(0).rounds[0];
    expect(round.darts).toHaveLength(3);
  });

  it("round limit: declares winner with highest score when reached (standard)", () => {
    start({ roundLimit: 1 });
    // Alice scores some points
    addDart(t20);
    addDart(s20); // 20 points
    nextTurn(); // Alice done
    // Bob scores nothing
    addDart(miss);
    nextTurn(); // Bob done → round limit reached
    expect(state.winner).toBe("Alice");
  });

  it("round limit: declares winner with lowest score when reached (cut-throat)", () => {
    start({ roundLimit: 1, cutThroat: true });
    // Alice closes 20 and pushes points to Bob
    addDart(t20);
    addDart(s20); // 20 points to Bob
    nextTurn();
    // Bob does nothing
    addDart(miss);
    nextTurn(); // round limit
    // Alice: 0 points, Bob: 20 points → Alice wins (lowest in cut-throat)
    expect(state.winner).toBe("Alice");
  });

  it("no winner before round limit", () => {
    start({ roundLimit: 2 });
    nextTurn();
    nextTurn(); // round 1 complete
    expect(state.winner).toBeNull();
  });

  it("3-player round advancement", () => {
    start({}, ["A", "B", "C"]);
    nextTurn(); // A done
    expect(state.currentRound).toBe(1);
    nextTurn(); // B done
    expect(state.currentRound).toBe(1);
    nextTurn(); // C done → round 2
    expect(state.currentRound).toBe(2);
    expect(state.currentPlayerIndex).toBe(0);
  });
});
