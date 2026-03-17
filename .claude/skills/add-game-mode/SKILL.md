---
name: add-game-mode
description: Add a new game mode to NLC Darts. Use when the user wants to create a new dart game (e.g. "add Shanghai", "new game mode"). Follows the Engine → Store → Controller → Screen architecture.
---

You are adding a new game mode to NLC Darts. The user will tell you the game name and rules. Follow every step below in order. Do not skip steps. Grill the user with questions until everything is specified.

Before starting, read the rule document at `/docs/game-rules/` if one exists for this game. That is the source of truth. If none exists, create one in Step 1.

## Step 1: Rule Document

Create `/docs/game-rules/<game-name>.md` with:

- Objective, targets/sequence, scoring, advancement, win condition
- Turn structure (darts per turn, what counts as a hit/miss)
- Edge cases: ties, round limits, equal turns
- Example game walkthrough
- Simplified data model

Ask the user to confirm the rules before proceeding.

## Step 2: Engine

Create `/src/engine/<game>Engine.ts`. Implements `GameEngine<TState, TOptions>` from `./GameEngine.ts`.

Required exports:
- Options interface with configurable settings
- State interface with all game data (players, round, darts, winners)
- ThrownDart interface for per-dart metadata
- Player interface for per-player state
- Singleton: `export const <game>Engine = new <Game>Engine()`
- Defaults: `export const DEFAULT_<GAME>_OPTIONS`

Four methods: `startGame`, `addDart`, `undoLastDart`, `nextTurn` — all pure functions, no side effects.

Key guards:
- `addDart`: return unchanged if winners set, 3 darts thrown, or player finished
- `nextTurn`: handle round records, player rotation, round increment, win detection, round limit

Follow existing engines (e.g. `highScoreEngine.ts`) as a pattern.

## Step 3: Engine Tests

Create `/src/engine/<game>Engine.test.ts` using vitest, `CreateSegment`, `SegmentID`.

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

Run `npm test` to verify.

## Step 4: Store

Create `/src/store/use<Game>Store.ts` (~20 lines) using `createGameStore` factory:

```typescript
import { createGameStore } from "./createGameStore.ts";
import { <game>Engine, type <Game>State } from "../engine/<game>Engine.ts";

export type { <Game>Options, ... } from "../engine/<game>Engine.ts";
export { DEFAULT_<GAME>_OPTIONS } from "../engine/<game>Engine.ts";

const DEFAULT_STATE: <Game>State = { ... };

export const use<Game>Store = createGameStore(<game>Engine, DEFAULT_STATE);
```

## Step 5: Bot Strategy

Create `/src/bot/<game>Strategy.ts`:
- Export a targeting function: `function <game>PickTarget(...gameContext): SegmentID`

Then add a `throw<Game>` method to `/src/bot/Bot.ts`:
- Import the strategy
- Call `simulateThrow(target, this.sigma)` and return the result
- Accept an optional `onThrow` callback for logging

## Step 6: Controller

Create `/src/controllers/<Game>Controller.ts` implementing `GameController`:

- `onDartHit(segment)`:
  - Call store `addDart`
  - Guard: if dart wasn't registered (length unchanged), return
  - Emit `dart_hit` (with `effectiveMarks` if relevant)
  - Emit `open_numbers` with current target(s) for LED highlights (numbers 1-20 only — Bull is NOT addressable via 20-byte LED command)
  - Check for win -> emit `game_won`
- `onNextTurn()`:
  - Call store `nextTurn`
  - Emit `next_turn`
  - Emit `open_numbers` with new target(s)

## Step 7: Screen

Create `/src/screens/<Game>Screen.tsx` following `HighScoreScreen.tsx` pattern.

Props: `options`, `playerNames`, `playerIds`, `botSkills`, `restoredState?`, `onExit`, `onRematch`, `setProgress?`, `onNextLeg?`, `setConfig?`, `legResults?`, `currentLegIndex?`

Required hooks:
- `use<Game>Store()` — read state
- `useGameSession()` — game lifecycle, turn delay, recording, persistence
- `useBotTurn()` — bot automation
- `useAwardDetection()` — if awards are supported

Required UI:
- `GameShell` wrapper with gameClass, transition/countdown, next-turn button, overlays
- `ResultsOverlay` in overlays
- `GameMenu` (undo + exit)
- `BotThinkingIndicator` when current player is a bot
- Player strip at bottom (name, key stat, secondary stat)
- All text readable from 8 feet away (big, bold typography)

Bot integration:
- `useMemo` to build `bots: Map<number, Bot>` from `botSkills`
- `useCallback` for `getThrow` that reads live store state
- `useBotTurn({ bots, currentPlayerIndex, dartsThrown, isBust, hasWinner, isTransitioning, onNextTurn, getThrow })`
- `isCurrentBot = bots.has(currentPlayerIndex)` for UI conditionals
- Disable undo when bot is playing

## Step 8: Type Wiring

Add the new game type string to these union types:

| File | Location | Change |
|------|----------|--------|
| `src/db/db.ts` | `GameSessionRecord.gameType` | Add `\| "<game>"` |
| `src/db/gameRecorder.ts` | `gameType` field + constructor param | Add `\| "<game>"` (2 places) |
| `src/lib/sessionPersistence.ts` | `PersistedSession.gameType` | Add `\| "<game>"` |
| `src/hooks/useGameSession.ts` | `gameType` param | Add `\| "<game>"` |

## Step 9: Routing & Navigation

In `src/App.tsx`:
- Import screen component and store/options types
- Add screen variant to `Screen` type union
- Add `handleRematch` case
- Add game label in `ResumePrompt`
- Add resume case in `handleResume`
- Add rendering block for the new screen
- Add game type to `setup` screen's `game` prop union
- Add navigation case in `onStart` handler

## Step 10: Setup Screen

In `src/screens/GameSetupScreen.tsx`:
- Import options type and defaults
- Add to `game` prop union
- Add options to `onStart` callback
- Add state for game options
- Add title and `gameClass` mappings
- Add options UI in Step 1
- Add start handler in Step 2

## Step 11: Home / Practice Screen

- **Main game** -> add to `GAMES` array in `HomeScreen.tsx` + update `onSelectGame` type
- **Practice game** -> add to `PRACTICE_GAMES` array in `PracticeScreen.tsx` + update `onSelectGame` type

Ask the user which category the game belongs to.

## Step 12: CSS Theme

In `src/index.css`, add a `.game-<name>` class:
```css
.game-<name> {
  --sal: 0px;
  --color-game-accent: theme(--color-<color>-400);
  --color-game-accent-dim: theme(--color-<color>-950);
  --color-game-accent-glow: rgba(<r>, <g>, <b>, 0.5);
  --color-game-accent-text: #fff;
}
```

Then add `.game-<name>` to the grid background selector list in `src/index.css`.

In `src/components/GameShell.tsx`, add `"game-<name>"` to the `gameClass` prop type union.

## Step 13: README

Update `README.md`:
- Architecture Overview table — add engine to Pure Game Engines row
- State Management table — add new store/engine row

## Step 14: Verification

1. Run `npm test` — all tests must pass
2. Run `npm run lint` — no errors
3. Report to the user what manual testing they should do:
   - Play through with human + bot
   - Verify dart hits, bot throws, LED highlights, turn transitions, undo, win/tie detection, results overlay, rematch, session resume
