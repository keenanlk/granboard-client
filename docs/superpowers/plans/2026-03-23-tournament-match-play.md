# Tournament Match Play Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a tournament match is ready, the two players ready up, play an actual dart game (X01/Cricket, best-of-N legs), and the result automatically advances the bracket.

**Architecture:** Tournament creation stores game settings (game type, options, best-of format). The BracketScreen shows a match detail panel when a ready match is tapped. Players ready up via Colyseus messages. After both ready, a 10-second countdown starts, then the TournamentRoom server creates a game room (X01Room/CricketRoom) and sends the `colyseusRoomId` to both players. The app navigates to the actual game screen. When the best-of series completes, the result is recorded back to the bracket via Colyseus. A global alert modal notifies players anywhere in the app when their match is ready.

**Tech Stack:** React, Zustand, Colyseus (TournamentRoom + X01Room/CricketRoom), Supabase, brackets-manager, existing game infrastructure.

---

## File Map

| File                                                      | Action | Responsibility                                                      |
| --------------------------------------------------------- | ------ | ------------------------------------------------------------------- |
| `packages/engine/src/lib/setTypes.ts`                     | Modify | Extend `SetFormat` to support bo1/bo7/bo9                           |
| `packages/tournament/src/types.ts`                        | Modify | Add `TournamentGameConfig` type                                     |
| `packages/tournament/src/index.ts`                        | Modify | Export new types                                                    |
| `apps/web/supabase/migrations/004_tournaments.sql`        | Modify | Add `game_settings` jsonb column                                    |
| `apps/web/src/screens/CreateTournamentScreen.tsx`         | Modify | Add game type, options, best-of fields                              |
| `apps/web/src/lib/tournamentApi.ts`                       | Modify | Pass game_settings in insert                                        |
| `apps/web/src/screens/BracketScreen.tsx`                  | Modify | Match detail panel, game launch callback                            |
| `apps/web/src/hooks/useTournamentRoom.ts`                 | Modify | Add match-play messages, lift to App-level                          |
| `apps/server/src/rooms/TournamentRoom.ts`                 | Modify | Ready-up, countdown, game room creation, participant↔userId mapping |
| `apps/server/src/messages.ts`                             | Modify | Add tournament match-play messages                                  |
| `apps/web/src/App.tsx`                                    | Modify | Lift tournament connection, wire bracket↔game flow, global alert    |
| `apps/web/src/components/tournament/MatchReadyModal.tsx`  | Create | Global alert when player's match is ready                           |
| `apps/web/src/components/tournament/MatchDetailPanel.tsx` | Create | Bottom sheet showing match info, ready button, countdown            |

---

### Task 1: Extend SetFormat and Tournament Types

**Files:**

- Modify: `packages/engine/src/lib/setTypes.ts`
- Modify: `packages/tournament/src/types.ts`
- Modify: `packages/tournament/src/index.ts`

- [ ] **Step 1: Extend SetFormat to support all best-of options**

In `packages/engine/src/lib/setTypes.ts`, change:

```typescript
export type SetFormat = "bo1" | "bo3" | "bo5" | "bo7" | "bo9";
```

Update `getSetWinner` to derive `needed` dynamically:

```typescript
const needed = Math.ceil(parseInt(format.slice(2)) / 2);
```

Update `legCount`:

```typescript
export function legCount(format: SetFormat): number {
  return parseInt(format.slice(2));
}
```

- [ ] **Step 2: Add TournamentGameConfig type**

In `packages/tournament/src/types.ts`:

```typescript
import type { X01Options, CricketOptions, SetFormat } from "@nlc-darts/engine";

export type TournamentGameType = "x01" | "cricket";

export interface TournamentGameConfig {
  gameType: TournamentGameType;
  bestOf: SetFormat;
  throwOrder: "loser" | "alternate";
  x01Options?: X01Options;
  cricketOptions?: CricketOptions;
}
```

Add `gameSettings` to `Tournament` interface:

```typescript
gameSettings: TournamentGameConfig | null;
```

Export new types from `packages/tournament/src/index.ts`.

- [ ] **Step 3: Update tests for new SetFormat values**

Add tests for `getSetWinner` with bo1, bo7, bo9. Update `legCount` tests. Run `turbo test`.

- [ ] **Step 4: Commit**

---

### Task 2: Add game_settings Column to Supabase

**Files:**

- Modify: `apps/web/supabase/migrations/004_tournaments.sql`

- [ ] **Step 1: Add `game_settings jsonb` column to the CREATE TABLE statement**

- [ ] **Step 2: Apply to local DB**

