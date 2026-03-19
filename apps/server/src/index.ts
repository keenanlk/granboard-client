import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import express from "express";
import { createServer } from "http";
import { X01Room } from "./rooms/X01Room.js";
import { CricketRoom } from "./rooms/CricketRoom.js";
import { logger } from "./lib/logger.js";

const port = Number(process.env.PORT) || 2567;
const app = express();

app.use((req, res, next) => {
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

const httpServer = createServer(app);

const server = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

server.define("x01", X01Room);
server.define("cricket", CricketRoom);

server.listen(port, "0.0.0.0").then(() => {
  logger.info({ port, env: process.env.NODE_ENV ?? "development" }, "Colyseus server listening");
});
