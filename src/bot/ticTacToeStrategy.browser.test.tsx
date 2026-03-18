import { render } from "vitest-browser-react";
import { page } from "vitest/browser";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "../index.css";

// Mock simulateThrow for perfect accuracy — bot always hits exactly what it aims at
vi.mock("../bot/throwSimulator.ts", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../bot/throwSimulator.ts")>();
  return {
    ...mod,
    simulateThrow: (target: number) => target,
  };
});

// Mock sound + LED side-effect modules to avoid audio/BLE in tests
vi.mock("../sound/soundEffects.ts", () => ({
  default: {},
  setTurnTransitioning: () => {},
}));
vi.mock("../board/ledEffects.ts", () => ({
  default: {},
  startRemoveDartsCountdown: () => {},
}));
vi.mock("../sound/sounds.ts", () => ({
  Sounds: {
    intro: () => {},
    hit: () => {},
    bull: () => {},
    dbull: () => {},
    buzzer: () => {},
    triple: () => {},
    double: () => {},
    single: () => {},
  },
  getVolume: () => 1,
  setVolume: () => {},
  connectMediaElement: () => {},
}));

import { TicTacToeScreen } from "../screens/TicTacToeScreen.tsx";
import { useTicTacToeStore } from "../store/useTicTacToeStore.ts";
import type {
  TicTacToeState,
  TicTacToePlayer,
} from "../engine/ticTacToeEngine.ts";

// ── Helpers ───────────────────────────────────────────────────────────────────

const GRID = [7, 14, 3, 8, 25, 12, 19, 6, 11];

interface CellSetup {
  owner?: 0 | 1 | null;
  p0Marks?: number;
  p1Marks?: number;
}

function makePlayers(
  cells: CellSetup[],
): [TicTacToePlayer, TicTacToePlayer] {
  const p0: TicTacToePlayer = {
    name: "Human",
    marks: cells.map((c) => c.p0Marks ?? 0),
    claimed: cells
      .map((c, i) => (c.owner === 0 ? i : -1))
      .filter((i) => i >= 0),
    rounds: [],
  };
  const p1: TicTacToePlayer = {
    name: "Bot",
    marks: cells.map((c) => c.p1Marks ?? 0),
    claimed: cells
      .map((c, i) => (c.owner === 1 ? i : -1))
      .filter((i) => i >= 0),
    rounds: [],
  };
  return [p0, p1];
}

function buildRestoredState(
  cells: CellSetup[],
  currentPlayerIndex: number,
): TicTacToeState & { undoStack: TicTacToeState[] } {
  const [p0, p1] = makePlayers(cells);
  return {
    options: { roundLimit: 20, singleBull: false },
    players: [p0, p1],
    grid: GRID,
    owner: cells.map((c) => c.owner ?? null),
    currentPlayerIndex,
    currentRound: 1,
    currentRoundDarts: [],
    winner: null,
    isCatsGame: false,
    undoStack: [],
  };
}

function renderTTT(restoredState: TicTacToeState & { undoStack: TicTacToeState[] }) {
  return render(
    <TicTacToeScreen
      options={{ roundLimit: 20, singleBull: false }}
      playerNames={["Human", "Bot"]}
      playerIds={[null, null]}
      botSkills={[null, 11]} // Player 1 is a Pro bot
      restoredState={restoredState}
      onExit={() => {}}
      onRematch={() => {}}
    />,
  );
}

/** Wait for a cell to show the claimed symbol (X or O). */
async function expectCellClaimed(cellIndex: number, symbol: "X" | "O") {
  const cell = page.getByTestId(`cell-${cellIndex}`);
  // The claimed symbol appears as a span with the text X or O inside the cell
  await expect.element(cell.getByText(symbol)).toBeVisible();
}

/** Wait for a cell to still show its number (not claimed). */
async function expectCellUnclaimed(cellIndex: number) {
  const cell = page.getByTestId(`cell-${cellIndex}`);
  const label = GRID[cellIndex] === 25 ? "BULL" : String(GRID[cellIndex]);
  await expect.element(cell.getByText(label)).toBeVisible();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Reset the store between tests
  useTicTacToeStore.getState().resetGame();
});

