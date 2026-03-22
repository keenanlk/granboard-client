# Onboarding Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate the app behind a welcome screen that requires creating at least one player before accessing the homescreen.

**Architecture:** Add an `OnboardingScreen` component and a loading/onboarding gate in `App.tsx` that checks the player store before rendering the screen router. Purely reactive — no flags, no new screen union members.

**Tech Stack:** React, Zustand, Tailwind CSS v4, IndexedDB (via existing `usePlayerProfileStore`)

**Spec:** `docs/superpowers/specs/2026-03-20-onboarding-screen-design.md`

---

### Task 1: Create OnboardingScreen component

**Files:**

- Create: `apps/web/src/screens/OnboardingScreen.tsx`

- [ ] **Step 1: Create the OnboardingScreen component**

```tsx
import { useState } from "react";
import { usePlayerProfileStore } from "../store/usePlayerProfileStore.ts";

export function OnboardingScreen() {
  const [name, setName] = useState("");
  const createPlayer = usePlayerProfileStore((s) => s.createPlayer);

  const trimmed = name.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmed) return;
    await createPlayer(trimmed);
  }

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-6">
      <h1
        className="text-5xl tracking-tight font-normal mb-2"
        style={{
          fontFamily: "Beon, sans-serif",
          color: "#fff",
          textShadow:
            "0 0 10px rgba(255,255,255,0.5), 0 0 30px rgba(255,255,255,0.2)",
        }}
      >
        Welcome to{" "}
        <span
          style={{
            color: "#ef4444",
            textShadow: "0 0 15px #ef4444, 0 0 40px rgba(239,68,68,0.5)",
          }}
        >
          NLC Darts
        </span>
      </h1>
      <p className="text-zinc-400 text-xl mb-10">
        Create a player to start tracking your stats
      </p>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full max-w-md"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          autoFocus
          className="w-full px-6 py-4 rounded-xl bg-zinc-900 border-2 border-zinc-700 text-white text-2xl text-center placeholder:text-zinc-600 focus:border-red-500 focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!trimmed}
          className="w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest bg-red-600 text-white disabled:opacity-30 disabled:cursor-not-allowed active:bg-red-700 transition-colors"
        >
          Let's Play
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /Users/keenankaufman/PhpstormProjects/untitled1 && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`
Expected: No errors related to OnboardingScreen

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/screens/OnboardingScreen.tsx
git commit -m "feat: add OnboardingScreen component"
```

---

### Task 2: Add loading gate and onboarding check in App.tsx

**Files:**

- Modify: `apps/web/src/App.tsx`
  - Add import for `OnboardingScreen` (near line 9)
  - Add import for `usePlayerProfileStore` (near line 12)
  - Inside `App()` function body (after the existing `useEffect` ending at line 233):
    - Call `usePlayerProfileStore.getState().load()` in a new `useEffect`
    - Subscribe to `loaded` and `players` from the store
    - Before the screen router (before line 437), add early returns:
      1. If `!loaded`, return `<div className="h-screen bg-zinc-950" />` (empty dark screen to prevent flash)
      2. If `loaded && players.length === 0`, return `<OnboardingScreen />`

- [ ] **Step 1: Add imports to App.tsx**

At the top of `apps/web/src/App.tsx`, add after the existing screen imports (after line 9):

```tsx
import { OnboardingScreen } from "./screens/OnboardingScreen.tsx";
```

And add after the existing store imports (after line 12):

```tsx
import { usePlayerProfileStore } from "./store/usePlayerProfileStore.ts";
```

- [ ] **Step 2: Add player store loading and onboarding gate**

Inside the `App()` function, after the existing `useEffect` block (after line 233), add:

```tsx
useEffect(() => {
  usePlayerProfileStore.getState().load();
}, []);

const { loaded: playersLoaded, players } = usePlayerProfileStore();
```

Then, before the screen router (before the `if (screen.name === "game")` check at line 437), add:

```tsx
if (!playersLoaded) return <div className="h-screen bg-zinc-950" />;

if (players.length === 0) {
  return <OnboardingScreen />;
}
```

Note: No callback needed — once `createPlayer` updates the store, `players.length > 0` becomes true and `App` re-renders past the gate automatically.

- [ ] **Step 3: Verify it compiles**

Run: `cd /Users/keenankaufman/PhpstormProjects/untitled1 && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Manual smoke test**

Run: `cd /Users/keenankaufman/PhpstormProjects/untitled1 && npm run dev --workspace=apps/web`

Test scenarios:

1. Clear IndexedDB (DevTools > Application > IndexedDB > delete "nlc-darts") and reload — should see onboarding screen
2. Enter a name and click "Let's Play" — should transition to home screen
3. Reload — should go straight to home screen (player exists)
4. Delete all players from Players screen, then navigate home — should see onboarding again

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/App.tsx
git commit -m "feat: gate app behind onboarding when no players exist"
```
