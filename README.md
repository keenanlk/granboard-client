<p align="center">
  <img src="public/nlc-darts-512.png" alt="NLC Darts" width="120" />
</p>

<h1 align="center">NLC Darts</h1>

<p align="center">
  A custom scoring app for GranBoard electronic dartboards.<br/>
  Supports X01, Cricket, High Score, Around the World, and Tic Tac Toe with BLE connectivity, LED effects, bot opponents, and player statistics.
</p>

<p align="center">
  <strong>Vite</strong> &middot; <strong>React</strong> &middot; <strong>TypeScript</strong> &middot; <strong>Tailwind CSS v4</strong> &middot; <strong>Zustand</strong> &middot; <strong>Capacitor</strong>
</p>

---

## Getting Started

```bash
npm install

# Development
npm run dev          # Vite dev server (web)

# iOS
npm run cap:sync     # Build + sync to Capacitor
npm run cap:ios      # Build + open Xcode

# Quality
npm run lint         # ESLint + TypeScript check
npm test             # Vitest

# Bot simulator
npm run sim                              # X01 501 + Cricket 1000 games each
npm run sim -- --mode cricket --games 2000
npm run sim -- --x01 701,doubleOut
npm run sim -- --mode highscore --hs-rounds 8
```

## Architecture Overview

| Layer                 | Details                                                               |
| --------------------- | --------------------------------------------------------------------- |
| **UI Layer**          | Screens, Components, Hooks                                            |
| **Zustand Stores**    | Per-game state + BLE connection + profiles                            |
| **Controllers**       | Board input → store updates + event emission                          |
| **Event Bus**         | dart_hit, bust, game_won, next_turn, open_numbers                     |
| **Side Effects**      | LED animations, sound effects                                         |
| **Pure Game Engines** | x01Engine, cricketEngine, highScoreEngine, atwEngine, ticTacToeEngine |
| **Board / BLE Layer** | Granboard, Dartboard, GranboardLED                                    |
| **Bot AI System**     | throwSimulator, strategies, BoardGeometry                             |
| **Persistence**       | IndexedDB (players, game sessions, stats)                             |

Data flows **down** (engines are pure, no dependencies on UI or stores) and events flow **up** through the event bus.

## Game Engines (`src/engine/`)

All engines implement the `GameEngine<TState, TOptions>` interface:

```typescript
interface GameEngine<TState, TOptions> {
  startGame(options: TOptions, playerNames: string[]): TState;
  addDart(state: TState, segment: Segment): Partial<TState>;
  undoLastDart(state: TState): Partial<TState>;
  nextTurn(state: TState): Partial<TState>;
}
```

Every method is a **pure function** — takes state + input, returns only the fields that changed (`Partial<TState>`). Zero side effects. Fully testable and replayable.

### X01 Engine

Supports 301, 501, and 701 with configurable rules:

| Option          | Description                                   |
| --------------- | --------------------------------------------- |
| `startingScore` | 301 / 501 / 701                               |
| `splitBull`     | Outer bull = 25 (on) vs both zones = 50 (off) |
| `doubleIn`      | Must hit a double to start scoring            |
| `doubleOut`     | Must finish on a double or bull               |
| `masterOut`     | Must finish on a double, triple, or bull      |

**Bust rules** — a turn busts (score reverts to turn start) if any of:

- Score goes below 0
- Score lands on exactly 1 with double/master out enabled
- Reaches 0 on an invalid finish (e.g. single with doubleOut)

**Undo** uses a snapshot-based history stack (capped at 12 entries). Each dart and turn advance pushes a snapshot, enabling multi-step undo across turn boundaries.

### Cricket Engine

Standard Cricket on targets 20, 19, 18, 17, 16, 15, and Bull.

| Option       | Description                                                      |
| ------------ | ---------------------------------------------------------------- |
| `singleBull` | Both bull zones = 1 mark (on) vs inner = 2, outer = 1 (off)      |
| `roundLimit` | Max rounds before highest score wins (0 = unlimited, default 20) |
| `cutThroat`  | Cut-Throat mode: points go to opponents, lowest score wins       |

