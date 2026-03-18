# Sub-skill: Engine, Tests & Store

Implement the game engine, test suite, and store for the new game mode.

---

## Step 1: Engine

**Read first:** Open `/src/engine/GameEngine.ts` for the interface definition. Then open
`/src/engine/highScoreEngine.ts` (or another existing engine) to understand method signatures,
state shape conventions, and how pure functions are structured. Do not guess at the pattern.

Create `/src/engine/<game>Engine.ts` implementing `GameEngine<TState, TOptions>`.

Required exports:

| Export | Description |
|---|---|
| `<Game>Options` | Configurable settings (player count, round limit, variants) |
| `<Game>State` | Full game snapshot — players, round, dartsThrown, winners |
| `<Game>Player` | Per-player data (score, targets hit, etc.) |
| `ThrownDart` | Per-dart metadata |
| `DEFAULT_<GAME>_OPTIONS` | Sensible defaults for all options |
| `<game>Engine` | Singleton: `export const <game>Engine = new <Game>Engine()` |

Four methods — all pure, no side effects, always return new state:

**`startGame(options, playerNames)`**
- Initialize state from options and player list

**`addDart(state, segment)`**
- No-op (return state unchanged) if: winners already set, 3 darts already thrown this turn,
  or current player is already finished
- Otherwise process the dart and return updated state

**`undoLastDart(state)`**
- Restore the previous state snapshot
- No-op if history is empty

**`nextTurn(state)`**
- Record round stats, rotate to next player, increment round when all players have thrown
- Detect win condition and set winners
- Enforce round limit if configured

---

## Step 2: Engine Tests

**Read first:** Open an existing test file (e.g. `/src/engine/highScoreEngine.test.ts`) for
vitest conventions, `CreateSegment`/`SegmentID` usage, and import paths.

Create `/src/engine/<game>Engine.test.ts` with test coverage for:

- [ ] Correct initialization from defaults
- [ ] Hit detection — valid target registers, invalid target does not
- [ ] Scoring / advancement logic matching the rule document
- [ ] Multiplier handling — single, double, triple
- [ ] 3-dart limit — 4th dart call is a no-op
- [ ] Turn rotation and round progression
- [ ] Win condition — single winner
- [ ] Win condition — tie / equal turns enforced
- [ ] Round limit — game ends correctly, winners determined
- [ ] Undo — restores previous state snapshot
- [ ] Undo — no-op when history is empty
- [ ] Darts thrown after winner is declared are ignored
- [ ] Full game playthrough end-to-end

Run `npm test` after writing tests. **If tests fail, fix the engine or tests before
continuing to the store.** Do not proceed with red tests.

---

## Step 3: Store

**Read first:** Open `/src/store/createGameStore.ts` for the factory API. Then open any
existing store (e.g. `/src/store/useHighScoreStore.ts`) as a size/shape reference — the store
file should be ~20 lines.

Create `/src/store/use<Game>Store.ts`:

```typescript
import { createGameStore } from "./createGameStore.ts";
import { <game>Engine, type <Game>State } from "../engine/<game>Engine.ts";

export type { <Game>Options, <Game>Player, ThrownDart } from "../engine/<game>Engine.ts";
export { DEFAULT_<GAME>_OPTIONS } from "../engine/<game>Engine.ts";

const DEFAULT_STATE: <Game>State = { /* mirror engine startGame initial output */ };

export const use<Game>Store = createGameStore(<game>Engine, DEFAULT_STATE);
```
