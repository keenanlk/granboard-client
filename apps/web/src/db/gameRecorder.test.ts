import { describe, it, expect, beforeEach, vi } from "vitest";
import { GameRecorder } from "./gameRecorder.ts";
vi.mock("./db.ts", () => ({
  dbSaveSession: vi.fn(() => Promise.resolve()),
}));

vi.mock("../lib/logger.ts", () => ({
  logger: {
    child: () => ({
      error: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

async function getDbMock() {
  return await import("./db.ts");
}

describe("GameRecorder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("recordRound increments round counter per player and stores round data", () => {
    const recorder = new GameRecorder("x01", ["Alice", "Bob"], ["p1", "p2"], {
      startScore: 501,
    });

    recorder.recordRound(0, [{ value: 20, shortName: "20" }], 60);

    recorder.recordRound(1, [{ value: 19, shortName: "19" }], 57);

    recorder.recordRound(0, [{ value: 18, shortName: "T18" }], 54);

    // Verify via save that rounds were recorded
    // (rounds are private, so we verify through save output)
  });

  it("save creates proper GameSessionRecord structure", async () => {
    const dbMod = await getDbMock();
    const mockSave = vi.mocked(dbMod.dbSaveSession);

    const recorder = new GameRecorder(
      "cricket",
      ["Alice", "Bob"],
      ["p1", "p2"],
      { pointsEnabled: true },
    );

    recorder.recordRound(
      0,
      [{ value: 20, shortName: "T20", marksEarned: 3 }],
      0,
    );

    await recorder.save(["Alice"], [100, 50]);

    expect(mockSave).toHaveBeenCalledTimes(1);
    const session = mockSave.mock.calls[0][0];
    expect(session.gameType).toBe("cricket");
    expect(session.participants).toHaveLength(2);
    expect(session.rounds).toHaveLength(1);
    expect(session.id).toBeDefined();
    expect(session.playedAt).toBeGreaterThan(0);
    expect(session.options).toEqual({ pointsEnabled: true });
  });

  it("save sets correct isWinner flag on participants", async () => {
    const dbMod = await getDbMock();
    const mockSave = vi.mocked(dbMod.dbSaveSession);

    const recorder = new GameRecorder(
      "x01",
      ["Alice", "Bob"],
      ["p1", "p2"],
      {},
    );

    await recorder.save(["Alice"], [0, 200]);

    const session = mockSave.mock.calls[0][0];
    expect(session.participants[0].isWinner).toBe(true);
    expect(session.participants[0].name).toBe("Alice");
    expect(session.participants[0].finalScore).toBe(0);
    expect(session.participants[1].isWinner).toBe(false);
    expect(session.participants[1].name).toBe("Bob");
    expect(session.participants[1].finalScore).toBe(200);
  });

  it("save skips DB write when no named players (all playerIds are null)", async () => {
    const dbMod = await getDbMock();
    const mockSave = vi.mocked(dbMod.dbSaveSession);

    const recorder = new GameRecorder(
      "x01",
      ["Guest1", "Guest2"],
      [null, null],
      {},
    );

    await recorder.save(["Guest1"], [0, 300]);

    expect(mockSave).not.toHaveBeenCalled();
  });

  it("save calls dbSaveSession with correct session structure", async () => {
    const dbMod = await getDbMock();
    const mockSave = vi.mocked(dbMod.dbSaveSession);

    const recorder = new GameRecorder("highscore", ["Alice"], ["p1"], {
      rounds: 8,
    });

    recorder.recordRound(0, [{ value: 20, shortName: "T20" }], 60);

    await recorder.save(["Alice"], [300]);

    expect(mockSave).toHaveBeenCalledTimes(1);
    const session = mockSave.mock.calls[0][0];
    expect(session).toMatchObject({
      gameType: "highscore",
      options: { rounds: 8 },
      participants: [
        { playerId: "p1", name: "Alice", finalScore: 300, isWinner: true },
      ],
    });
    expect(session.rounds[0]).toMatchObject({
      playerIndex: 0,
      playerName: "Alice",
      playerId: "p1",
      round: 1,
      roundScore: 60,
    });
  });

  it("save handles DB error gracefully (logs but does not throw)", async () => {
    const dbMod = await getDbMock();
    const mockSave = vi.mocked(dbMod.dbSaveSession);
    mockSave.mockRejectedValueOnce(new Error("IndexedDB write failed"));

    const recorder = new GameRecorder("x01", ["Alice"], ["p1"], {});

    // Should not throw
    await expect(recorder.save(["Alice"], [0])).resolves.toBeUndefined();
  });

  it("multiple recordRound calls build up rounds array", async () => {
    const dbMod = await getDbMock();
    const mockSave = vi.mocked(dbMod.dbSaveSession);

    const recorder = new GameRecorder("x01", ["Alice"], ["p1"], {});

    recorder.recordRound(0, [{ value: 20, shortName: "20" }], 20);
    recorder.recordRound(0, [{ value: 19, shortName: "19" }], 19);
    recorder.recordRound(0, [{ value: 18, shortName: "18" }], 18);

    await recorder.save(["Alice"], [0]);

    const session = mockSave.mock.calls[0][0];
    expect(session.rounds).toHaveLength(3);
    expect(session.rounds[0].roundScore).toBe(20);
    expect(session.rounds[1].roundScore).toBe(19);
    expect(session.rounds[2].roundScore).toBe(18);
  });

  it("maintains separate round counters per player", async () => {
    const dbMod = await getDbMock();
    const mockSave = vi.mocked(dbMod.dbSaveSession);

    const recorder = new GameRecorder(
      "x01",
      ["Alice", "Bob"],
      ["p1", "p2"],
      {},
    );

    recorder.recordRound(0, [{ value: 20, shortName: "20" }], 60);
    recorder.recordRound(1, [{ value: 19, shortName: "19" }], 57);
    recorder.recordRound(0, [{ value: 18, shortName: "18" }], 54);
    recorder.recordRound(1, [{ value: 17, shortName: "17" }], 51);

    await recorder.save(["Alice"], [0, 200]);

    const session = mockSave.mock.calls[0][0];
    // Alice's rounds: 1, 2
    const aliceRounds = session.rounds.filter(
      (r: { playerId: string | null }) => r.playerId === "p1",
    );
    expect(aliceRounds[0].round).toBe(1);
    expect(aliceRounds[1].round).toBe(2);

    // Bob's rounds: 1, 2
    const bobRounds = session.rounds.filter(
      (r: { playerId: string | null }) => r.playerId === "p2",
    );
    expect(bobRounds[0].round).toBe(1);
    expect(bobRounds[1].round).toBe(2);
  });
});
