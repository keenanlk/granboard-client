# Sub-skill: Controller & Screen

Implement the game controller and the React screen component.

---

## Step 1: Controller

**Read first:** Open an existing controller (e.g. `/src/controllers/HighScoreController.ts`)
to understand the `GameController` interface, how `addDart`/`nextTurn` are called, and the
full set of events emitted. Do not guess at event names or payloads.

Create `/src/controllers/<Game>Controller.ts`:

**`onDartHit(segment)`**

1. Call store `addDart(segment)`
2. Guard: if dart count didn't change, return early — the dart wasn't registered
3. Emit `dart_hit` with relevant metadata (score delta, marks, etc. — match the rule doc)
4. Emit `open_numbers` with the current player's lit targets
   - Numbers 1–20 only — Bull is **not** LED-addressable via the 20-byte command
5. If `state.winners` is set → emit `game_won`

**`onNextTurn()`**

1. Call store `nextTurn()`
2. Emit `next_turn`
3. Emit `open_numbers` with the new current player's targets

---

## Step 2: Screen

**Read first:** Open `/src/screens/HighScoreScreen.tsx` fully before writing a single line.
Note: hook ordering, how `GameShell` is configured, how overlays are wired, how bot state
drives conditional UI, and how `getThrow` reads live store state. Mirror this structure exactly.

Create `/src/screens/<Game>Screen.tsx`.

### Props

```typescript
interface <Game>ScreenProps {
  options: <Game>Options;
  playerNames: string[];
  playerIds: string[];
  botSkills: (BotSkill | null)[];
  restoredState?: <Game>State;
  onExit: () => void;
  onRematch: () => void;
  setProgress?: (p: number) => void;
  onNextLeg?: () => void;
  setConfig?: (c: GameConfig) => void;
  legResults?: LegResult[];
  currentLegIndex?: number;
}
```

### Required Hooks (in this order)

```typescript
const state = use<Game>Store();
const { isTransitioning, onNextTurn, ... } = useGameSession({ gameType: "<game>", ... });
const bots = useMemo(() => buildBotMap(botSkills, playerIds), [botSkills, playerIds]);
const getThrow = useCallback(() => {
  const live = use<Game>Store.getState(); // read live state, not stale closure
  return bots.get(live.currentPlayerIndex)?.throw<Game>(live);
}, [bots]);
useBotTurn({ bots, currentPlayerIndex, dartsThrown, isBust, hasWinner, isTransitioning, onNextTurn, getThrow });
useAwardDetection(...); // if awards apply
```

### Required UI

- `GameShell` wrapper with `gameClass="game-<n>"`, countdown, transition, next-turn button,
  and overlays slot
- `ResultsOverlay` inside overlays
- `GameMenu` with undo + exit buttons
  - **Disable undo when `isCurrentBot` is true**
- `BotThinkingIndicator` rendered when `isCurrentBot`
- Player strip at bottom: name, primary stat, secondary stat
- All text must be legible from 8 feet — use large, bold typography throughout

### Bot Conditional

```typescript
const isCurrentBot = bots.has(state.currentPlayerIndex);
```

Use `isCurrentBot` to:

- Show `BotThinkingIndicator` instead of action prompts
- Disable the undo button
- Hide any human-input UI while the bot is thinking
