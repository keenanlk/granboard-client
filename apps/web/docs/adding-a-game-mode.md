# Adding a New Game Mode

Step-by-step checklist for adding a new game mode to NLC Darts.
Every new game follows the **Engine → Store → Controller → Screen** architecture.

---

## 1. Rule Document

Create `/docs/game-rules/<game-name>.md` — this is the source of truth (per CLAUDE.md).

- Objective, sequence/targets, scoring, advancement, win condition
- Turn structure (darts per turn, what counts as a hit/miss)
- Edge cases: ties, round limits, equal turns
- Example game walkthrough
- Simplified data model

---

## 2. Engine (`/src/engine/<game>Engine.ts`)

Pure game logic. Implements `GameEngine<TState, TOptions>` from `./GameEngine.ts`.

- **Options interface** — configurable settings (e.g. round limit)
- **State interface** — all game data (players, current round, darts, winners)
- **Thrown dart interface** — per-dart metadata (for undo, display, recording)
- **Player interface** — per-player state
- Four methods: `startGame`, `addDart`, `undoLastDart`, `nextTurn`
- Export a singleton instance: `export const <game>Engine = new <Game>Engine()`
- Export default options constant: `export const DEFAULT_<GAME>_OPTIONS`

Key rules:

- `addDart` must guard: if winners set, if 3 darts thrown, if player finished → return state unchanged
- `nextTurn` handles: round records, player rotation, round increment, win detection, round limit
- All methods are pure — no side effects, no store access

---

## 3. Engine Tests (`/src/engine/<game>Engine.test.ts`)

Follow the pattern in existing test files (vitest, `CreateSegment`, `SegmentID`).

Cover at minimum:

- Initialization (correct defaults)
- Hit vs miss detection
- Advancement / scoring logic
- Multiplier handling (single/double/triple)
- 3-dart limit enforced
- Turn rotation and round progression
- Win condition (single winner, tie, equal turns)
- Round limit behavior
- Undo (restores previous state, no-op when empty)
- Full game playthrough
- Ignores darts after winner declared

Run: `npm test`

---

## 4. Store (`/src/store/use<Game>Store.ts`)

~20 lines. Uses `createGameStore` factory.

```
import { createGameStore } from "./createGameStore.ts";
import { <game>Engine, type <Game>State } from "../engine/<game>Engine.ts";

// Re-export types and constants
export type { <Game>Options, ... } from "../engine/<game>Engine.ts";
export { DEFAULT_<GAME>_OPTIONS } from "../engine/<game>Engine.ts";

const DEFAULT_STATE: <Game>State = { ... };

export const use<Game>Store = createGameStore(<game>Engine, DEFAULT_STATE);
```

---

## 5. Bot Strategy (`/src/bot/<game>Strategy.ts`)

Targeting function that returns a `SegmentID` for the bot to aim at.

- Export: `function <game>PickTarget(...gameContext): SegmentID`
- Simple: just pick the best segment to aim for given the current game state

Then add a `throw<Game>` method to `/src/bot/Bot.ts`:

- Import the strategy
- Call `simulateThrow(target, this.sigma)` and return the result
- Accept an optional `onThrow` callback for logging

---

## 6. Controller (`/src/controllers/<Game>Controller.ts`)

Implements `GameController` interface. Bridges store actions → game events.

- `onDartHit(segment)`:
  - Call store `addDart`
  - Guard: if dart wasn't registered (length unchanged), return
  - Emit `dart_hit` (with `effectiveMarks` if relevant for LED hit animation)
  - Emit `open_numbers` with current target(s) for LED highlights (numbers 1-20 only — Bull is not addressable via 20-byte LED command)
  - Check for win → emit `game_won`
- `onNextTurn()`:
  - Call store `nextTurn`
  - Emit `next_turn`
  - Emit `open_numbers` with new target(s)

---

## 7. Screen (`/src/screens/<Game>Screen.tsx`)

React component. Follow `HighScoreScreen.tsx` pattern.

**Props:** `options`, `playerNames`, `playerIds`, `botSkills`, `restoredState?`, `onExit`, `onRematch`

**Required hooks:**

- `use<Game>Store()` — read state
- `useGameSession()` — game lifecycle, turn delay, recording, persistence
- `useBotTurn()` — bot automation (create `bots` map with `useMemo`, `getThrow` with `useCallback`)
- `useAwardDetection()` — if the game supports awards

**Required UI elements:**