**Cut-Throat variant:** In Cut-Throat Cricket, the scoring model is inverted — extra marks beyond 3 add points to each opponent who hasn't closed that target, rather than to the thrower. The goal is to close all targets while keeping your own score as low as possible. The winner is the first player to close all 7 targets with the lowest (or tied-lowest) score.

**Scoring rules:**

- Marks cap at 3 per target
- Extra marks beyond 3 score points only if the player has closed that target AND at least one opponent hasn't
- Points = extra marks × target value

**Win condition:** closed all 7 targets AND score >= all opponents. If all players close everything, highest score wins (stalemate).

### High Score Engine

Pure points accumulation over a fixed number of rounds.

| Option      | Description                                                 |
| ----------- | ----------------------------------------------------------- |
| `rounds`    | Number of rounds per player                                 |
| `tieRule`   | `"stand"` (shared win) or `"playoff"` (1-dart sudden death) |
| `splitBull` | Outer bull = 25 vs 50                                       |

## Bot AI System (`src/bot/`)

### Gaussian Throw Model

Throws are simulated with 2D Gaussian noise on a real dartboard coordinate system:

1. Look up the target segment's center point `(x, y)` in millimeters
2. Add noise: `actualX = x + N(0, sigma^2)`, `actualY = y + N(0, sigma^2)` (Box-Muller transform)
3. Map the actual `(x, y)` back to a `SegmentID` using board geometry

The sigma parameter controls accuracy — lower = tighter grouping:

| Skill Level  | Sigma (mm) | Description                                  |
| ------------ | ---------- | -------------------------------------------- |
| Beginner     | 50         | Large scatter, often misses target number    |
| Intermediate | 25         | Frequently hits number, rarely intended ring |
| Club         | 18         | Often hits intended number (~18 PPD)         |
| County       | 15         | Intermediate competitive                     |
| Advanced     | 12         | Consistent in right segment (~25 PPD)        |
| SemiPro      | 9          | Reliably hits intended ring (~27 PPD)        |
| Expert       | 7          | Strong semi-pro precision (~32 PPD)          |
| Pro          | 6          | Near-perfect precision (~38 PPD)             |

### Board Geometry (`src/board/BoardGeometry.ts`)

Physical dartboard layout in millimeters, origin at bull center:

```
Ring boundaries (BDO/WDF spec):
  Inner bull:    0 – 6.35 mm
  Outer bull:    6.35 – 15.9 mm
  Inner single:  15.9 – 99 mm
  Treble:        99 – 107 mm
  Outer single:  107 – 162 mm
  Double:        162 – 170 mm
  Beyond 170mm = MISS
```

`segmentCenter(id)` returns the aim point for any segment. `coordToSegmentId(x, y)` maps coordinates back to a segment using angle (clockwise from top, 18-degree sectors) and radius.

### X01 Strategy

An 8-rule decision tree evaluated in priority order:

1. **Double-in gate** — if `doubleIn && !opened`, aim DBL_20
2. **Soft-tip out chart** — lookup table for scores 180 to 41 (optimal first dart for single-out, split bull off)
3. **Bull finish** — score = 50, aim DBL_BULL
4. **Master out triple** — score <= 60 and divisible by 3, aim triple
5. **Double finish** — score <= 40 and even, aim double
6. **Reduce odd** — score <= 40 and odd, aim single 1
7. **Standard endgame** — score <= 20 aim single, <= 40 aim double
8. **Default** — aim TRP_20 (split bull) or DBL_BULL (combined bull)

### Cricket Strategy

Three modes based on score differential:

| Mode         | Trigger          | Weights (scoring / closure / denial)           |
| ------------ | ---------------- | ---------------------------------------------- |
| **Catchup**  | Behind >= 40 pts | 2.0 / 2.0 / 0.5 — farm points, ignore denial   |
| **Race**     | Within +/-19 pts | 1.0 / 1.5 / 1.8 — balanced, slight denial edge |
| **Lockdown** | Ahead >= 25 pts  | 0.5 / 2.0 / 2.0 — stop farming, close and deny |

For each of the 7 targets, a weighted score is computed:

