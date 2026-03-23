import "./env.js"; // must be first — loads .env before other modules read process.env
import { Server } from "@colyseus/core";
import { monitor } from "@colyseus/monitor";
import { WebSocketTransport } from "@colyseus/ws-transport";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import basicAuth from "express-basic-auth";
import { createServer } from "http";
import { createServer as createHttpsServer } from "https";
import { existsSync, readFileSync } from "node:fs";
import { X01Room } from "./rooms/X01Room.js";
import { CricketRoom } from "./rooms/CricketRoom.js";
import { TournamentRoom } from "./rooms/TournamentRoom.js";
import { logger } from "./lib/logger.js";
import { supabaseAdmin } from "./supabaseAdmin.js";

// ── 1.1 Global error handlers ───────────────────────────────────────────────
process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception — shutting down");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "Unhandled rejection — shutting down");
  process.exit(1);
});

const serverPkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf-8"),
) as { dependencies: Record<string, string> };
const colyseusVersion = serverPkg.dependencies["@colyseus/core"] ?? "unknown";

const port = Number(process.env.PORT) || 2567;
const app = express();

// ── 2.3 CORS allowlist ──────────────────────────────────────────────────────
const defaultOrigins =
  "http://localhost:5173,https://localhost:5173,https://192.168.40.151:5173,capacitor://localhost";
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS ?? defaultOrigins).split(",").map((o) => o.trim()),
);

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith("/admin")) return next();
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});
app.use(express.json());

// ── 2.4 Connection rate limiting ─────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per minute per IP
const RATE_WINDOW_MS = 60_000;

function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    next();
    return;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT) {
    logger.warn({ ip }, "Rate limit exceeded");
    res.status(429).json({ error: "Too many requests" });
    return;
  }
  next();
}

app.use(rateLimiter);

// ── 1.3 Enhanced health check ────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
  let supabaseStatus: "connected" | "unavailable" = "unavailable";
  if (supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from("rooms")
        .select("id", { count: "exact", head: true })
        .limit(0);
      supabaseStatus = error ? "unavailable" : "connected";
    } catch {
      supabaseStatus = "unavailable";
    }
  }

  const { activeRoomCount } = await import("./rooms/BaseGameRoom.js");

  res.json({
    status: "ok",
    supabase: supabaseStatus,
    uptime: Math.floor(process.uptime()),
    activeRooms: activeRoomCount(),
  });
});

// Admin panel — only mounted if ADMIN_PASSWORD is set
const adminPassword = process.env.ADMIN_PASSWORD;
if (adminPassword) {
  const adminUser = process.env.ADMIN_USER ?? "admin";
  const authMiddleware = basicAuth({
    users: { [adminUser]: adminPassword },
    challenge: true,
  });

  app.use("/admin/monitor", authMiddleware, monitor());

  app.get("/admin/api/stats", authMiddleware, async (_req, res) => {
    const serverStats = {
      uptime: Math.floor(process.uptime()),
      memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      nodeVersion: process.version,
      colyseusVersion,
      environment: process.env.NODE_ENV ?? "development",
    };

    let history = null;
    if (supabaseAdmin) {
      try {
        const now = new Date();
        const todayISO = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        ).toISOString();
        const weekAgoISO = new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000,
        ).toISOString();

        const [total, x01, cricket, today, week] = await Promise.all([
          supabaseAdmin
            .from("rooms")
            .select("*", { count: "exact", head: true })
            .eq("status", "finished"),
          supabaseAdmin
            .from("rooms")
            .select("*", { count: "exact", head: true })
            .eq("status", "finished")
            .eq("game_type", "x01"),
          supabaseAdmin
            .from("rooms")
            .select("*", { count: "exact", head: true })
            .eq("status", "finished")
            .eq("game_type", "cricket"),
          supabaseAdmin
            .from("rooms")
            .select("*", { count: "exact", head: true })
            .eq("status", "finished")
            .gte("created_at", todayISO),
          supabaseAdmin
            .from("rooms")
            .select("*", { count: "exact", head: true })
            .eq("status", "finished")
            .gte("created_at", weekAgoISO),
        ]);

        history = {
          totalGames: total.count ?? 0,
          gamesByType: { x01: x01.count ?? 0, cricket: cricket.count ?? 0 },
          gamesToday: today.count ?? 0,
          gamesThisWeek: week.count ?? 0,
        };
      } catch (err) {
        logger.error({ err }, "Failed to fetch historical stats");
      }
    }

    res.json({ server: serverStats, history });
  });

  logger.info("Admin panel enabled at /admin/monitor and /admin/api/stats");
} else {
  logger.warn("ADMIN_PASSWORD not set — admin panel disabled");
}

const certPath = new URL("../.certs/cert.pem", import.meta.url);
const keyPath = new URL("../.certs/key.pem", import.meta.url);
const hasCerts = existsSync(certPath) && existsSync(keyPath);

const httpServer = hasCerts
  ? createHttpsServer(
      {
        cert: readFileSync(certPath),
        key: readFileSync(keyPath),
      },
      app,
    )
  : createServer(app);

const server = new Server({
  transport: new WebSocketTransport({
    server: httpServer,
    maxPayload: 1024 * 1024, // 1MB — needed for WebRTC SDP signaling
  }),
});

server.define("x01", X01Room);
server.define("cricket", CricketRoom);
server.define("tournament", TournamentRoom).filterBy(["tournamentId"]);

server.listen(port, "0.0.0.0").then(() => {
  logger.info(
    {
      port,
      env: process.env.NODE_ENV ?? "development",
      https: hasCerts,
    },
    "Colyseus server listening",
  );
});

// ── 3.1 Graceful shutdown ────────────────────────────────────────────────────
function gracefulShutdown(signal: string) {
  logger.info({ signal }, "Received shutdown signal — closing gracefully");
  server.gracefullyShutdown(true).then(() => {
    logger.info({}, "Server shut down gracefully");
    process.exit(0);
  });
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