- `GameShell` wrapper with game class, transition/countdown, next-turn button, overlays
- `ResultsOverlay` in overlays (with sorted player results + stats)
- `GameMenu` (undo + exit)
- `BotThinkingIndicator` when current player is a bot
- Player strip at bottom (name, key stat, secondary stat per player)
- All text must be readable from 8 feet away (big, bold typography)

**Bot integration checklist:**

- `useMemo` to build `bots: Map<number, Bot>` from `botSkills`
- `useCallback` for `getThrow` that reads live store state and calls `bot.throw<Game>()`
- `useBotTurn({ bots, currentPlayerIndex, dartsThrown, isBust, hasWinner, isTransitioning, onNextTurn, getThrow })`
- `isCurrentBot = bots.has(currentPlayerIndex)` for UI conditionals
- Disable undo when bot is playing

---

## 8. Type Wiring (modify existing files)

Add the new game type string to these union types:

| File                            | Location                             | Change                       |
| ------------------------------- | ------------------------------------ | ---------------------------- |
| `src/db/db.ts`                  | `GameSessionRecord.gameType`         | Add `\| "<game>"`            |
| `src/db/gameRecorder.ts`        | `gameType` field + constructor param | Add `\| "<game>"` (2 places) |
| `src/lib/sessionPersistence.ts` | `PersistedSession.gameType`          | Add `\| "<game>"`            |
| `src/hooks/useGameSession.ts`   | `gameType` param                     | Add `\| "<game>"`            |

---

## 9. Routing & Navigation (`src/App.tsx`)

- Import the new screen component and store/options types
- Add screen variant to `Screen` type union (with options, playerNames, playerIds, botSkills, restoredState)
- Add `handleRematch` case for the new screen name
- Add game label in `ResumePrompt`
- Add resume case in `handleResume`
- Add rendering block: `if (screen.name === "<game>") return <GameScreen .../>`
- Add game type to `setup` screen's `game` prop union
- Add navigation case in `onStart` handler (setup → game screen)

---

## 10. Setup Screen (`src/screens/GameSetupScreen.tsx`)

- Import new options type and defaults from the store
- Add `"<game>"` to `game` prop union
- Add `<game>Options` to `onStart` callback signature
- Add state: `const [<game>Options, set<Game>Options] = useState(...)`
- Add title mapping for the new game
- Add `gameClass` mapping to use `"game-<name>"` (so the setup screen uses the correct accent color)
- Add options UI in Step 1 (round limit, toggles, etc.)
- Add start button in Step 2 that passes the options

---

## 11. Practice / Home Screen

Depending on whether the game is a **main game** or **practice game**:

- **Main game** → add to `GAMES` array in `src/screens/HomeScreen.tsx` + update `onSelectGame` type
- **Practice game** → add to `PRACTICE_GAMES` array in `src/screens/PracticeScreen.tsx` + update `onSelectGame` type

---

## 12. CSS Theme & GameShell

Every game gets its own accent color theme class.

### `src/index.css`

Add a `.game-<name>` class with the game's accent color variables:

```css
.game-<name > {
  --sal: 0px;
  --color-game-accent: theme(--color-<color>-400);
  --color-game-accent-dim: theme(--color-<color>-950);
  --color-game-accent-glow: rgba(<r>, <g>, <b>, 0.5);
  --color-game-accent-text: #fff; /* or #000 for light accents */
}
```

Then add `.game-<name>` to the grid background selector list:

```css
.game-x01,
.game-cricket,
.game-highscore,
.game-<name> {
  background-image: ...
```

### `src/components/GameShell.tsx`

Add `"game-<name>"` to the `gameClass` prop type union:

```ts
gameClass: "game-x01" | "game-cricket" | "game-highscore" | "game-<name>";
```

### Screen component

Use the new class in the screen's `<GameShell gameClass="game-<name>" ...>`.

---

## 13. README (`README.md`)

Update these sections to include the new game:

- **Architecture Overview** table — add engine name to Pure Game Engines row
- **State Management** table — add new store/engine row
- **Project Structure** tree — add engine, store, controller, strategy, and screen files

---

## 14. Verification

1. `npm test` — all tests pass
2. `npm run lint` — no eslint, tsc, or prettier errors
3. Manual test: launch app → navigate to game → play through with human + bot → verify:
   - Dart hits register correctly
   - Bot throws automatically
   - LED highlights current target(s)
   - Turn transitions work (delay overlay, next player)
   - Undo works
   - Win/tie detection correct
   - Results overlay shows
   - Rematch works
   - Session resume works (refresh mid-game)
