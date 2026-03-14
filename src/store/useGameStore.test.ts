import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "./useGameStore.ts";
import { CreateSegment, SegmentID } from "../board/Dartboard.ts";

// Helpers
const s1 = CreateSegment(SegmentID.OUTER_1); // Single 1 — value 1
const s20 = CreateSegment(SegmentID.OUTER_20); // Single 20 — value 20
const d20 = CreateSegment(SegmentID.DBL_20); // Double 20 — value 40
const t20 = CreateSegment(SegmentID.TRP_20); // Triple 20 — value 60
const bull = CreateSegment(SegmentID.BULL); // Outer bull — value 25
const dblBull = CreateSegment(SegmentID.DBL_BULL); // Inner bull — value 50

function store() {
  return useGameStore.getState();
}

beforeEach(() => {
  store().resetGame();
});

// ---------------------------------------------------------------------------
// Starting scores
// ---------------------------------------------------------------------------
describe("starting scores", () => {
  it.each([301, 501, 701] as const)(
    "initializes player score to %i",
    (score) => {
      store().startGame(
        {
          startingScore: score,
          splitBull: false,
          doubleOut: false,
          masterOut: false,
          doubleIn: false,
        },
        ["Alice"],
      );
      expect(store().players[0].score).toBe(score);
    },
  );
});