```
totalScore = scoringValue * w.scoring
           + closureValue * w.closure
           + denialUrgency * w.denial
```

- **Scoring value** — can I earn points on this target right now?
- **Closure value** — how valuable is closing this target? Scaled by progress (more marks = higher priority to finish)
- **Denial urgency** — how urgently must I close to deny opponent scoring? Also scaled by progress

The bot aims at the target with the highest weighted score.

### High Score Strategy

Simple: aim TRP_20 when split bull is on (60 > 25), aim DBL_BULL when off (combined bull area is a bigger target for 50 pts).

## Dartboard & BLE (`src/board/`)

### Segment Encoding

Each segment has a `SegmentID`, `SegmentType` (Single/Double/Triple/Other), `SegmentSection` (1-20, 25 for bull, 26 for other), and `Value` (point value).

IDs for numbers 1-20 are encoded as `(number - 1) * 4 + zone`:

- Zone 0 = inner single, 1 = triple, 2 = outer single, 3 = double
- Special IDs: `BULL = 80`, `DBL_BULL = 81`, `MISS = 82`, `BUST = 83`

All constants use `const` objects (not TypeScript enums) due to `erasableSyntaxOnly`.

### Granboard BLE

`Granboard` class provides a unified interface over Capacitor BLE (native) and Web Bluetooth (web fallback).

- **Service UUID:** `442f1570-8a00-9a28-cbe1-e1d4212d53eb`
- **Hit detection:** BLE notify characteristic sends 4-5 byte sequences mapped to segment IDs
- **Auto-reconnect:** stores device ID in localStorage for silent reconnection
- **`MockGranboard`** — test double that can simulate hits via `simulateHit(segmentId)`

### LED Protocol (`src/board/GranboardLED.ts`)

Two command formats sent to the same BLE characteristic:

**16-byte animated commands:**

- `buildHitCommand(dartNumber, multiplier, color)` — highlight a single hit
- `buildLightRingCommand(color)` — persistent full ring illumination
- `buildBlinkCommand(color, duration)` — blink and fade (bulls/busts)
- `buildButtonPressCommand(colorUp, colorDown)` — wave animation

Byte layout: `[0]` command type, `[1-3]` primary RGB, `[4-6]` secondary RGB, `[10]` ring position, `[12]` duration, `[15]` flags.

**20-byte persistent state command:**

- Each byte index `n-1` maps to dart number `n` (1-20)
- Non-zero = lit, 0 = off. No timeout.
- Bull is NOT addressable in this format
- Used for cricket open-number highlighting

## State Management (`src/store/`)

Each game mode has a Zustand store that wraps its pure engine:

| Store                   | Engine            | Purpose                               |
| ----------------------- | ----------------- | ------------------------------------- |
| `useGameStore`          | `x01Engine`       | X01 game state + actions              |
| `useCricketStore`       | `cricketEngine`   | Cricket game state + actions          |
| `useHighScoreStore`     | `highScoreEngine` | High Score game state + actions       |
| `useATWStore`           | `atwEngine`       | Around the World game state + actions |
| `useTicTacToeStore`     | `ticTacToeEngine` | Tic Tac Toe game state + actions      |
| `useGranboardStore`     | —                 | BLE connection state                  |
| `usePlayerProfileStore` | —                 | Player profiles (IndexedDB-backed)    |

Stores call engine methods (pure functions), merge the `Partial<TState>` result into state, then controllers emit events for side effects.

**Session persistence:** Active games auto-save to localStorage on every dart and turn change. On app restart, a resume prompt offers to restore the in-progress game. Sessions are cleared when a game ends (winner detected) or a new game starts.

**Undo history:** Each store maintains a capped undo stack (12 snapshots). Both `addDart` and `nextTurn` push a state snapshot before applying changes, enabling multi-step undo that works across turn boundaries.

## Event System (`src/events/`)

A typed event bus decouples game logic from UI, LED, and sound effects:

```typescript
type GameEventMap = {
  dart_hit: { segment: Segment; effectiveMarks?: number };
  bust: Record<string, never>;
  game_won: { playerName: string };
  next_turn: Record<string, never>;
  open_numbers: { numbers: number[] }; // cricket only
};
```

