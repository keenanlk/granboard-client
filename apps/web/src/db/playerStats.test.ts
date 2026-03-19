import { describe, it, expect } from "vitest";
import { computePlayerStats } from "./playerStats.ts";
import type { GameSessionRecord, RoundRecord } from "@nlc-darts/engine";

const PLAYER_ID = "player-1";
const OTHER_ID = "player-2";

function makeRound(
  overrides: Partial<RoundRecord> & { roundScore: number },
): RoundRecord {
  return {
    playerIndex: 0,
    playerName: "Alice",
    playerId: PLAYER_ID,
    round: 1,
    darts: [],
    ...overrides,
  };
}

function makeSession(
  overrides: Partial<GameSessionRecord> & {
    gameType: GameSessionRecord["gameType"];
  },
): GameSessionRecord {
  return {
    id: "s1",
    playedAt: Date.now(),
    options: {},
    participants: [],
    rounds: [],
    ...overrides,
  };
}

describe("computePlayerStats", () => {
  it("returns all zeros for empty sessions", () => {
    const stats = computePlayerStats([], PLAYER_ID);
    expect(stats.totalGames).toBe(0);
    expect(stats.totalWins).toBe(0);
    expect(stats.x01.gamesPlayed).toBe(0);
    expect(stats.x01.ppd).toBe(0);
    expect(stats.x01.avgRound).toBe(0);
    expect(stats.x01.bestRound).toBe(0);
    expect(stats.cricket.gamesPlayed).toBe(0);
    expect(stats.cricket.mpr).toBe(0);
    expect(stats.highscore.gamesPlayed).toBe(0);
    expect(stats.highscore.avgScore).toBe(0);
  });

  it("computes X01 stats from a single session", () => {
    const session = makeSession({
      gameType: "x01",
      participants: [
        { playerId: PLAYER_ID, name: "Alice", finalScore: 0, isWinner: true },
      ],
      rounds: [
        makeRound({
          round: 1,
          roundScore: 60,
          darts: [
            { value: 20, shortName: "20" },
            { value: 20, shortName: "20" },
            { value: 20, shortName: "20" },
          ],
        }),
        makeRound({
          round: 2,
          roundScore: 100,
          darts: [
            { value: 20, shortName: "T20" },
            { value: 20, shortName: "20" },
            { value: 20, shortName: "20" },
          ],
        }),
      ],
    });

    const stats = computePlayerStats([session], PLAYER_ID);
    expect(stats.x01.gamesPlayed).toBe(1);
    expect(stats.x01.wins).toBe(1);
    // ppd = totalPoints / totalDarts = 160 / 6
    expect(stats.x01.ppd).toBeCloseTo(160 / 6);
    // avgRound = totalPoints / numRounds = 160 / 2
    expect(stats.x01.avgRound).toBe(80);
    expect(stats.x01.bestRound).toBe(100);
  });

  it("computes Cricket stats from a single session", () => {
    const session = makeSession({
      gameType: "cricket",
      participants: [
        {
          playerId: PLAYER_ID,
          name: "Alice",
          finalScore: 50,
          isWinner: false,
        },
      ],
      rounds: [
        makeRound({
          round: 1,
          roundScore: 20,
          darts: [
            { value: 20, shortName: "20", marksEarned: 1 },
            { value: 20, shortName: "D20", marksEarned: 2 },
            { value: 19, shortName: "19", marksEarned: 1 },
          ],
        }),
        makeRound({
          round: 2,
          roundScore: 30,
          darts: [
            { value: 18, shortName: "T18", marksEarned: 3 },
            { value: 17, shortName: "17", marksEarned: 1 },
            { value: 16, shortName: "16", marksEarned: 0 },
          ],
        }),
      ],
    });

    const stats = computePlayerStats([session], PLAYER_ID);
    expect(stats.cricket.gamesPlayed).toBe(1);
    expect(stats.cricket.wins).toBe(0);
    // mpr = totalMarks / numRounds = (1+2+1+3+1+0) / 2 = 8/2 = 4
    expect(stats.cricket.mpr).toBe(4);
    // avgRoundScore = totalPoints / numRounds = 50 / 2 = 25
    expect(stats.cricket.avgRoundScore).toBe(25);
  });

  it("computes HighScore stats from a single session", () => {
    const session = makeSession({
      gameType: "highscore",
      participants: [
        {
          playerId: PLAYER_ID,
          name: "Alice",
          finalScore: 300,
          isWinner: true,
        },
      ],
      rounds: [
        makeRound({ round: 1, roundScore: 120, darts: [] }),
        makeRound({ round: 2, roundScore: 180, darts: [] }),
      ],
    });

    const stats = computePlayerStats([session], PLAYER_ID);
    expect(stats.highscore.gamesPlayed).toBe(1);
    expect(stats.highscore.wins).toBe(1);
    expect(stats.highscore.avgScore).toBe(300);
    expect(stats.highscore.bestScore).toBe(300);
    expect(stats.highscore.avgRound).toBe(150);
    expect(stats.highscore.bestRound).toBe(180);
  });

  it("increments wins when isWinner is true", () => {
    const session = makeSession({
      gameType: "x01",
      participants: [
        { playerId: PLAYER_ID, name: "Alice", finalScore: 0, isWinner: true },
      ],
      rounds: [],
    });

    const stats = computePlayerStats([session], PLAYER_ID);
    expect(stats.x01.wins).toBe(1);
    expect(stats.totalWins).toBe(1);
  });

  it("does not increment wins when isWinner is false", () => {
    const session = makeSession({
      gameType: "x01",
      participants: [
        {
          playerId: PLAYER_ID,
          name: "Alice",
          finalScore: 200,
          isWinner: false,
        },
      ],
      rounds: [],
    });

    const stats = computePlayerStats([session], PLAYER_ID);
    expect(stats.x01.wins).toBe(0);
    expect(stats.totalWins).toBe(0);
  });

  it("aggregates multiple sessions of the same type", () => {
    const session1 = makeSession({
      id: "s1",
      gameType: "x01",
      participants: [
        { playerId: PLAYER_ID, name: "Alice", finalScore: 0, isWinner: true },
      ],
      rounds: [
        makeRound({
          round: 1,
          roundScore: 60,
          darts: [
            { value: 20, shortName: "20" },
            { value: 20, shortName: "20" },
            { value: 20, shortName: "20" },
          ],
        }),
      ],
    });
    const session2 = makeSession({
      id: "s2",
      gameType: "x01",
      participants: [
        {
          playerId: PLAYER_ID,
          name: "Alice",
          finalScore: 100,
          isWinner: false,
        },
      ],
      rounds: [
        makeRound({
          round: 1,
          roundScore: 90,
          darts: [
            { value: 20, shortName: "T20" },
            { value: 20, shortName: "20" },
            { value: 10, shortName: "10" },
          ],
        }),
      ],
    });

    const stats = computePlayerStats([session1, session2], PLAYER_ID);
    expect(stats.x01.gamesPlayed).toBe(2);
    expect(stats.x01.wins).toBe(1);
    // ppd = (60 + 90) / 6 = 25
    expect(stats.x01.ppd).toBe(25);
    // avgRound = (60 + 90) / 2 = 75
    expect(stats.x01.avgRound).toBe(75);
    expect(stats.x01.bestRound).toBe(90);
  });

  it("separates stats by game type for mixed sessions", () => {
    const x01Session = makeSession({
      id: "s1",
      gameType: "x01",
      participants: [
        { playerId: PLAYER_ID, name: "Alice", finalScore: 0, isWinner: true },
      ],
      rounds: [],
    });
    const cricketSession = makeSession({
      id: "s2",
      gameType: "cricket",
      participants: [
        {
          playerId: PLAYER_ID,
          name: "Alice",
          finalScore: 40,
          isWinner: false,
        },
      ],
      rounds: [],
    });
    const highscoreSession = makeSession({
      id: "s3",
      gameType: "highscore",
      participants: [
        {
          playerId: PLAYER_ID,
          name: "Alice",
          finalScore: 200,
          isWinner: true,
        },
      ],
      rounds: [],
    });

    const stats = computePlayerStats(
      [x01Session, cricketSession, highscoreSession],
      PLAYER_ID,
    );
    expect(stats.x01.gamesPlayed).toBe(1);
    expect(stats.cricket.gamesPlayed).toBe(1);
    expect(stats.highscore.gamesPlayed).toBe(1);
    expect(stats.totalGames).toBe(3);
    expect(stats.totalWins).toBe(2);
  });

  it("filters out sessions that do not include the player", () => {
    const session = makeSession({
      gameType: "x01",
      participants: [
        { playerId: OTHER_ID, name: "Bob", finalScore: 0, isWinner: true },
      ],
      rounds: [
        makeRound({
          playerId: OTHER_ID,
          playerName: "Bob",
          round: 1,
          roundScore: 60,
          darts: [
            { value: 20, shortName: "20" },
            { value: 20, shortName: "20" },
            { value: 20, shortName: "20" },
          ],
        }),
      ],
    });

    const stats = computePlayerStats([session], PLAYER_ID);
    expect(stats.totalGames).toBe(0);
    expect(stats.x01.gamesPlayed).toBe(0);
  });

  it("totalGames equals the sum of all game type counts", () => {
    const sessions = [
      makeSession({
        id: "s1",
        gameType: "x01",
        participants: [
          { playerId: PLAYER_ID, name: "Alice", finalScore: 0, isWinner: true },
        ],
        rounds: [],
      }),
      makeSession({
        id: "s2",
        gameType: "x01",
        participants: [
          {
            playerId: PLAYER_ID,
            name: "Alice",
            finalScore: 100,
            isWinner: false,
          },
        ],
        rounds: [],
      }),
      makeSession({
        id: "s3",
        gameType: "cricket",
        participants: [
          {
            playerId: PLAYER_ID,
            name: "Alice",
            finalScore: 20,
            isWinner: true,
          },
        ],
        rounds: [],
      }),
    ];

    const stats = computePlayerStats(sessions, PLAYER_ID);
    expect(stats.totalGames).toBe(
      stats.x01.gamesPlayed +
        stats.cricket.gamesPlayed +
        stats.highscore.gamesPlayed,
    );
    expect(stats.totalWins).toBe(
      stats.x01.wins + stats.cricket.wins + stats.highscore.wins,
    );
  });

  it("handles x01 with zero darts gracefully (ppd = 0)", () => {
    const session = makeSession({
      gameType: "x01",
      participants: [
        { playerId: PLAYER_ID, name: "Alice", finalScore: 501, isWinner: false },
      ],
      rounds: [],
    });

    const stats = computePlayerStats([session], PLAYER_ID);
    expect(stats.x01.gamesPlayed).toBe(1);
    expect(stats.x01.ppd).toBe(0);
    expect(stats.x01.avgRound).toBe(0);
    expect(stats.x01.bestRound).toBe(0);
  });

  it("only counts rounds belonging to the target player", () => {
    const session = makeSession({
      gameType: "x01",
      participants: [
        { playerId: PLAYER_ID, name: "Alice", finalScore: 0, isWinner: true },
        { playerId: OTHER_ID, name: "Bob", finalScore: 200, isWinner: false },
      ],
      rounds: [
        makeRound({
          playerIndex: 0,
          playerId: PLAYER_ID,
          playerName: "Alice",
          round: 1,
          roundScore: 100,
          darts: [
            { value: 20, shortName: "T20" },
            { value: 20, shortName: "20" },
            { value: 20, shortName: "20" },
          ],
        }),
        makeRound({
          playerIndex: 1,
          playerId: OTHER_ID,
          playerName: "Bob",
          round: 1,
          roundScore: 45,
          darts: [
            { value: 15, shortName: "15" },
            { value: 15, shortName: "15" },
            { value: 15, shortName: "15" },
          ],
        }),
      ],
    });

    const stats = computePlayerStats([session], PLAYER_ID);
    // Only Alice's rounds should count
    expect(stats.x01.ppd).toBeCloseTo(100 / 3);
    expect(stats.x01.avgRound).toBe(100);
    expect(stats.x01.bestRound).toBe(100);
  });

  it("ignores non-counted game types (atw, tictactoe)", () => {
    const atwSession = makeSession({
      id: "atw1",
      gameType: "atw",
      participants: [
        { playerId: PLAYER_ID, name: "Alice", finalScore: 20, isWinner: true },
      ],
      rounds: [],
    });
    const tttSession = makeSession({
      id: "ttt1",
      gameType: "tictactoe",
      participants: [
        { playerId: PLAYER_ID, name: "Alice", finalScore: 1, isWinner: true },
      ],
      rounds: [],
    });

    const stats = computePlayerStats([atwSession, tttSession], PLAYER_ID);
    // atw and tictactoe are not included in totalGames
    expect(stats.totalGames).toBe(0);
    expect(stats.totalWins).toBe(0);
  });

  it("cricket mpr uses marksEarned, defaults missing to 0", () => {
    const session = makeSession({
      gameType: "cricket",
      participants: [
        { playerId: PLAYER_ID, name: "Alice", finalScore: 0, isWinner: false },
      ],
      rounds: [
        makeRound({
          round: 1,
          roundScore: 0,
          darts: [
            { value: 20, shortName: "20", marksEarned: 2 },
            { value: 19, shortName: "19" }, // no marksEarned → 0
            { value: 18, shortName: "18", marksEarned: 3 },
          ],
        }),
      ],
    });

    const stats = computePlayerStats([session], PLAYER_ID);
    // mpr = (2 + 0 + 3) / 1 round = 5
    expect(stats.cricket.mpr).toBe(5);
  });

  it("highscore bestScore picks max across multiple sessions", () => {
    const s1 = makeSession({
      id: "s1",
      gameType: "highscore",
      participants: [
        {
          playerId: PLAYER_ID,
          name: "Alice",
          finalScore: 200,
          isWinner: false,
        },
      ],
      rounds: [makeRound({ round: 1, roundScore: 200, darts: [] })],
    });
    const s2 = makeSession({
      id: "s2",
      gameType: "highscore",
      participants: [
        {
          playerId: PLAYER_ID,
          name: "Alice",
          finalScore: 450,
          isWinner: true,
        },
      ],
      rounds: [makeRound({ round: 1, roundScore: 450, darts: [] })],
    });

    const stats = computePlayerStats([s1, s2], PLAYER_ID);
    expect(stats.highscore.bestScore).toBe(450);
    expect(stats.highscore.avgScore).toBe(325);
    expect(stats.highscore.bestRound).toBe(450);
  });
});
