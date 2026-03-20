import { Server } from "@colyseus/core";
import { monitor } from "@colyseus/monitor";
import { WebSocketTransport } from "@colyseus/ws-transport";
import express from "express";
import basicAuth from "express-basic-auth";
import { createServer } from "http";
import { readFileSync } from "node:fs";
import { X01Room } from "./rooms/X01Room.js";
import { CricketRoom } from "./rooms/CricketRoom.js";
import { logger } from "./lib/logger.js";
import { supabaseAdmin } from "./supabaseAdmin.js";

const serverPkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8")) as { dependencies: Record<string, string> };
const colyseusVersion = serverPkg.dependencies["@colyseus/core"] ?? "unknown";

const port = Number(process.env.PORT) || 2567;
const app = express();

// CORS — scoped to non-admin routes
app.use((req, res, next) => {
  if (req.path.startsWith("/admin")) return next();
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
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
        const todayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekAgoISO = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [total, x01, cricket, today, week] = await Promise.all([
          supabaseAdmin.from("rooms").select("*", { count: "exact", head: true }).eq("status", "finished"),
          supabaseAdmin.from("rooms").select("*", { count: "exact", head: true }).eq("status", "finished").eq("game_type", "x01"),
          supabaseAdmin.from("rooms").select("*", { count: "exact", head: true }).eq("status", "finished").eq("game_type", "cricket"),
          supabaseAdmin.from("rooms").select("*", { count: "exact", head: true }).eq("status", "finished").gte("created_at", todayISO),
          supabaseAdmin.from("rooms").select("*", { count: "exact", head: true }).eq("status", "finished").gte("created_at", weekAgoISO),
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

const httpServer = createServer(app);

const server = new Server({
  transport: new WebSocketTransport({
    server: httpServer,
    maxPayload: 1024 * 1024, // 1MB — needed for WebRTC SDP signaling
  }),
});

server.define("x01", X01Room);
server.define("cricket", CricketRoom);

server.listen(port, "0.0.0.0").then(() => {
  logger.info({ port, env: process.env.NODE_ENV ?? "development" }, "Colyseus server listening");
});