describe("TicTacToe bot strategy (browser)", () => {
  it("empty board → bot picks center (BULL)", async () => {
    // All cells empty, bot is player 1, it's bot's turn
    const state = buildRestoredState(
      Array(9).fill({}),
      1, // bot's turn
    );
    renderTTT(state);

    // Bot should claim center (cell 4 = BULL) — needs 4 marks, bot throws triples (3 marks each)
    // After 2 darts on BULL (double bull = 2 marks each → 4 total), cell is claimed
    // Actually with singleBull=false, DBL_BULL gives 2 marks per hit. Bot aims at T25 → DBL_BULL.
    // 2 hits × 2 marks = 4 → claimed on 2nd dart
    await expectCellClaimed(4, "O");
  });

  it("win available → bot takes the win", async () => {
    // Bot (player 1) owns cells 0 and 1 (top row). Cell 2 is open.
    // Bot should aim at cell 2 to complete the row.
    // Give bot 3 marks on cell 2 so one more dart claims it.
    const state = buildRestoredState(
      [
        { owner: 1, p1Marks: 4 }, // cell 0: Bot owns
        { owner: 1, p1Marks: 4 }, // cell 1: Bot owns
        { p1Marks: 3 },           // cell 2: 3 marks, needs 1 more
        { owner: 0, p0Marks: 4 }, // cell 3: Human owns
        { owner: 0, p0Marks: 4 }, // cell 4: Human owns
        {},
        {},
        {},
        {},
      ],
      1, // bot's turn
    );
    renderTTT(state);

    // Bot should target cell 2 (num=3) to win
    await expectCellClaimed(2, "O");
  });

  it("block opponent win → bot blocks", async () => {
    // Human (player 0) owns cells 0 and 1 (top row). Cell 2 is open.
    // Bot must block by targeting cell 2.
    // Give bot 3 marks on cell 2 so one dart claims it.
    const state = buildRestoredState(
      [
        { owner: 0, p0Marks: 4 }, // cell 0: Human owns
        { owner: 0, p0Marks: 4 }, // cell 1: Human owns
        { p1Marks: 3 },           // cell 2: blocking cell, 3 marks
        {},
        { owner: 1, p1Marks: 4 }, // cell 4: Bot owns center
        {},
        {},
        {},
        {},
      ],
      1, // bot's turn
    );
    renderTTT(state);

    // Bot should target cell 2 (num=3) to block
    await expectCellClaimed(2, "O");
  });

  it("diagonal win detection", async () => {
    // Bot owns cells 0 and 4 (main diagonal). Cell 8 open.
    // Bot should target cell 8 to win the diagonal.
    const state = buildRestoredState(
      [
        { owner: 1, p1Marks: 4 }, // cell 0: Bot
        { owner: 0, p0Marks: 4 }, // cell 1: Human
        {},
        {},
        { owner: 1, p1Marks: 4 }, // cell 4: Bot
        {},
        {},
        { owner: 0, p0Marks: 4 }, // cell 7: Human
        { p1Marks: 3 },           // cell 8: 3 marks, one more claims
      ],
      1, // bot's turn
    );
    renderTTT(state);

    // Bot completes diagonal [0,4,8]
    await expectCellClaimed(8, "O");
  });

  it("renders correct grid numbers on unclaimed cells", async () => {
    // All cells empty, human's turn — verify all numbers render
    const state = buildRestoredState(Array(9).fill({}), 0);
    renderTTT(state);

    for (let i = 0; i < 9; i++) {
      await expectCellUnclaimed(i);
    }
  });

  it("renders X and O for claimed cells", async () => {
    // Some cells pre-claimed
    const state = buildRestoredState(
      [
        { owner: 0, p0Marks: 4 }, // X
        { owner: 1, p1Marks: 4 }, // O
        {},
        {},
        {},
        {},
        {},
        {},
        {},
      ],
      0, // human's turn (no bot action)
    );
    renderTTT(state);

    await expectCellClaimed(0, "X");
    await expectCellClaimed(1, "O");
    await expectCellUnclaimed(2);
  });
});