```bash
echo 'ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS game_settings jsonb;' | supabase db query
```

- [ ] **Step 3: Commit**

---

### Task 3: Update CreateTournamentScreen with Game Settings

**Files:**

- Modify: `apps/web/src/screens/CreateTournamentScreen.tsx`
- Modify: `apps/web/src/lib/tournamentApi.ts`
- Modify: `apps/web/src/hooks/useDiscoverTournaments.ts`
- Modify: `apps/web/src/hooks/useMyTournaments.ts`
- Modify: `apps/web/src/screens/BracketScreen.tsx` (tournament mapping only)

- [ ] **Step 1: Add game settings fields to CreateTournamentScreen**

New state: `gameType`, `bestOf`, `startingScore`, `doubleOut`.

Add `gameSettings: TournamentGameConfig` to `CreateTournamentData`.

New UI sections between Format and Mode:

- **Game Type**: segmented — X01 / Cricket
- **Best Of**: segmented — 1 / 3 / 5 / 7 / 9
- **Starting Score** (X01 only): segmented — 301 / 501 / 701
- **Double Out** (X01 only): toggle

Default `throwOrder: "loser"`.

- [ ] **Step 2: Update tournamentApi.ts**

Add `game_settings: data.gameSettings` to the Supabase insert.

- [ ] **Step 3: Update all Tournament mappers to include gameSettings**

`mapTournament` in `useDiscoverTournaments.ts`, `useMyTournaments.ts`, and `BracketScreen.tsx` — add `gameSettings: row.game_settings ?? null`.

- [ ] **Step 4: Commit**

---

### Task 4: Add Tournament Match-Play Messages

**Files:**

- Modify: `apps/server/src/messages.ts`
- Modify: `apps/server/src/messages.test.ts`

- [ ] **Step 1: Add new message constants**

Client → Server:

```typescript
READY_FOR_MATCH: "ready_for_match",
UNREADY_FOR_MATCH: "unready_for_match",
MATCH_GAME_RESULT: "match_game_result",
```

Server → Client:

```typescript
MATCH_READY_STATE: "match_ready_state",
MATCH_COUNTDOWN: "match_countdown",
MATCH_START: "match_start",
MATCH_YOUR_TURN: "match_your_turn",
```

- [ ] **Step 2: Update messages.test.ts**

- [ ] **Step 3: Commit**

---

### Task 5: Participant ↔ UserId Mapping + TournamentRoom Match Handlers

**Files:**

- Modify: `apps/server/src/rooms/TournamentRoom.ts`

This is the largest task. The key challenge is that brackets-manager stores participants by internal integer ID and name, but we need to map those to Supabase userIds for readiness tracking and notifications.

- [ ] **Step 1: Build participantId ↔ userId mapping during startTournament**

When `handleStartTournament` creates the bracket, store a bidirectional mapping:

```typescript
// Room-level state
participantToUser: Map<number, string> = new Map(); // brackets-manager participant.id → userId
userToParticipant: Map<string, number> = new Map(); // userId → participant.id
matchLegWins: Map<number, [number, number]> = new Map(); // matchId → [p1Wins, p2Wins]
matchReadyState: Map<number, Set<string>> = new Map();
activeCountdowns: Map<number, ReturnType<typeof setInterval>> = new Map();
```

After `this.manager.createStage(...)`, query the created participants from storage. Match each participant name to the user via the `online_players` table. Populate both maps.

- [ ] **Step 2: Helper — resolve match participants to userIds**

```typescript
private getMatchUserIds(match: Match): [string | null, string | null] {
  const uid1 = match.opponent1?.id != null ? this.participantToUser.get(match.opponent1.id as number) ?? null : null;
  const uid2 = match.opponent2?.id != null ? this.participantToUser.get(match.opponent2.id as number) ?? null : null;
  return [uid1, uid2];
}
```

- [ ] **Step 3: Add READY_FOR_MATCH handler**

1. Validate match exists, status is Ready (2) or Waiting (1)
2. Validate userId is one of the two participants in this match
3. Add to `matchReadyState`
4. Broadcast `MATCH_READY_STATE { matchId, readyPlayerIds, opponentName }`
5. If both ready → start 10-second countdown:
   - `setInterval` broadcasts `MATCH_COUNTDOWN { matchId, secondsLeft }` every second
   - At 0: **server creates a game room** (X01Room or CricketRoom) via Colyseus `matchMaker.createRoom()`
   - Broadcasts `MATCH_START { matchId, playerNames, playerIds, gameSettings, colyseusRoomId }`
   - Updates match status to Running (3) via brackets-manager

