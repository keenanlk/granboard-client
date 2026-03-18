# Sub-skill: Bot Strategy

Design and implement the bot's targeting strategy for this game mode.

---

## Step 1: Agree on the Strategy

Before writing any code, ask the user these questions. Do not skip any — the answers directly
determine the targeting logic.

1. **Primary target** — what should the bot aim at on a normal turn? (highest value available?
   next in sequence? something conditional?)
2. **When ahead** — does the bot play it safe (easiest hit) or aggressively (highest value)?
3. **When behind** — does it chase the leader's target or focus on its own optimal play?
4. **When tied** — is there a tiebreaker target preference?
5. **Near win** — does targeting change in the final round or on the final segment?
6. **Multipliers** — should the bot ever prefer a double or triple over a single of the same
   number? Under what conditions?
7. **Unavailable targets** (if applicable) — what does the bot do if its best target is
   blocked or already closed?

Do not write any code until the user has answered all relevant questions.

---

## Step 2: Strategy File

**Read first:** Open `/src/bot/Bot.ts` and an existing strategy file (e.g.
`/src/bot/highScoreStrategy.ts`) to understand `SegmentID`, `simulateThrow`, the `sigma`
convention, and how targeting functions are structured.

Create `/src/bot/<game>Strategy.ts`:

```typescript
// Pure function — no side effects
// Accept whatever game context is needed to make the targeting decision
export function <game>PickTarget(
  state: <Game>State,
  playerIndex: number,
  // ...any other needed context
): SegmentID {
  // Implement the strategy agreed with the user above
}
```

---

## Step 3: Wire into Bot

In `/src/bot/Bot.ts`, add:

```typescript
throw<Game>(state: <Game>State, onThrow?: ThrowCallback): Segment {
  const target = <game>PickTarget(state, /* context */);
  const result = simulateThrow(target, this.sigma);
  onThrow?.(target, result);
  return result;
}
```
