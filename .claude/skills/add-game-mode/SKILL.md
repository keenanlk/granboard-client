---
name: add-game-mode
description: >
  Use this skill whenever the user wants to add, implement, or create a new dart game mode or
  game type in NLC Darts. Triggers include phrases like "add Shanghai", "implement Cricket",
  "new game mode", "add a game called X", "I want to add [dart game]", or any request to
  build a new playable game. Do NOT use for modifying rules of an existing game — only for
  net-new implementations. Always use this skill even if the user only mentions one part
  (e.g. "just add the engine") — walk them through the full checklist and let them skip steps
  explicitly.
---

# Add Game Mode — Orchestrator

You are coordinating a full end-to-end implementation of a new NLC Darts game mode. Your job
here is to gather requirements, confirm rules, and then delegate each phase to the appropriate
sub-skill in `sub-skills/`. Do not implement anything directly from this file — read and follow
each sub-skill when its phase begins.

---

## Phase 0: Requirements

Before opening any file or delegating to a sub-skill, confirm:

1. **Game name** — what is it called? (e.g. Shanghai, Cricket, Killer)
2. **Placement** — Main game (`HomeScreen`) or Practice game (`PracticeScreen`)?
3. **Rules** — does the user have a rule doc, or should you draft one from common knowledge?

Do not proceed until all three are answered.

---

## Phase 1: Rule Document

Check if `/docs/game-rules/<game-name>.md` exists. If it does, read and confirm with the user.
If not, draft it now covering:

- Objective and win condition
- Turn structure (darts per turn, hit/miss definition)
- Scoring and advancement logic
- Targets/sequence
- Edge cases: ties, equal turns, round limits
- Example game walkthrough
- Simplified data model (fields you expect on Player and State)

**Do not proceed until the user explicitly confirms the rules are correct.**

---

## Phase 2: Engine, Tests & Store

Read and follow: `sub-skills/engine.md`

---

## Phase 3: Bot Strategy

Read and follow: `sub-skills/bot.md`

---

## Phase 4: Controller & Screen

Read and follow: `sub-skills/screen.md`

---

## Phase 5: Routing, Navigation & Setup

Read and follow: `sub-skills/routing.md`

---

## Phase 6: CSS Theme

Ask the user what accent color they want for this game before writing anything.

In `src/index.css`, add:

```css
.game-<n > {
  --sal: 0px;
  --color-game-accent: theme(--color-<color>-400);
  --color-game-accent-dim: theme(--color-<color>-950);
  --color-game-accent-glow: rgba(<r>, <g>, <b>, 0.5);
  --color-game-accent-text: #fff;
}
```

Also add `.game-<n>` to the grid background selector list in `src/index.css`,
and add `"game-<n>"` to the `gameClass` prop union in `src/components/GameShell.tsx`.

---

## Phase 7: README

In `README.md`:

- Architecture Overview table → add engine to Pure Game Engines row
- State Management table → add new store/engine row

---

## Phase 8: Verification

Run `npm test`. If tests fail: read the output carefully, fix the engine or assertions
(never suppress), and re-run until clean.

Run `npm run lint`. Fix all errors before reporting done.

Report to the user what to verify manually:

- Full game: 1 human + 1 bot
- Dart hits register, bot throws on its turn, LEDs highlight correct numbers
- Turn transitions, undo works for human (disabled for bot)
- Win/tie → results overlay appears
- Rematch restarts cleanly
- Quit mid-game and resume (session persistence)
