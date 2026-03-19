import { describe, it, expect, beforeEach } from "vitest";
import { x01Engine } from "./x01Engine.ts";
import { CreateSegment, SegmentID } from "../board/Dartboard.ts";
import { DEFAULT_X01_OPTIONS } from "./x01.types.ts";
import type { X01State, X01Options } from "./x01.types.ts";

// Helpers — common segments
const s1 = CreateSegment(SegmentID.OUTER_1);
const s20 = CreateSegment(SegmentID.OUTER_20);
const d20 = CreateSegment(SegmentID.DBL_20);
const t20 = CreateSegment(SegmentID.TRP_20);
const d16 = CreateSegment(SegmentID.DBL_16);
const t19 = CreateSegment(SegmentID.TRP_19);
const bull = CreateSegment(SegmentID.BULL);
const dblBull = CreateSegment(SegmentID.DBL_BULL);
const miss = CreateSegment(SegmentID.MISS);

let state: X01State;

function start(opts: Partial<X01Options> = {}, players = ["Alice"]) {
  state = x01Engine.startGame({ ...DEFAULT_X01_OPTIONS, ...opts }, players);
}

function addDart(segment: ReturnType<typeof CreateSegment>) {
  state = { ...state, ...x01Engine.addDart(state, segment) };
}

function nextTurn() {
  state = { ...state, ...x01Engine.nextTurn(state) };
}