// ---------------------------------------------------------------------------
// Basic scoring
// ---------------------------------------------------------------------------
describe("basic scoring", () => {
  beforeEach(() => {
    store().startGame(
      {
        startingScore: 501,
        splitBull: false,
        doubleOut: false,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
  });

  it("subtracts single dart value from score", () => {
    store().addDart(s20);
    expect(store().players[0].score).toBe(481);
  });

  it("subtracts triple dart correctly", () => {
    store().addDart(t20); // 60
    expect(store().players[0].score).toBe(441);
  });

  it("allows up to 3 darts per turn", () => {
    store().addDart(s20);
    store().addDart(s20);
    store().addDart(s20);
    store().addDart(s20); // 4th — should be ignored
    expect(store().currentRoundDarts).toHaveLength(3);
    expect(store().players[0].score).toBe(441);
  });

  it("increments totalDartsThrown", () => {
    store().addDart(s20);
    store().addDart(s20);
    expect(store().players[0].totalDartsThrown).toBe(2);
  });

  it("records dart as scored", () => {
    store().addDart(s20);
    expect(store().currentRoundDarts[0].scored).toBe(true);
  });

  it("detects winner when score reaches 0", () => {
    // Use a small startingScore (type-cast) so we can reach 0 in one dart
    store().startGame(
      {
        startingScore: 20 as 301,
        splitBull: false,
        doubleOut: false,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
    store().addDart(s20); // 20-20=0 → win
    expect(store().winner).toBe("Alice");
  });
});

// ---------------------------------------------------------------------------
// Bust rules
// ---------------------------------------------------------------------------
describe("bust rules", () => {
  it("busts when score goes below 0", () => {
    store().startGame(
      {
        startingScore: 19 as 301,
        splitBull: false,
        doubleOut: false,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
    store().addDart(s20); // 19-20=-1 → bust
    expect(store().isBust).toBe(true);
    expect(store().players[0].score).toBe(19); // restored
  });

  it("score=1 does NOT bust in straight play (no doubleOut/masterOut)", () => {
    store().startGame(
      {
        startingScore: 21 as 301,
        splitBull: false,
        doubleOut: false,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
    store().addDart(s20); // 21-20=1 — valid under straight rules
    expect(store().isBust).toBe(false);
    expect(store().players[0].score).toBe(1);
  });

  it("score=1 busts under doubleOut (unreachable finish)", () => {
    store().startGame(
      {
        startingScore: 21 as 301,
        splitBull: false,
        doubleOut: true,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
    store().addDart(s20); // 21-20=1 → bust (can't finish from 1 with a double)
    expect(store().isBust).toBe(true);
    expect(store().players[0].score).toBe(21);
  });

  it("score=1 busts under masterOut (unreachable finish)", () => {
    store().startGame(
      {
        startingScore: 21 as 301,
        splitBull: false,
        doubleOut: false,
        masterOut: true,
        doubleIn: false,
      },
      ["Alice"],
    );
    store().addDart(s20); // 21-20=1 → bust (can't finish from 1 with a master)
    expect(store().isBust).toBe(true);
    expect(store().players[0].score).toBe(21);
  });

  it("restores score on bust", () => {
    store().startGame(
      {
        startingScore: 501,
        splitBull: false,
        doubleOut: false,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
    store().addDart(s20); // 481
    store().addDart(t20); // 421 — score at start of turn = 501
    store().addDart(CreateSegment(SegmentID.INNER_1)); // pretend remaining = 421-1=420
    store().nextTurn();

    // Throw to try to bust: bring to 2
    store().startGame(
      {
        startingScore: 301,
        splitBull: false,
        doubleOut: false,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
    // reach score=20 exactly (via s20×14 turns + 1)
    for (let i = 0; i < 4; i++) {
      store().addDart(s20);
      store().addDart(s20);
      store().addDart(s20);
      store().nextTurn();
    }
    store().addDart(s20);
    store().addDart(s20);
    store().addDart(s20);
    store().nextTurn(); // score=61
    store().addDart(t20);
    store().nextTurn(); // 61-60=1, but t20=60, 61-60=1... that would be score=1 which bust? No that's next turn
    // Let me just test simply: score=501, throw dart that goes below 0
    store().startGame(
      {
        startingScore: 501,
        splitBull: false,
        doubleOut: false,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
    // Reach score = 10
    for (let i = 0; i < 16; i++) {
      store().addDart(s20);
      store().addDart(s20);
      store().addDart(s20);
      store().nextTurn(); // 60 per turn
      if (i === 7) {
        /* after 8 turns: 480 subtracted, score=21 */ break;
      }
    }
    // This is getting complicated. Let's just test the core: a bust restores the turn-start score.
    store().startGame(
      {
        startingScore: 20 as 301,
        splitBull: false,
        doubleOut: false,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
    store().addDart(t20); // 20-60 = -40 → bust immediately
    expect(store().isBust).toBe(true);
    expect(store().players[0].score).toBe(20);
  });

  it("subsequent darts ignored after bust", () => {
    store().startGame(
      {
        startingScore: 20 as 301,
        splitBull: false,
        doubleOut: false,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
    store().addDart(t20); // bust
    store().addDart(s1); // should be ignored
    expect(store().currentRoundDarts).toHaveLength(1); // only the bust dart recorded? No wait...
    // After bust, isBust=true so addDart returns early
    expect(store().isBust).toBe(true);
    expect(store().currentRoundDarts).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Double-out
// ---------------------------------------------------------------------------
describe("doubleOut", () => {
  function startDoubleOut(startingScore: number = 501) {
    store().startGame(
      {
        startingScore: startingScore as 301,
        splitBull: false,
        doubleOut: true,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
  }

  it("wins with a double when score reaches 0", () => {
    startDoubleOut(40);
    store().addDart(d20); // 40-40=0, double → win
    expect(store().winner).toBe("Alice");
    expect(store().isBust).toBe(false);
  });

  it("wins with double bull when score reaches 0", () => {
    startDoubleOut(50);
    store().addDart(dblBull); // 50-50=0, bull counts as double → win
    expect(store().winner).toBe("Alice");
  });

  it("busts when reaching 0 with a single", () => {
    startDoubleOut(20);
    store().addDart(s20); // 20-20=0 but not double → bust
    expect(store().isBust).toBe(true);
    expect(store().players[0].score).toBe(20);
  });

  it("busts when reaching 0 with a triple", () => {
    startDoubleOut(60);
    store().addDart(t20); // 60-60=0 but not double → bust
    expect(store().isBust).toBe(true);
  });

  it("allows normal scoring when not finishing", () => {
    startDoubleOut(501);
    store().addDart(s20); // 481 — not finishing, no bust
    expect(store().isBust).toBe(false);
    expect(store().players[0].score).toBe(481);
  });
});

// ---------------------------------------------------------------------------
// Master-out
// ---------------------------------------------------------------------------
describe("masterOut", () => {
  function startMasterOut(startingScore: number = 501) {
    store().startGame(
      {
        startingScore: startingScore as 301,
        splitBull: false,
        doubleOut: false,
        masterOut: true,
        doubleIn: false,
      },
      ["Alice"],
    );
  }

  it("wins with a double", () => {
    startMasterOut(40);
    store().addDart(d20);
    expect(store().winner).toBe("Alice");
  });

  it("wins with a triple", () => {
    startMasterOut(60);
    store().addDart(t20);
    expect(store().winner).toBe("Alice");
  });

  it("wins with bull (double bull = double)", () => {
    startMasterOut(50);
    store().addDart(dblBull);
    expect(store().winner).toBe("Alice");
  });

  it("busts when reaching 0 with a single", () => {
    startMasterOut(20);
    store().addDart(s20);
    expect(store().isBust).toBe(true);
    expect(store().players[0].score).toBe(20);
  });

  it("allows normal scoring when not finishing", () => {
    startMasterOut(501);
    store().addDart(s20);
    expect(store().isBust).toBe(false);
    expect(store().players[0].score).toBe(481);
  });
});

// ---------------------------------------------------------------------------
// Double-in
// ---------------------------------------------------------------------------
describe("doubleIn", () => {
  beforeEach(() => {
    store().startGame(
      {
        startingScore: 501,
        splitBull: false,
        doubleOut: false,
        masterOut: false,
        doubleIn: true,
      },
      ["Alice"],
    );
  });

  it("player starts unopened", () => {
    expect(store().players[0].opened).toBe(false);
  });

  it("single before opening is not scored", () => {
    store().addDart(s20);
    expect(store().currentRoundDarts[0].scored).toBe(false);
    expect(store().players[0].score).toBe(501); // unchanged
    expect(store().players[0].opened).toBe(false);
  });

  it("still counts totalDartsThrown for pre-open dart", () => {
    store().addDart(s20);
    expect(store().players[0].totalDartsThrown).toBe(1);
  });

  it("opening with a double starts scoring", () => {
    store().addDart(s20); // miss — no score
    store().addDart(d20); // opens player, scores 40
    expect(store().players[0].opened).toBe(true);
    expect(store().players[0].score).toBe(461);
    expect(store().currentRoundDarts[1].scored).toBe(true);
  });

  it("opening with bull (splitBull=false, outer=50) opens player", () => {
    // splitBull=false: outer bull = 50 = double bull = counts as double
    store().addDart(bull); // counts as double, should open
    expect(store().players[0].opened).toBe(true);
    expect(store().players[0].score).toBe(451); // 501-50
  });

  it("subsequent darts after opening score normally", () => {
    store().addDart(d20); // open + score 40
    store().addDart(s20); // 421
    expect(store().players[0].score).toBe(441);
  });

  it("opened state persists after nextTurn", () => {
    store().addDart(d20); // open
    store().nextTurn(); // advance to p1 then back
    store().nextTurn(); // only 1 player so nextTurn stays on player 0
    // With 1 player, turnOpened should persist as true
    expect(store().players[0].opened).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Split bull
// ---------------------------------------------------------------------------
describe("splitBull", () => {
  it("outer bull counts as 50 when splitBull=false", () => {
    store().startGame(
      {
        startingScore: 501,
        splitBull: false,
        doubleOut: false,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
    store().addDart(bull); // outer bull → effective 50
    expect(store().players[0].score).toBe(451);
  });

  it("outer bull counts as 25 when splitBull=true", () => {
    store().startGame(
      {
        startingScore: 501,
        splitBull: true,
        doubleOut: false,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
    store().addDart(bull); // stays as 25
    expect(store().players[0].score).toBe(476);
  });

  it("inner bull always counts as 50", () => {
    store().startGame(
      {
        startingScore: 501,
        splitBull: true,
        doubleOut: false,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
    store().addDart(dblBull);
    expect(store().players[0].score).toBe(451);
  });

  it("outer bull counts as double for doubleOut when splitBull=false", () => {
    store().startGame(
      {
        startingScore: 501,
        splitBull: false,
        doubleOut: true,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
    store().startGame(
      {
        startingScore: 50 as 301,
        splitBull: false,
        doubleOut: true,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
    store().addDart(bull); // → 50 (double bull), score=0, valid double finish
    expect(store().winner).toBe("Alice");
  });

  it("outer bull counts as double for doubleOut even when splitBull=true (section=BULL satisfies finish)", () => {
    // isDoubleOrBull checks section===BULL (not type), so outer bull always qualifies as a finish dart
    store().startGame(
      {
        startingScore: 25 as 301,
        splitBull: true,
        doubleOut: true,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
    store().addDart(bull); // outer bull = 25 pts (splitBull=true), section=BULL → valid double-out finish
    expect(store().winner).toBe("Alice");
    expect(store().isBust).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Undo
// ---------------------------------------------------------------------------
describe("undoLastDart", () => {
  beforeEach(() => {
    store().startGame(
      {
        startingScore: 501,
        splitBull: false,
        doubleOut: false,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
  });

  it("reverses last dart's score", () => {
    store().addDart(s20); // 481
    store().addDart(t20); // 421
    store().undoLastDart(); // back to 481
    expect(store().players[0].score).toBe(481);
    expect(store().currentRoundDarts).toHaveLength(1);
  });

  it("decrements totalDartsThrown", () => {
    store().addDart(s20);
    store().undoLastDart();
    expect(store().players[0].totalDartsThrown).toBe(0);
  });

  it("clears bust state on undo", () => {
    store().startGame(
      {
        startingScore: 20 as 301,
        splitBull: false,
        doubleOut: false,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
    store().addDart(t20); // bust
    store().undoLastDart();
    expect(store().isBust).toBe(false);
    expect(store().players[0].score).toBe(20);
  });

  it("clears winner on undo", () => {
    store().startGame(
      {
        startingScore: 20 as 301,
        splitBull: false,
        doubleOut: false,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
    store().addDart(s20); // win
    expect(store().winner).toBe("Alice");
    store().undoLastDart();
    expect(store().winner).toBeNull();
  });

  it("no-ops when no darts thrown and no completed rounds", () => {
    store().undoLastDart();
    expect(store().players[0].score).toBe(501);
  });

  it("cross-turn: reverts to previous player when current turn has no darts", () => {
    store().startGame(
      { startingScore: 501, splitBull: false, doubleOut: false, masterOut: false, doubleIn: false },
      ["Alice", "Bob"],
    );
    store().addDart(s20); // Alice: 481
    store().addDart(t20); // Alice: 421
    store().nextTurn();   // Bob's turn
    // Bob hasn't thrown yet — undo should revert to Alice's turn
    store().undoLastDart();
    expect(store().currentPlayerIndex).toBe(0); // back to Alice
    expect(store().currentRoundDarts).toHaveLength(0);
    expect(store().players[0].score).toBe(501); // Alice's score restored
    expect(store().players[0].rounds).toHaveLength(0); // round removed
    expect(store().players[0].totalDartsThrown).toBe(0);
  });

  it("cross-turn: restores score correctly when previous round was a bust", () => {
    store().startGame(
      { startingScore: 20 as 301, splitBull: false, doubleOut: false, masterOut: false, doubleIn: false },
      ["Alice", "Bob"],
    );
    store().addDart(t20); // Alice: bust (20 restored)
    store().nextTurn();   // Bob's turn
    store().undoLastDart(); // back to Alice
    expect(store().currentPlayerIndex).toBe(0);
    expect(store().players[0].score).toBe(20); // bust round: score = 0, restores to 20
    expect(store().players[0].rounds).toHaveLength(0);
  });

  it("restores double-in opened state on undo back past opening dart", () => {
    store().startGame(
      {
        startingScore: 501,
        splitBull: false,
        doubleOut: false,
        masterOut: false,
        doubleIn: true,
      },
      ["Alice"],
    );
    store().addDart(d20); // opens + 40
    store().undoLastDart();
    // turnStartOpened was false, no remaining scored darts → opened should be false
    expect(store().players[0].opened).toBe(false);
    expect(store().players[0].score).toBe(501);
  });
});

// ---------------------------------------------------------------------------
// Next turn / player cycling
// ---------------------------------------------------------------------------
describe("nextTurn", () => {
  it("cycles through two players", () => {
    store().startGame(
      {
        startingScore: 501,
        splitBull: false,
        doubleOut: false,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice", "Bob"],
    );
    expect(store().currentPlayerIndex).toBe(0);
    store().nextTurn();
    expect(store().currentPlayerIndex).toBe(1);
    store().nextTurn();
    expect(store().currentPlayerIndex).toBe(0);
  });

  it("records round history on nextTurn", () => {
    store().startGame(
      {
        startingScore: 501,
        splitBull: false,
        doubleOut: false,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice"],
    );
    store().addDart(s20);
    store().addDart(s20);
    store().addDart(s20);
    store().nextTurn();
    expect(store().players[0].rounds).toHaveLength(1);
    expect(store().players[0].rounds[0].score).toBe(60);
  });

  it("resets bust flag and currentRoundDarts", () => {
    store().startGame(
      {
        startingScore: 20 as 301,
        splitBull: false,
        doubleOut: false,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice", "Bob"],
    );
    store().addDart(t20); // bust alice
    store().nextTurn();
    expect(store().isBust).toBe(false);
    expect(store().currentRoundDarts).toHaveLength(0);
  });

  it("does not advance turn if game is won", () => {
    store().startGame(
      {
        startingScore: 20 as 301,
        splitBull: false,
        doubleOut: false,
        masterOut: false,
        doubleIn: false,
      },
      ["Alice", "Bob"],
    );
    store().addDart(s20); // alice wins
    store().nextTurn(); // should be blocked
    expect(store().currentPlayerIndex).toBe(0);
  });
});
