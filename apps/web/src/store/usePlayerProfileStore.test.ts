import { describe, it, expect, beforeEach, vi } from "vitest";
import { usePlayerProfileStore } from "./usePlayerProfileStore.ts";

const mockPlayers = [
  { id: "1", name: "Zara", createdAt: 1 },
  { id: "2", name: "Alice", createdAt: 2 },
];

vi.mock("../db/db.ts", () => ({
  dbGetAllPlayers: vi.fn(() => Promise.resolve([...mockPlayers])),
  dbAddPlayer: vi.fn((name: string) =>
    Promise.resolve({ id: "new-id", name, createdAt: Date.now() }),
  ),
  dbDeletePlayer: vi.fn(() => Promise.resolve()),
  dbRenamePlayer: vi.fn(() => Promise.resolve()),
}));

const { dbAddPlayer } = await import("../db/db.ts");

beforeEach(() => {
  usePlayerProfileStore.setState({ players: [], loaded: false });
  vi.clearAllMocks();
});

describe("usePlayerProfileStore", () => {
  it("has correct initial state", () => {
    const { players, loaded } = usePlayerProfileStore.getState();
    expect(players).toEqual([]);
    expect(loaded).toBe(false);
  });

  it("load() fetches and sorts players by name", async () => {
    await usePlayerProfileStore.getState().load();
    const { players } = usePlayerProfileStore.getState();
    expect(players[0].name).toBe("Alice");
    expect(players[1].name).toBe("Zara");
  });

  it("load() sets loaded=true and second call is a no-op", async () => {
    await usePlayerProfileStore.getState().load();
    expect(usePlayerProfileStore.getState().loaded).toBe(true);

    const { dbGetAllPlayers } = await import("../db/db.ts");
    vi.mocked(dbGetAllPlayers).mockClear();
    await usePlayerProfileStore.getState().load();
    expect(dbGetAllPlayers).not.toHaveBeenCalled();
  });

  it("createPlayer() adds player sorted by name", async () => {
    usePlayerProfileStore.setState({
      players: [{ id: "1", name: "Zara", createdAt: 1 }],
      loaded: true,
    });
    await usePlayerProfileStore.getState().createPlayer("Bob");
    const names = usePlayerProfileStore.getState().players.map((p) => p.name);
    expect(names).toEqual(["Bob", "Zara"]);
  });

  it("createPlayer() trims whitespace from name", async () => {
    await usePlayerProfileStore.getState().createPlayer("  Bob  ");
    expect(vi.mocked(dbAddPlayer)).toHaveBeenCalledWith("Bob");
  });

  it("removePlayer() filters out player by id", async () => {
    usePlayerProfileStore.setState({
      players: [
        { id: "1", name: "Alice", createdAt: 1 },
        { id: "2", name: "Zara", createdAt: 2 },
      ],
      loaded: true,
    });
    await usePlayerProfileStore.getState().removePlayer("1");
    const ids = usePlayerProfileStore.getState().players.map((p) => p.id);
    expect(ids).toEqual(["2"]);
  });

  it("updateName() updates name and re-sorts", async () => {
    usePlayerProfileStore.setState({
      players: [
        { id: "1", name: "Alice", createdAt: 1 },
        { id: "2", name: "Zara", createdAt: 2 },
      ],
      loaded: true,
    });
    await usePlayerProfileStore.getState().updateName("2", "Aaron");
    const names = usePlayerProfileStore.getState().players.map((p) => p.name);
    expect(names).toEqual(["Aaron", "Alice"]);
  });

  it("updateName() trims whitespace", async () => {
    usePlayerProfileStore.setState({
      players: [{ id: "1", name: "Alice", createdAt: 1 }],
      loaded: true,
    });
    await usePlayerProfileStore.getState().updateName("1", "  Bob  ");
    expect(usePlayerProfileStore.getState().players[0].name).toBe("Bob");
  });
});