- [ ] **Step 4: Add UNREADY_FOR_MATCH handler**

Remove from ready set. Cancel countdown if active. Broadcast updated state.

- [ ] **Step 5: Add MATCH_GAME_RESULT handler**

1. Validate matchId and winnerUserId
2. Map winnerUserId to opponent1 or opponent2 via `userToParticipant`
3. Increment leg wins in `matchLegWins`
4. Fetch tournament's `game_settings.bestOf` to determine `needed` wins
5. If series decided: call `this.manager.recordResult(matchId, { opponent1Score: p1Wins, opponent2Score: p2Wins })` → broadcast `BRACKET_UPDATE`
6. After bracket update, check for newly Ready matches and broadcast `MATCH_YOUR_TURN` to their participants

- [ ] **Step 6: Broadcast MATCH_YOUR_TURN for newly ready matches**

After any `BRACKET_UPDATE`, scan all matches. For each with status Ready (2) where both opponents are determined, broadcast `MATCH_YOUR_TURN { matchId, opponentName, tournamentId }` targeted to each participant's userId.

- [ ] **Step 7: Handle disconnect/forfeit**

If a player disconnects mid-match (leaves the TournamentRoom):

- Give them 60 seconds to reconnect
- If they don't, the opponent wins the current match by forfeit
- Record result and advance bracket

- [ ] **Step 8: Commit**

---

### Task 6: Lift useTournamentRoom to App Level

**Files:**

- Modify: `apps/web/src/hooks/useTournamentRoom.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/screens/BracketScreen.tsx`

This is a prerequisite for global alerts and the game↔bracket return flow.

- [ ] **Step 1: Add new match-play state and message handlers to useTournamentRoom**

New state fields:

```typescript
matchReadyState: { matchId: number; readyPlayerIds: string[]; opponentName: string } | null;
matchCountdown: { matchId: number; secondsLeft: number } | null;
matchStart: { matchId: number; playerNames: string[]; playerIds: string[]; gameSettings: TournamentGameConfig; colyseusRoomId: string } | null;
matchAlert: { matchId: number; opponentName: string; tournamentId: string } | null;
```

New actions: `readyForMatch`, `unreadyForMatch`, `reportMatchGameResult`, `clearMatchAlert`.

- [ ] **Step 2: Call useTournamentRoom in App.tsx instead of BracketScreen**

Move the `room.connect()` / `room.disconnect()` lifecycle to App.tsx. Connect when entering any tournament screen, disconnect when leaving the tournament flow entirely. Pass the `room` object (or its state/actions) as props to BracketScreen.

- [ ] **Step 3: Update BracketScreen to receive tournament room state via props**

Remove the internal `useTournamentRoom()` call. Accept tournament room state and actions as props instead.

- [ ] **Step 4: Commit**

---

### Task 7: Create MatchDetailPanel Component

**Files:**

- Create: `apps/web/src/components/tournament/MatchDetailPanel.tsx`

- [ ] **Step 1: Build the bottom sheet component**

States:

- **Match info**: "Player A vs Player B", game type badge, "Best of 3 — X01 501"
- **Ready button**: shown only if current user is a participant in this match
- **Ready status**: "✓ You are ready" / "Waiting for {opponent}..."
- **Countdown**: large centered number (10, 9, 8...) with "Cancel" button
- **Non-participant view**: read-only match info, no actions

- [ ] **Step 2: Commit**

---

### Task 8: Create MatchReadyModal (Global Alert)

**Files:**

- Create: `apps/web/src/components/tournament/MatchReadyModal.tsx`

- [ ] **Step 1: Build the modal**

Shown at App level when `matchAlert` is set. Full-screen overlay:

- "Your match is ready!"
- "vs {opponentName}"
- Game type + best-of badge
- "Go to Match" button → navigates to BracketScreen
- "Dismiss" button

- [ ] **Step 2: Commit**

---

### Task 9: Wire BracketScreen Match Detail Flow

**Files:**

- Modify: `apps/web/src/screens/BracketScreen.tsx`

- [ ] **Step 1: Replace score modal with MatchDetailPanel**

When a match card is tapped:

- If match is Ready/Waiting and user is a participant → show MatchDetailPanel with ready-up flow
- If match is Running → show "Match in progress" label
- If match is Completed → show result (existing behavior)
- Organiser retains manual score entry as fallback (long-press or separate button)

- [ ] **Step 2: Add onMatchStart callback prop**

When `matchStart` fires (from tournament room state), call `onMatchStart({ matchId, playerNames, playerIds, gameSettings, colyseusRoomId })` — handled by App.tsx.

