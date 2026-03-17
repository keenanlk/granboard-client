import { describe, it, expect, beforeEach } from "vitest";
import {
  atwEngine,
  ATW_SEQUENCE,
  BULL_INDEX,
  FINISHED_INDEX,
  DEFAULT_ATW_OPTIONS,
  type ATWState,
  type ATWOptions,
} from "./atwEngine.ts";
import { CreateSegment, SegmentID } from "../board/Dartboard.ts";

// Helpers — common segments
const s1 = CreateSegment(SegmentID.OUTER_1);
const d1 = CreateSegment(SegmentID.DBL_1);
const t1 = CreateSegment(SegmentID.TRP_1);
const s2 = CreateSegment(SegmentID.OUTER_2);
const s3 = CreateSegment(SegmentID.OUTER_3);
const s4 = CreateSegment(SegmentID.OUTER_4);
const s5 = CreateSegment(SegmentID.OUTER_5);
const t18 = CreateSegment(SegmentID.TRP_18);
const t19 = CreateSegment(SegmentID.TRP_19);
const s20 = CreateSegment(SegmentID.OUTER_20);
const bull = CreateSegment(SegmentID.BULL);
const dblBull = CreateSegment(SegmentID.DBL_BULL);
const miss = CreateSegment(SegmentID.MISS);

let state: ATWState;

function start(opts: Partial<ATWOptions> = {}, players = ["Alice"]) {
  state = atwEngine.startGame({ ...DEFAULT_ATW_OPTIONS, ...opts }, players);
}

function addDart(segment: ReturnType<typeof CreateSegment>) {
  state = { ...state, ...atwEngine.addDart(state, segment) };
}

function nextTurn() {
  state = { ...state, ...atwEngine.nextTurn(state) };
}

