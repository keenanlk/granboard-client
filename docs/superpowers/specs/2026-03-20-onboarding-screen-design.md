# Onboarding Screen Design

## Overview

Add a required onboarding step that forces new users to create a player profile before accessing the homescreen. This ensures every user has at least one saved player for stat tracking.

## Trigger Logic

`App.tsx` must call `usePlayerProfileStore.getState().load()` in a top-level `useEffect` on mount (the store is currently only loaded lazily by `PlayerSelectStep` and `PlayersScreen`).

While `loaded === false`, render nothing (or a minimal dark empty screen) to avoid flashing the onboarding screen for returning users.

Once `loaded === true`, check `players.length === 0`. If true, render `OnboardingScreen` instead of the normal screen router. No new screen union member needed — the check sits above the screen router entirely.

If the user later deletes all players, the onboarding screen reappears on next render — no localStorage flag required.

Note: The `ResumePrompt` overlay (for resuming interrupted games) only renders alongside the screen router, so it will naturally be hidden during onboarding. After the player is created the user will see the home screen with any resume prompt as expected.

## OnboardingScreen Component

**File:** `apps/web/src/screens/OnboardingScreen.tsx`

**Layout:** Dark themed, centered, matching existing app aesthetic.

- "Welcome to NLC Darts" heading using Beon font with glow treatment (same as HomeScreen title)
- Subtitle: "Create a player to start tracking your stats"
- Large text input for player name
- Large "Let's Play" confirm button, disabled until trimmed name is empty
- Pressing Enter in the input submits the form (standard `<form onSubmit>` pattern)
- On submit: calls `await createPlayer(trimmedName)` from `usePlayerProfileStore`
- Once the store updates with `players.length > 0`, App.tsx naturally renders the home screen

**Design constraints (from memory):**

- Target display: 15-24 inch screen viewed from ~8 feet
- Big, bold typography — scores and headings must be huge
- Large tap/click targets
- Dark theme

## Files Changed

1. **`apps/web/src/screens/OnboardingScreen.tsx`** (new) — Welcome screen with player creation
2. **`apps/web/src/App.tsx`** (modified) — Add loading state + onboarding gate before screen router

## What This Does NOT Include

- No localStorage/flag persistence — purely reactive to player count
- No multi-player creation flow — just one player required
- No tutorial or game mode explanation
- No new screen union member — the gate sits above the router