**Controllers** (`src/controllers/`) receive board input (`onDartHit`, `onNextTurn`), update stores, and emit events. A single `GameController` is active at a time via a registry pattern.

**LED effects** (`src/board/ledEffects.ts`) listen on the event bus:

- `dart_hit` — colored hit animation (red=single, green=double, yellow=triple, blue=bull)
- `next_turn` — button press wave
- `open_numbers` — 20-byte persistent command (700ms delay after hit animation)
- Remove-darts countdown — ring depletion animation

**Sound effects** (`src/sound/soundEffects.ts`) listen on the same event bus, parallel to LED effects. For X01/High Score darts, sound is based on segment type (single, double, triple, bull). For Cricket darts, sound is based on `effectiveMarks` — the combined closing + scoring marks — so a triple that only closes 1 mark and scores 2 extras still plays the triple sound. Darts with zero effective marks (off-target or fully closed) play a plain hit sound.

## Database & Stats (`src/db/`)

IndexedDB (database: `NLCDartsDB`) with two object stores:

**`players`** — `{ id, name, createdAt }`

**`game_sessions`** — recorded game history:

```typescript
{
  id, gameType, playedAt, options,
  participants: [{ playerIndex, playerName, playerId }],
  rounds: [{ playerIndex, playerName, playerId, round, darts[], roundScore }]
}
```

**`GameRecorder`** tracks rounds during play and saves on game end (only if at least one named player).

**`computePlayerStats()`** aggregates per-player statistics:

- X01: games played, wins, PPD, avg/best round
- Cricket: games played, wins, MPR, avg round score
- High Score: games played, wins, avg/best score, avg/best round

## Awards (`src/lib/awards.ts`)

Detected per turn from thrown darts:

| Game             | Award          | Condition                               |
| ---------------- | -------------- | --------------------------------------- |
| X01 / High Score | Hat Trick      | 3 bulls                                 |
| X01 / High Score | Ton 80         | 180 total                               |
| X01 / High Score | High Ton       | >= 140 total                            |
| X01 / High Score | Low Ton        | >= 100 total                            |
| Cricket          | Three in Black | 3 double bulls                          |
| Cricket          | Hat Trick      | 3 bulls (inner or outer)                |
| Cricket          | Three in a Bed | 3 darts same number + same ring         |
| Cricket          | White Horse    | 3 triples on 3 different virgin numbers |

## Bot Simulator (`scripts/botSim.ts`)

CLI tool for measuring bot skill calibration. Creates bots at each skill level, runs N games, and reports average PPD (X01/High Score) or MPR (Cricket).

```bash
npm run sim                                    # Default: X01 501 + Cricket, 1000 games
npm run sim -- --mode x01 --games 5000         # X01 only, 5000 games
npm run sim -- --mode cricket --games 2000     # Cricket only
npm run sim -- --x01 701,doubleOut             # Custom X01 options
npm run sim -- --mode highscore --hs-rounds 8  # High Score, 8 rounds
```

## Project Structure

```
src/
├── engine/        Pure game logic — one per game mode + shared interface
├── bot/           AI opponents — throw simulator, strategies, characters
├── board/         Hardware — BLE connection, segment encoding, LED commands
├── sound/         Audio feedback via event bus
├── store/         Zustand stores — one per game mode + BLE + player profiles
├── controllers/   Board input → store updates + event emission
├── events/        Typed event bus (dart_hit, bust, game_won, etc.)
├── db/            IndexedDB persistence — players, game sessions, stats
├── lib/           Utilities — awards, session persistence, text sizing
├── screens/       Full-page game screen components
├── components/    Reusable UI (overlays, menus, player strip)
├── hooks/         Custom React hooks (bot turns, board wiring, sessions)
└── App.tsx        Root component + routing

scripts/           Bot simulator CLI + iOS build helper
docs/              Landing page, privacy policy, game rule documents
```

## Game Rules

Authoritative game rule documents live in [`docs/game-rules/`](docs/game-rules/). Engine implementations follow these docs as the source of truth.

## License

MIT