function undoLastDart() {
  state = { ...state, ...x01Engine.undoLastDart(state) };
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
  it("initializes with 501 starting score by default", () => {
    expect(player().score).toBe(501);
    expect(state.x01Options.startingScore).toBe(501);
  });

  it("initializes with 301 starting score", () => {
    start({ startingScore: 301 });
    expect(player().score).toBe(301);
    expect(state.turnStartScores[0]).toBe(301);
  });

  it("initializes with 701 starting score", () => {
    start({ startingScore: 701 });
    expect(player().score).toBe(701);
  });

  it("doubleIn=false sets opened=true", () => {
    start({ doubleIn: false });
    expect(player().opened).toBe(true);
    expect(state.turnStartOpened[0]).toBe(true);
  });

  it("doubleIn=true sets opened=false", () => {
    start({ doubleIn: true });
    expect(player().opened).toBe(false);
    expect(state.turnStartOpened[0]).toBe(false);
  });

  it("initializes multiple players correctly", () => {
    start({}, ["Alice", "Bob", "Charlie"]);
    expect(state.players).toHaveLength(3);
    expect(player(0).name).toBe("Alice");
    expect(player(1).name).toBe("Bob");
    expect(player(2).name).toBe("Charlie");
    expect(state.turnStartScores).toHaveLength(3);
    state.players.forEach((p) => {
      expect(p.score).toBe(501);
      expect(p.rounds).toHaveLength(0);
      expect(p.totalDartsThrown).toBe(0);
    });
  });

  it("starts at player 0 with no darts, no bust, no winner", () => {
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.currentRoundDarts).toHaveLength(0);
    expect(state.isBust).toBe(false);
    expect(state.winner).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Basic scoring
// ---------------------------------------------------------------------------
describe("addDart — basic scoring", () => {
  it("subtracts single value from score", () => {
    addDart(s20); // 20
    expect(player().score).toBe(481);
  });

  it("subtracts double value from score", () => {
    addDart(d20); // 40
    expect(player().score).toBe(461);
  });

  it("subtracts triple value from score", () => {
    addDart(t20); // 60
    expect(player().score).toBe(441);
  });

  it("multiple darts subtract cumulatively", () => {
    addDart(t20); // 60 → 441
    addDart(t20); // 60 → 381
    addDart(t20); // 60 → 321
    expect(player().score).toBe(321);
  });

  it("increments totalDartsThrown for each dart", () => {
    addDart(s1);
    expect(player().totalDartsThrown).toBe(1);
    addDart(s20);
    expect(player().totalDartsThrown).toBe(2);
    addDart(miss);
    expect(player().totalDartsThrown).toBe(3);
  });

  it("miss scores 0", () => {
    addDart(miss);
    expect(player().score).toBe(501);
    expect(state.currentRoundDarts[0].scored).toBe(true);
  });

  it("marks dart as scored=true on normal hit", () => {
    addDart(s20);
    expect(state.currentRoundDarts[0].scored).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// splitBull
// ---------------------------------------------------------------------------
describe("addDart — splitBull", () => {
  it("splitBull OFF: outer bull treated as 50", () => {
    addDart(bull);
    expect(player().score).toBe(451); // 501 - 50
  });

  it("splitBull OFF: inner bull also worth 50", () => {
    addDart(dblBull);
    expect(player().score).toBe(451); // 501 - 50
  });

  it("splitBull ON: outer bull worth 25", () => {
    start({ splitBull: true });
    addDart(bull);
    expect(player().score).toBe(476); // 501 - 25
  });

  it("splitBull ON: inner bull worth 50", () => {
    start({ splitBull: true });
    addDart(dblBull);
    expect(player().score).toBe(451); // 501 - 50
  });
});

// ---------------------------------------------------------------------------
// 4th dart ignored
// ---------------------------------------------------------------------------
describe("addDart — 4th dart ignored", () => {
  it("ignores 4th dart and returns state unchanged", () => {
    addDart(s1);
    addDart(s1);
    addDart(s1);
    const scoreBefore = player().score;
    addDart(s1);
    expect(state.currentRoundDarts).toHaveLength(3);
    expect(player().score).toBe(scoreBefore);
    expect(player().totalDartsThrown).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Post-winner ignored
// ---------------------------------------------------------------------------
describe("addDart — post-winner ignored", () => {
  it("ignores darts after winner is set", () => {
    start({ startingScore: 301 });
    // Manually set score so next dart wins
    state.players[0] = { ...player(), score: 20 };
    state.turnStartScores[0] = 20;
    addDart(s20); // score = 0 → winner
    expect(state.winner).toBe("Alice");
    addDart(s1); // should be ignored
    expect(state.currentRoundDarts).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Double-in
// ---------------------------------------------------------------------------
describe("addDart — double-in", () => {
  it("single does not open player — scored=false, score unchanged", () => {
    start({ doubleIn: true });
    addDart(s20);
    expect(player().opened).toBe(false);
    expect(player().score).toBe(501);
    expect(state.currentRoundDarts[0].scored).toBe(false);
  });

  it("single still increments totalDartsThrown even when not opened", () => {
    start({ doubleIn: true });
    addDart(s20);
    expect(player().totalDartsThrown).toBe(1);
  });

  it("double opens player and scores normally", () => {
    start({ doubleIn: true });
    addDart(d20); // 40, opens
    expect(player().opened).toBe(true);
    expect(player().score).toBe(461);
    expect(state.currentRoundDarts[0].scored).toBe(true);
  });

  it("after opening, subsequent singles score normally", () => {
    start({ doubleIn: true });
    addDart(d20); // opens, 40
    addDart(s20); // 20
    expect(player().score).toBe(441);
    expect(state.currentRoundDarts[1].scored).toBe(true);
  });

  it("bull opens player (splitBull OFF — treated as double bull)", () => {
    start({ doubleIn: true });
    addDart(bull); // splitBull OFF → DBL_BULL → 50, opens
    expect(player().opened).toBe(true);
    expect(player().score).toBe(451);
  });

  it("double bull opens player", () => {
    start({ doubleIn: true });
    addDart(dblBull);
    expect(player().opened).toBe(true);
    expect(player().score).toBe(451);
  });

  it("triple does not open player", () => {
    start({ doubleIn: true });
    addDart(t20);
    expect(player().opened).toBe(false);
    expect(player().score).toBe(501);
    expect(state.currentRoundDarts[0].scored).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Bust conditions
// ---------------------------------------------------------------------------
describe("addDart — bust conditions", () => {
  it("score goes below 0 → bust, score resets to turnStartScore", () => {
    start({ startingScore: 301 });
    state.players[0] = { ...player(), score: 10 };
    state.turnStartScores[0] = 10;
    addDart(s20); // 20 > 10 → bust
    expect(state.isBust).toBe(true);
    expect(player().score).toBe(10); // reset
    expect(state.currentRoundDarts[0].scored).toBe(false);
  });

  it("score reaches 1 with doubleOut → bust", () => {
    start({ doubleOut: true, startingScore: 301 });
    state.players[0] = { ...player(), score: 2 };
    state.turnStartScores[0] = 2;
    addDart(s1); // 2 - 1 = 1 → bust (can't finish with 1 in doubleOut)
    expect(state.isBust).toBe(true);
    expect(player().score).toBe(2);
  });

  it("score reaches 1 with masterOut → bust", () => {
    start({ masterOut: true, startingScore: 301 });
    state.players[0] = { ...player(), score: 2 };
    state.turnStartScores[0] = 2;
    addDart(s1); // 2 - 1 = 1 → bust
    expect(state.isBust).toBe(true);
    expect(player().score).toBe(2);
  });

  it("doubleOut: score=0 on non-double → bust", () => {
    start({ doubleOut: true, startingScore: 301 });
    state.players[0] = { ...player(), score: 20 };
    state.turnStartScores[0] = 20;
    addDart(s20); // single 20, score=0, but not a double → bust
    expect(state.isBust).toBe(true);
    expect(player().score).toBe(20);
  });

  it("masterOut: score=0 on single → bust", () => {
    start({ masterOut: true, startingScore: 301 });
    state.players[0] = { ...player(), score: 20 };
    state.turnStartScores[0] = 20;
    addDart(s20); // single 20, score=0, single → bust
    expect(state.isBust).toBe(true);
    expect(player().score).toBe(20);
  });

  it("masterOut: score=0 on triple → NOT bust (valid win)", () => {
    start({ masterOut: true, startingScore: 301 });
    state.players[0] = { ...player(), score: 57 };
    state.turnStartScores[0] = 57;
    addDart(t19); // triple 19 = 57, score=0 → valid
    expect(state.isBust).toBe(false);
    expect(player().score).toBe(0);
    expect(state.winner).toBe("Alice");
  });

  it("masterOut: score=0 on double → NOT bust (valid win)", () => {
    start({ masterOut: true, startingScore: 301 });
    state.players[0] = { ...player(), score: 32 };
    state.turnStartScores[0] = 32;
    addDart(d16); // double 16 = 32, score=0 → valid
    expect(state.isBust).toBe(false);
    expect(player().score).toBe(0);
    expect(state.winner).toBe("Alice");
  });

  it("after bust, isBust=true and further darts are ignored", () => {
    start({ startingScore: 301 });
    state.players[0] = { ...player(), score: 10 };
    state.turnStartScores[0] = 10;
    addDart(s20); // bust
    expect(state.isBust).toBe(true);
    const dartsBefore = player().totalDartsThrown;
    addDart(s1); // should be ignored
    expect(player().totalDartsThrown).toBe(dartsBefore);
    expect(state.currentRoundDarts).toHaveLength(1);
  });

  it("bust resets score even after multiple darts in the turn", () => {
    start({ startingScore: 301 });
    state.players[0] = { ...player(), score: 100 };
    state.turnStartScores[0] = 100;
    addDart(t20); // 60 → score 40
    addDart(t20); // 60 > 40 → bust
    expect(state.isBust).toBe(true);
    expect(player().score).toBe(100); // reset to turn start
  });
});

// ---------------------------------------------------------------------------
// Winning
// ---------------------------------------------------------------------------
describe("addDart — winning", () => {
  it("score=0 on valid dart → winner set to player name", () => {
    state.players[0] = { ...player(), score: 20 };
    state.turnStartScores[0] = 20;
    addDart(s20); // 20 - 20 = 0
    expect(state.winner).toBe("Alice");
    expect(player().score).toBe(0);
  });

  it("doubleOut: score=0 on double → winner", () => {
    start({ doubleOut: true });
    state.players[0] = { ...player(), score: 40 };
    state.turnStartScores[0] = 40;
    addDart(d20); // double 20 = 40 → 0
    expect(state.winner).toBe("Alice");
  });

  it("doubleOut: score=0 on bull (splitBull OFF) → winner", () => {
    start({ doubleOut: true });
    state.players[0] = { ...player(), score: 50 };
    state.turnStartScores[0] = 50;
    addDart(bull); // splitBull OFF → treated as DBL_BULL = 50 → 0
    expect(state.winner).toBe("Alice");
  });

  it("doubleOut: score=0 on double bull → winner", () => {
    start({ doubleOut: true });
    state.players[0] = { ...player(), score: 50 };
    state.turnStartScores[0] = 50;
    addDart(dblBull);
    expect(state.winner).toBe("Alice");
  });

  it("masterOut: score=0 on triple → winner", () => {
    start({ masterOut: true });
    state.players[0] = { ...player(), score: 60 };
    state.turnStartScores[0] = 60;
    addDart(t20); // triple 20 = 60 → 0
    expect(state.winner).toBe("Alice");
  });

  it("no doubleOut/masterOut: score=0 on single → winner", () => {
    state.players[0] = { ...player(), score: 1 };
    state.turnStartScores[0] = 1;
    addDart(s1);
    expect(state.winner).toBe("Alice");
  });
});

// ---------------------------------------------------------------------------
// undoLastDart — within turn
// ---------------------------------------------------------------------------
describe("undoLastDart — within turn", () => {
  it("removes last dart and recalculates score", () => {
    addDart(t20); // 60 → 441
    addDart(s20); // 20 → 421
    undoLastDart();
    expect(state.currentRoundDarts).toHaveLength(1);
    expect(player().score).toBe(441);
  });

  it("restores score to turnStartScore when all darts undone", () => {
    addDart(t20);
    undoLastDart();
    expect(state.currentRoundDarts).toHaveLength(0);
    expect(player().score).toBe(501);
  });

  it("clears isBust", () => {
    state.players[0] = { ...player(), score: 10 };
    state.turnStartScores[0] = 10;
    addDart(s20); // bust
    expect(state.isBust).toBe(true);
    undoLastDart();
    expect(state.isBust).toBe(false);
    expect(player().score).toBe(10);
  });

  it("clears winner", () => {
    state.players[0] = { ...player(), score: 20 };
    state.turnStartScores[0] = 20;
    addDart(s20); // wins
    expect(state.winner).toBe("Alice");
    undoLastDart();
    expect(state.winner).toBeNull();
    expect(player().score).toBe(20);
  });

  it("reverts totalDartsThrown", () => {
    addDart(s1);
    addDart(s1);
    expect(player().totalDartsThrown).toBe(2);
    undoLastDart();
    expect(player().totalDartsThrown).toBe(1);
  });

  it("reverts opened to turnStartOpened when no scored darts remain", () => {
    start({ doubleIn: true });
    addDart(d20); // opens + scores
    expect(player().opened).toBe(true);
    undoLastDart();
    expect(player().opened).toBe(false); // reverted to turnStartOpened
  });

  it("keeps opened=true if other scored darts remain", () => {
    start({ doubleIn: true });
    addDart(d20); // opens
    addDart(s20); // scores
    undoLastDart(); // remove s20, but d20 is still scored
    expect(player().opened).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// undoLastDart — cross-turn
// ---------------------------------------------------------------------------
describe("undoLastDart — cross-turn", () => {
  it("reverts to previous player when no darts in current turn", () => {
    start({}, ["Alice", "Bob"]);
    addDart(t20); // Alice: 60
    nextTurn();
    expect(state.currentPlayerIndex).toBe(1);
    undoLastDart(); // should revert Alice's turn
    expect(state.currentPlayerIndex).toBe(0);
  });

  it("restores previous player's score by adding back round score", () => {
    start({}, ["Alice", "Bob"]);
    addDart(t20); // Alice: 501 - 60 = 441
    addDart(t20); // Alice: 441 - 60 = 381
    nextTurn();
    undoLastDart();
    expect(player(0).score).toBe(501); // 381 + 120 = 501
  });

  it("restores previous player's openedBefore state", () => {
    start({ doubleIn: true }, ["Alice", "Bob"]);
    addDart(d20); // Alice opens + scores 40
    nextTurn();
    undoLastDart();
    // Round stored openedBefore=false (Alice was not opened at turn start)
    expect(player(0).opened).toBe(false);
  });

  it("removes the last round from previous player's history", () => {
    start({}, ["Alice", "Bob"]);
    addDart(s20);
    nextTurn();
    expect(player(0).rounds).toHaveLength(1);
    undoLastDart();
    expect(player(0).rounds).toHaveLength(0);
  });

  it("restores totalDartsThrown for previous player", () => {
    start({}, ["Alice", "Bob"]);
    addDart(s20);
    addDart(s1);
    nextTurn();
    expect(player(0).totalDartsThrown).toBe(2);
    undoLastDart();
    expect(player(0).totalDartsThrown).toBe(0);
  });

  it("no-op when previous player has no rounds", () => {
    start({}, ["Alice", "Bob"]);
    // Bob's turn, Alice has no rounds → no-op
    const before = { ...state };
    undoLastDart();
    expect(state.currentPlayerIndex).toBe(before.currentPlayerIndex);
  });

  it("wraps around to last player in a multi-player game", () => {
    start({}, ["Alice", "Bob", "Charlie"]);
    addDart(s20); // Alice
    nextTurn();
    addDart(s1); // Bob
    nextTurn();
    addDart(miss); // Charlie
    nextTurn(); // back to Alice (index 0)
    undoLastDart(); // should revert Charlie's turn
    expect(state.currentPlayerIndex).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// nextTurn
// ---------------------------------------------------------------------------
describe("nextTurn", () => {
  it("records round with score and darts", () => {
    addDart(t20); // 60
    addDart(t20); // 60
    addDart(s20); // 20 → total round = 140
    nextTurn();
    expect(player().rounds).toHaveLength(1);
    expect(player().rounds[0].score).toBe(140);
    expect(player().rounds[0].darts).toHaveLength(3);
  });

  it("advances player index", () => {
    start({}, ["Alice", "Bob"]);
    expect(state.currentPlayerIndex).toBe(0);
    nextTurn();
    expect(state.currentPlayerIndex).toBe(1);
  });

  it("wraps player index around", () => {
    start({}, ["Alice", "Bob"]);
    nextTurn(); // → Bob
    nextTurn(); // → Alice
    expect(state.currentPlayerIndex).toBe(0);
  });

  it("clears currentRoundDarts", () => {
    addDart(s20);
    addDart(s1);
    nextTurn();
    expect(state.currentRoundDarts).toHaveLength(0);
  });

  it("clears isBust", () => {
    state.players[0] = { ...player(), score: 10 };
    state.turnStartScores[0] = 10;
    addDart(s20); // bust
    expect(state.isBust).toBe(true);
    nextTurn();
    expect(state.isBust).toBe(false);
  });

  it("updates turnStartScores to current scores", () => {
    start({}, ["Alice", "Bob"]);
    addDart(t20); // Alice: 441
    nextTurn();
    expect(state.turnStartScores[0]).toBe(441);
    expect(state.turnStartScores[1]).toBe(501);
  });

  it("updates turnStartOpened", () => {
    start({ doubleIn: true }, ["Alice", "Bob"]);
    addDart(d20); // Alice opens
    nextTurn();
    expect(state.turnStartOpened[0]).toBe(true);
    expect(state.turnStartOpened[1]).toBe(false);
  });

  it("no-op when winner exists", () => {
    state.players[0] = { ...player(), score: 20 };
    state.turnStartScores[0] = 20;
    addDart(s20); // winner
    const indexBefore = state.currentPlayerIndex;
    nextTurn();
    expect(state.currentPlayerIndex).toBe(indexBefore);
  });

  it("records round with 0 score when no darts thrown", () => {
    nextTurn();
    expect(player().rounds).toHaveLength(1);
    expect(player().rounds[0].score).toBe(0);
    expect(player().rounds[0].darts).toHaveLength(0);
  });

  it("records openedBefore in round history", () => {
    start({ doubleIn: true });
    addDart(d20); // opens
    nextTurn();
    // openedBefore should be false (she was not opened at start of turn)
    expect(player().rounds[0].openedBefore).toBe(false);
  });
});