function undoLastDart() {
  state = { ...state, ...atwEngine.undoLastDart(state) };
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
  it("initializes player at target 1 (index 0)", () => {
    expect(player().targetIndex).toBe(0);
    expect(player().currentTarget).toBe(1);
    expect(player().finished).toBe(false);
  });

  it("starts at round 1, player 0", () => {
    expect(state.currentRound).toBe(1);
    expect(state.currentPlayerIndex).toBe(0);
  });

  it("no winners at start", () => {
    expect(state.winners).toBeNull();
    expect(state.firstFinishRound).toBeNull();
  });

  it("sequence has 21 targets ending with Bull", () => {
    expect(ATW_SEQUENCE).toHaveLength(21);
    expect(ATW_SEQUENCE[0]).toBe(1);
    expect(ATW_SEQUENCE[20]).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// Single/Double/Triple advancement
// ---------------------------------------------------------------------------
describe("addDart — advancement", () => {
  it("single hit advances 1 position", () => {
    addDart(s1); // hit 1 → advance to 2
    expect(player().targetIndex).toBe(1);
    expect(player().currentTarget).toBe(2);
  });

  it("double hit advances 2 positions", () => {
    addDart(d1); // hit D1 → advance to 3
    expect(player().targetIndex).toBe(2);
    expect(player().currentTarget).toBe(3);
  });

  it("triple hit advances 3 positions", () => {
    addDart(t1); // hit T1 → advance to 4
    expect(player().targetIndex).toBe(3);
    expect(player().currentTarget).toBe(4);
  });

  it("wrong number is a miss — no advancement", () => {
    addDart(s5); // need 1, hit 5
    expect(player().targetIndex).toBe(0);
    expect(player().currentTarget).toBe(1);
    expect(state.currentRoundDarts[0].hit).toBe(false);
  });

  it("miss segment is a miss", () => {
    addDart(miss);
    expect(player().targetIndex).toBe(0);
    expect(state.currentRoundDarts[0].hit).toBe(false);
  });

  it("records dart in currentRoundDarts", () => {
    addDart(s1);
    expect(state.currentRoundDarts).toHaveLength(1);
    expect(state.currentRoundDarts[0].hit).toBe(true);
    expect(state.currentRoundDarts[0].advanced).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Bull cap
// ---------------------------------------------------------------------------
describe("addDart — Bull cap", () => {
  it("advancement from 19 with triple caps at Bull (index 20)", () => {
    // Set player to target 19 (index 18)
    start();
    // Fast-forward: manually set state to index 18 (target 19)
    state.players[0] = {
      ...player(),
      targetIndex: 18,
      currentTarget: 19,
    };
    addDart(t19); // triple 19 → advance 3, but capped at 20 (Bull)
    expect(player().targetIndex).toBe(BULL_INDEX);
    expect(player().currentTarget).toBe(25);
    expect(player().finished).toBe(false); // must still HIT Bull
  });

  it("advancement from 18 with triple caps at Bull", () => {
    state.players[0] = {
      ...player(),
      targetIndex: 17,
      currentTarget: 18,
    };
    addDart(t18); // triple 18 → advance 3, 17+3=20 → capped at BULL_INDEX=20
    expect(player().targetIndex).toBe(BULL_INDEX);
    expect(player().currentTarget).toBe(25);
  });

  it("double from 19 advances to 20 (index 20 = Bull)", () => {
    state.players[0] = {
      ...player(),
      targetIndex: 18,
      currentTarget: 19,
    };
    addDart(CreateSegment(SegmentID.DBL_19)); // D19 → advance 2, 18+2=20
    expect(player().targetIndex).toBe(BULL_INDEX);
    expect(player().currentTarget).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// Must hit Bull to finish
// ---------------------------------------------------------------------------
describe("addDart — finishing on Bull", () => {
  it("hitting Bull when on Bull finishes the player", () => {
    state.players[0] = {
      ...player(),
      targetIndex: BULL_INDEX,
      currentTarget: 25,
    };
    addDart(bull);
    expect(player().finished).toBe(true);
    expect(player().targetIndex).toBe(FINISHED_INDEX);
    expect(state.firstFinishRound).toBe(1);
  });

  it("inner bull also finishes", () => {
    state.players[0] = {
      ...player(),
      targetIndex: BULL_INDEX,
      currentTarget: 25,
    };
    addDart(dblBull);
    expect(player().finished).toBe(true);
  });

  it("advancing TO Bull does NOT finish — must hit Bull separately", () => {
    state.players[0] = {
      ...player(),
      targetIndex: 19,
      currentTarget: 20,
    };
    addDart(s20); // single 20 → advance to Bull
    expect(player().targetIndex).toBe(BULL_INDEX);
    expect(player().finished).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3 darts per turn limit
// ---------------------------------------------------------------------------
describe("addDart — 3 dart limit", () => {
  it("allows up to 3 darts", () => {
    addDart(s1);
    addDart(s2);
    addDart(s3);
    expect(state.currentRoundDarts).toHaveLength(3);
  });

  it("ignores 4th dart", () => {
    addDart(s1);
    addDart(s2);
    addDart(s3);
    addDart(s4); // ignored
    expect(state.currentRoundDarts).toHaveLength(3);
  });

  it("ignores darts after player finishes", () => {
    state.players[0] = {
      ...player(),
      targetIndex: BULL_INDEX,
      currentTarget: 25,
    };
    addDart(bull); // finishes
    addDart(s1); // ignored
    expect(state.currentRoundDarts).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// nextTurn
// ---------------------------------------------------------------------------
describe("nextTurn", () => {
  it("advances to next player", () => {
    start({}, ["Alice", "Bob"]);
    nextTurn();
    expect(state.currentPlayerIndex).toBe(1);
    expect(state.currentRound).toBe(1);
  });

  it("increments round after all players go", () => {
    start({}, ["Alice", "Bob"]);
    nextTurn(); // Alice
    nextTurn(); // Bob → round 2
    expect(state.currentRound).toBe(2);
    expect(state.currentPlayerIndex).toBe(0);
  });

  it("clears currentRoundDarts", () => {
    addDart(s1);
    nextTurn();
    expect(state.currentRoundDarts).toHaveLength(0);
  });

  it("records round in player history", () => {
    addDart(s1);
    addDart(miss);
    nextTurn();
    expect(player().rounds).toHaveLength(1);
    expect(player().rounds[0].darts).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Equal turns: P1 finishes, P2 still throws
// ---------------------------------------------------------------------------
describe("equal turns", () => {
  it("P2 gets to finish their round after P1 finishes", () => {
    start({}, ["Alice", "Bob"]);
    // Alice: advance to Bull and finish
    state.players[0] = {
      ...player(0),
      targetIndex: BULL_INDEX,
      currentTarget: 25,
    };
    addDart(bull); // Alice finishes
    nextTurn(); // Alice's turn ends
    // Bob should get a turn
    expect(state.winners).toBeNull();
    expect(state.currentPlayerIndex).toBe(1);
  });

  it("winners resolved after the round completes", () => {
    start({}, ["Alice", "Bob"]);
    state.players[0] = {
      ...player(0),
      targetIndex: BULL_INDEX,
      currentTarget: 25,
    };
    addDart(bull); // Alice finishes
    nextTurn(); // Alice done

    // Bob doesn't finish
    addDart(miss);
    nextTurn(); // Bob done, round ends → winners resolved
    expect(state.winners).toEqual(["Alice"]);
  });

  it("both players finish in same round → tie", () => {
    start({}, ["Alice", "Bob"]);
    state.players[0] = {
      ...player(0),
      targetIndex: BULL_INDEX,
      currentTarget: 25,
    };
    state.players[1] = {
      ...player(1),
      targetIndex: BULL_INDEX,
      currentTarget: 25,
    };
    addDart(bull); // Alice finishes
    nextTurn();
    addDart(bull); // Bob finishes
    nextTurn(); // round ends
    expect(state.winners).toHaveLength(2);
    expect(state.winners).toContain("Alice");
    expect(state.winners).toContain("Bob");
  });
});

// ---------------------------------------------------------------------------
// Round limit
// ---------------------------------------------------------------------------
describe("round limit", () => {
  it("game ends at round limit — furthest player wins", () => {
    start({ roundLimit: 1 }, ["Alice", "Bob"]);
    addDart(s1); // Alice advances to 2
    nextTurn();
    addDart(miss); // Bob stays on 1
    nextTurn();
    expect(state.winners).toEqual(["Alice"]);
  });

  it("tied position at round limit → shared win", () => {
    start({ roundLimit: 1 }, ["Alice", "Bob"]);
    addDart(s1); // Alice on 2
    nextTurn();
    addDart(s1); // Bob on 2
    nextTurn();
    expect(state.winners).toHaveLength(2);
  });

  it("no winner before round limit", () => {
    start({ roundLimit: 2 }, ["Alice"]);
    addDart(s1);
    nextTurn(); // round 1
    expect(state.winners).toBeNull();
    addDart(s2);
    nextTurn(); // round 2 → limit reached
    expect(state.winners).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Undo
// ---------------------------------------------------------------------------
describe("undoLastDart", () => {
  it("restores previous target index", () => {
    addDart(s1); // advance to 2
    undoLastDart();
    expect(player().targetIndex).toBe(0);
    expect(player().currentTarget).toBe(1);
    expect(state.currentRoundDarts).toHaveLength(0);
  });

  it("no-ops when no darts thrown", () => {
    undoLastDart();
    expect(state.currentRoundDarts).toHaveLength(0);
  });

  it("restores finished state", () => {
    state.players[0] = {
      ...player(),
      targetIndex: BULL_INDEX,
      currentTarget: 25,
    };
    addDart(bull); // finishes
    expect(player().finished).toBe(true);
    undoLastDart();
    expect(player().finished).toBe(false);
    expect(player().targetIndex).toBe(BULL_INDEX);
    expect(state.firstFinishRound).toBeNull();
  });

  it("clears firstFinishRound when undo removes only finisher", () => {
    state.players[0] = {
      ...player(),
      targetIndex: BULL_INDEX,
      currentTarget: 25,
    };
    addDart(bull);
    expect(state.firstFinishRound).toBe(1);
    undoLastDart();
    expect(state.firstFinishRound).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Full sequence playthrough
// ---------------------------------------------------------------------------
describe("full sequence", () => {
  it("can complete 1 through Bull", () => {
    start();
    // Advance through all 20 numbers with singles, one per turn
    for (let i = 0; i < 20; i++) {
      const targetNum = ATW_SEQUENCE[i];
      // Create the segment for the current target
      const segId = (targetNum - 1) * 4; // INNER_N for number N
      addDart(CreateSegment(segId));
      nextTurn();
    }
    // Now on Bull
    expect(player().targetIndex).toBe(BULL_INDEX);
    expect(player().currentTarget).toBe(25);
    // Hit Bull
    addDart(bull);
    expect(player().finished).toBe(true);
    nextTurn();
    expect(state.winners).toEqual(["Alice"]);
  });
});

// ---------------------------------------------------------------------------
// Ignores darts after winners
// ---------------------------------------------------------------------------
describe("post-game", () => {
  it("ignores darts after winners declared", () => {
    start({ roundLimit: 1 });
    nextTurn(); // round 1 ends, round limit
    addDart(s1);
    expect(state.currentRoundDarts).toHaveLength(0);
  });
});
