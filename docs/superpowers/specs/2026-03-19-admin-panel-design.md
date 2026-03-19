# Admin Panel — Design Spec

## Context

The Colyseus game server has no visibility into its runtime state beyond logs. The admin panel provides a way for the project owner to monitor active games, connected players, server health, and historical game stats — all behind a simple password gate.

## Approach

Mount `@colyseus/monitor` for the visual room/client dashboard, and add a custom JSON API endpoint for server health and Supabase historical stats. Password-protect both via `express-basic-auth` middleware.

## Architecture

```
/admin/monitor  → @colyseus/monitor (rooms, clients, state inspection)
/admin/api/stats → JSON endpoint (health + Supabase historical stats)
/health          → existing public health check (unchanged)
```

All `/admin/*` routes are behind HTTP Basic Auth with credentials from env vars. CORS middleware is scoped to non-admin routes so admin endpoints are same-origin only.

## Components

### 1. Auth Middleware

- Use `express-basic-auth` with `challenge: true` (browser shows native login dialog)
- Credentials from env vars: `ADMIN_USER` (default: `"admin"`) and `ADMIN_PASSWORD` (required)
- If `ADMIN_PASSWORD` is not set, skip mounting admin routes entirely and log a warning
- Applied to all `/admin/*` routes

### 2. Colyseus Monitor (`/admin/monitor`)

- Install `@colyseus/monitor` (0.16.x to match existing Colyseus version)
- **ESM compatibility note:** The server uses `"type": "module"`. `@colyseus/monitor` may ship as CJS only. Use dynamic `import()` or verify the import works under `tsx` at dev time. If it fails, use `createRequire` from `node:module` as a fallback.
- Mount with `app.use("/admin/monitor", basicAuthMiddleware, monitor())`
- Provides out of the box:
  - Active rooms list with client count, game type, elapsed time
  - Click-into room state inspection (scores, turn, game state)
  - Force-disconnect clients, dispose rooms
  - Send/broadcast messages

### 3. Stats API (`/admin/api/stats`)

Returns JSON with two sections:

```typescript
{
  server: {
    uptime: number;          // seconds
    memoryMB: number;        // process RSS in MB
    nodeVersion: string;
    colyseusVersion: string;
    environment: string;     // NODE_ENV
  },
  history: {
    totalGames: number;
    gamesByType: Record<string, number>;  // { x01: 142, cricket: 105 }
    gamesToday: number;
    gamesThisWeek: number;
  } | null  // null if Supabase not configured
}
```

**Server metrics:** Derived from `process.uptime()`, `process.memoryUsage()`, `process.version`, and `NODE_ENV`. The `colyseusVersion` field is read from `@colyseus/core/package.json` via `createRequire` at startup.

**Historical stats:** Queries Supabase `rooms` table. Note: `supabase-js` does not support `GROUP BY` natively, so `gamesByType` requires separate count queries per known game type (`x01`, `cricket`).

- `totalGames`: `.select("*", { count: "exact", head: true }).eq("status", "finished")`
- `gamesByType`: one count query per game type — `.eq("status", "finished").eq("game_type", type)` for each of `["x01", "cricket"]`
- `gamesToday`: count with `.gte("created_at", todayISO)`
- `gamesThisWeek`: count with `.gte("created_at", weekAgoISO)`

Returns `history: null` if Supabase is not configured (graceful degradation).

## Files to Modify/Create

| File | Action |
|------|--------|
| `apps/server/package.json` | Add `@colyseus/monitor`, `express-basic-auth` dependencies |
| `apps/server/src/index.ts` | Mount auth middleware, monitor, and stats endpoint |

## New Dependencies

- `@colyseus/monitor` ^0.16.0
- `express-basic-auth` ^1.2.1

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ADMIN_PASSWORD` | Yes (for admin) | — | Password for admin panel access |
| `ADMIN_USER` | No | `"admin"` | Username for admin panel access |

## Verification

1. Start server with `ADMIN_PASSWORD=test npm run dev` in `apps/server/`
2. Open `http://localhost:2567/admin/monitor` — should prompt for credentials
3. Enter admin/test — should see Colyseus monitor dashboard
4. `curl -u admin:test http://localhost:2567/admin/api/stats` — should return JSON with server metrics
5. Without auth: both endpoints should return 401
6. Without `ADMIN_PASSWORD` env var: admin routes not mounted, server starts normally
7. Without Supabase env vars: `/admin/api/stats` returns `history: null`, no errors
8. Verify server starts without ESM/CJS import errors for `@colyseus/monitor`
