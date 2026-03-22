# Sub-skill: Routing, Navigation & Setup

Wire the new game into the app's type system, router, setup screen, and home/practice screen.
Use `str_replace` for all edits — read each file before editing and make surgical changes only.

---

## Step 1: Type Wiring

Add `| "<game>"` in each of these four locations:

| File                            | Location                                        |
| ------------------------------- | ----------------------------------------------- |
| `src/db/db.ts`                  | `GameSessionRecord.gameType` union              |
| `src/db/gameRecorder.ts`        | `gameType` field + constructor param (2 places) |
| `src/lib/sessionPersistence.ts` | `PersistedSession.gameType` union               |
| `src/hooks/useGameSession.ts`   | `gameType` param union                          |

Read each file before editing to find the exact union string.

---

## Step 2: App Router

**Read first:** Open `src/App.tsx`. Find an existing game's routing block (search for another
game's screen component import) and use it as a pattern for all additions.

Add in `src/App.tsx`:

- Import the screen component and options/state types
- Add `"<game>"` to the `Screen` type union
- Add a `handleRematch` case for `"<game>"`
- Add the game label in `ResumePrompt`
- Add a `handleResume` case
- Add a rendering block for `<Game>Screen` with all required props
- Add `"<game>"` to the `setup` screen's `game` prop union
- Add a navigation case in the `onStart` handler

---

## Step 3: Setup Screen

**Read first:** Open `src/screens/GameSetupScreen.tsx` and find an existing game's options
block to use as a pattern.

In `src/screens/GameSetupScreen.tsx`:

- Import options type and `DEFAULT_<GAME>_OPTIONS`
- Add `"<game>"` to the `game` prop union
- Add options state: `const [<game>Options, set<Game>Options] = useState(DEFAULT_<GAME>_OPTIONS)`
- Add a title mapping entry for `"<game>"`
- Add a `gameClass` mapping entry for `"game-<n>"`
- Add the options UI panel in Step 1 of the setup flow
- Add a start handler case in Step 2

---

## Step 4: Home / Practice Screen

Based on what the user chose in Phase 0 (main vs practice):

**Main game:**
Open `src/screens/HomeScreen.tsx`. Add an entry to the `GAMES` array and update the
`onSelectGame` callback type to include `"<game>"`.

**Practice game:**
Open `src/screens/PracticeScreen.tsx`. Add an entry to the `PRACTICE_GAMES` array and update
the `onSelectGame` callback type to include `"<game>"`.