- [ ] **Step 3: Commit**

---

### Task 10: Wire App.tsx Tournament ↔ Game Flow

**Files:**

- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Add tournament match context state**

```typescript
const [tournamentMatch, setTournamentMatch] = useState<{
  tournamentId: string;
  matchId: number;
  gameSettings: TournamentGameConfig;
  legResults: LegResult[];
  currentLegIndex: number;
  playerNames: string[];
  playerIds: string[];
  colyseusRoomId: string;
} | null>(null);
```

- [ ] **Step 2: Handle onMatchStart from BracketScreen**

1. Store context in `tournamentMatch`
2. Build `SetConfig` from `gameSettings`:
   ```typescript
   const legConfig: LegConfig = { gameType, x01Options, cricketOptions };
   const legs = Array.from({ length: legCount(bestOf) }, () => legConfig);
   const config: SetConfig = {
     format: bestOf,
     legs,
     throwOrder: gameSettings.throwOrder,
   };
   ```
3. Build `OnlineConfig` using the `colyseusRoomId` from the server
4. Navigate to game/cricket screen with `onlineConfig`

- [ ] **Step 3: Handle leg completion → next leg or bracket return**

When a leg ends and `tournamentMatch` is set:

- Track leg result in `tournamentMatch.legResults`
- Check `getSetWinner` — if decided:
  - Call `tournamentRoom.reportMatchGameResult(matchId, winnerUserId, legIndex)`
  - Clear `tournamentMatch`
  - Navigate back to BracketScreen
- If not decided: call existing `handleNextLeg` pattern to start next leg

- [ ] **Step 4: Render global MatchReadyModal**

At App level, outside screen routing:

```tsx
{tournamentRoom.matchAlert && (
  <MatchReadyModal
    opponentName={tournamentRoom.matchAlert.opponentName}
    onGoToMatch={() => {
      setScreen({ name: "bracket", tournamentId: ..., isOnline: true });
      tournamentRoom.clearMatchAlert();
    }}
    onDismiss={() => tournamentRoom.clearMatchAlert()}
  />
)}
```

- [ ] **Step 5: Commit**

---

### Task 11: Integration Testing

- [ ] **Step 1: Add unit tests**

- `getSetWinner` with bo1, bo7, bo9
- `legCount` with all formats

- [ ] **Step 2: Manual end-to-end test**

1. Create tournament (X01 501, best of 3, single elim)
2. Register 4 players
3. Host starts tournament
4. Player A taps their match → hits Ready
5. Player B receives alert → taps "Go to Match" → hits Ready
6. 10-second countdown on both screens
7. Game launches on both devices with X01 501
8. Play leg 1 — winner gets 1-0
9. Leg 2 starts automatically
10. If same player wins → match complete (2-0), bracket advances
11. If different player wins → leg 3 starts (1-1)
12. Decider → winner advances, loser eliminated
13. Final match plays same flow
14. Tournament completes with winner

- [ ] **Step 3: Commit**

---

## Key Design Decisions

1. **Two Colyseus rooms per match**: TournamentRoom (bracket orchestration, readiness, alerts) stays alive for the tournament's duration. A separate X01Room/CricketRoom is created per match for dart-by-dart gameplay. This reuses all existing game infrastructure without modification.

2. **Server creates game rooms**: After countdown, the TournamentRoom server creates the game room and sends the `colyseusRoomId` to both players. This avoids the "who is host?" problem — both players are guests joining a server-created room. The `opponent1` participant is treated as player index 0.

3. **Participant ↔ UserId mapping**: Built once when the tournament starts. Stored in TournamentRoom as `Map<number, string>` (participantId → userId) and reverse. Required for readiness validation, notifications, and result recording.

4. **Best-of tracking**: Client-side via existing `SetState`/`handleNextLeg` pattern. Only the final series result is reported to TournamentRoom. This keeps the game room flow identical to existing online play.

5. **Global alerts**: TournamentRoom connection lives at App.tsx level (not BracketScreen). `MATCH_YOUR_TURN` messages trigger a modal overlay regardless of current screen.

6. **Throw order**: Stored in `TournamentGameConfig.throwOrder`, defaults to `"loser"` (standard darts: loser of previous leg throws first). Reuses existing `handleNextLeg` rotation logic.

7. **Disconnect/forfeit**: 60-second grace period. If a player doesn't reconnect, opponent wins by forfeit. Prevents tournaments from stalling.

8. **Organiser manual override**: Organiser retains ability to manually enter scores as fallback for disputes or technical issues.
